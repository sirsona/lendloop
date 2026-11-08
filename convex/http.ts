import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();
const encoder = new TextEncoder();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function verifyHmac(
  secret: string,
  canonical: string,
  signatureHeader: string | null,
) {
  if (!signatureHeader || !/^v1=[0-9a-f]{64}$/.test(signatureHeader)) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signatureHeader.slice(3)),
    encoder.encode(canonical),
  );
}

function timestampIsFresh(timestamp: string | null) {
  if (!timestamp || !/^\d{13}$/.test(timestamp)) return false;
  return Math.abs(Date.now() - Number(timestamp)) <= 5 * 60 * 1000;
}

async function verifyGet(request: Request, secret: string) {
  const timestamp = request.headers.get("x-lendloop-timestamp");
  const signature = request.headers.get("x-lendloop-signature");
  if (!timestampIsFresh(timestamp) || !timestamp) return false;

  const path = new URL(request.url).pathname;
  return await verifyHmac(
    secret,
    `${timestamp}.GET.${path}`,
    signature,
  );
}

async function verifyPost(
  request: Request,
  rawBody: string,
  secret: string,
) {
  const timestamp = request.headers.get("x-lendloop-timestamp");
  const signature = request.headers.get("x-lendloop-signature");
  if (!timestampIsFresh(timestamp) || !timestamp) return false;

  const path = new URL(request.url).pathname;
  return await verifyHmac(
    secret,
    `${timestamp}.POST.${path}.${rawBody}`,
    signature,
  );
}

function secretOrNull() {
  return process.env.N8N_TO_CONVEX_SECRET ?? null;
}

http.route({
  path: "/api/automation/overdue",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const secret = secretOrNull();
    if (!secret) return json({ error: "Automation secret not configured." }, 503);
    if (!(await verifyGet(request, secret))) {
      return json({ error: "Invalid signature." }, 401);
    }

    const loans = await ctx.runQuery(internal.automation.listOverdue, {});
    return json({ loans });
  }),
});

http.route({
  path: "/api/automation/reminders/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = secretOrNull();
    if (!secret) return json({ error: "Automation secret not configured." }, 503);

    const rawBody = await request.text();
    if (!(await verifyPost(request, rawBody, secret))) {
      return json({ error: "Invalid signature." }, 401);
    }

    let body: {
      borrowRequestId?: string;
      reminderKey?: string;
      channel?: string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    if (
      typeof body.borrowRequestId !== "string" ||
      typeof body.reminderKey !== "string" ||
      typeof body.channel !== "string"
    ) {
      return json({ error: "Missing claim fields." }, 400);
    }

    const result = await ctx.runMutation(
      internal.automation.claimReminder,
      {
        borrowRequestId: body.borrowRequestId as Id<"borrowRequests">,
        reminderKey: body.reminderKey,
        channel: body.channel,
      },
    );

    return json(result);
  }),
});

http.route({
  path: "/api/automation/reminders/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = secretOrNull();
    if (!secret) return json({ error: "Automation secret not configured." }, 503);

    const rawBody = await request.text();
    if (!(await verifyPost(request, rawBody, secret))) {
      return json({ error: "Invalid signature." }, 401);
    }

    let body: {
      borrowRequestId?: string;
      reminderKey?: string;
      leaseToken?: string;
      status?: string;
      providerMessageId?: string;
      error?: string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    if (
      typeof body.borrowRequestId !== "string" ||
      typeof body.reminderKey !== "string" ||
      typeof body.leaseToken !== "string" ||
      (body.status !== "sent" && body.status !== "failed")
    ) {
      return json({ error: "Missing completion fields." }, 400);
    }

    const result = await ctx.runMutation(
      internal.automation.completeReminder,
      {
        borrowRequestId: body.borrowRequestId as Id<"borrowRequests">,
        reminderKey: body.reminderKey,
        leaseToken: body.leaseToken,
        status: body.status,
        ...(body.providerMessageId
          ? { providerMessageId: body.providerMessageId }
          : {}),
        ...(body.error ? { error: body.error } : {}),
      },
    );

    return json(result);
  }),
});

http.route({
  path: "/api/automation/errors",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = secretOrNull();
    if (!secret) return json({ error: "Automation secret not configured." }, 503);

    const rawBody = await request.text();
    if (!(await verifyPost(request, rawBody, secret))) {
      return json({ error: "Invalid signature." }, 401);
    }

    let body: {
      workflow?: string;
      executionId?: string;
      message?: string;
      occurredAt?: string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    if (typeof body.workflow !== "string" || typeof body.message !== "string") {
      return json({ error: "Missing error fields." }, 400);
    }

    const id = await ctx.runMutation(
      internal.automation.recordWorkflowError,
      {
        workflow: body.workflow,
        message: body.message,
        ...(body.executionId ? { executionId: body.executionId } : {}),
        ...(body.occurredAt ? { occurredAt: body.occurredAt } : {}),
      },
    );

    return json({ ok: true, eventId: id });
  }),
});

export default http;
