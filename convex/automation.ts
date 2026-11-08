import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { requireUser } from "./lib/auth";
import { dateInNairobi, addDays, daysBetween } from "./lib/dates";

export const listForLoan = query({
  args: { borrowRequestId: v.id("borrowRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.borrowRequestId);

    if (!request) throw new ConvexError("Request not found.");

    const isParty =
      request.borrowerId === user._id ||
      request.lenderId === user._id;

    if (user.role !== "admin" && !isParty) {
      throw new ConvexError("You cannot view this activity.");
    }

    const events = await ctx.db
      .query("automationEvents")
      .withIndex("by_borrow_request", (q) =>
        q.eq("borrowRequestId", request._id),
      )
      .take(20);

    return events
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((event) => ({
        _id: event._id,
        kind: event.kind,
        status: event.status,
        eventType: event.eventType ?? null,
        createdAt: event.createdAt,
      }));
  },
});

export const getNotificationContext = internalQuery({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event?.borrowRequestId) return null;

    const request = await ctx.db.get(event.borrowRequestId);
    if (!request) return null;

    const tool = await ctx.db.get(request.toolId);
    if (!tool) return null;

    const borrower = await ctx.db.get(request.borrowerId);
    const lender = await ctx.db.get(request.lenderId);

    const recipient =
      event.eventType === "request_created" ||
      event.eventType === "loan_returned"
        ? lender
        : borrower;

    const actor =
      event.eventType === "request_created" ||
      event.eventType === "request_cancelled"
        ? borrower
        : lender;

    if (!recipient) return null;

    return {
      eventId: event._id,
      eventType: event.eventType ?? "unknown",
      borrowRequestId: request._id,
      toolName: tool.name,
      status: request.status,
      startDate: request.startDate,
      returnBy: addDays(request.endDate, -1),
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      actorName: actor?.name ?? "A neighbor",
    };
  },
});

export const beginOutboundEvent = internalMutation({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    if (event.status === "sent" || event.status === "skipped") return null;
    if (event.status === "failed" && event.attempts >= 5) return null;

    const now = Date.now();
    if (
      event.status === "processing" &&
      (event.leaseExpiresAt ?? 0) > now
    ) {
      return null;
    }

    const leaseToken = crypto.randomUUID();
    const attempts = event.attempts + 1;

    await ctx.db.patch(event._id, {
      status: "processing",
      attempts,
      leaseToken,
      leaseExpiresAt: now + 10 * 60 * 1000,
      updatedAt: now,
    });

    return { eventId: event._id, leaseToken, attempts };
  },
});

export const markOutboundSent = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    leaseToken: v.string(),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.leaseToken !== args.leaseToken) return;

    await ctx.db.patch(event._id, {
      status: "sent",
      processedAt: Date.now(),
      updatedAt: Date.now(),
      leaseExpiresAt: Date.now(),
      ...(args.providerMessageId
        ? { providerMessageId: args.providerMessageId }
        : {}),
    });
  },
});

export const markOutboundFailed = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    leaseToken: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.leaseToken !== args.leaseToken) {
      return { attempts: event?.attempts ?? 0 };
    }

    await ctx.db.patch(event._id, {
      status: "failed",
      lastError: args.error.slice(0, 300),
      leaseExpiresAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { attempts: event.attempts };
  },
});

export const markOutboundSkipped = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    leaseToken: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.leaseToken !== args.leaseToken) return;

    await ctx.db.patch(event._id, {
      status: "skipped",
      lastError: args.reason.slice(0, 300),
      processedAt: Date.now(),
      updatedAt: Date.now(),
      leaseExpiresAt: Date.now(),
    });
  },
});

export const listOverdue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = dateInNairobi();
    const requests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .take(1000);

    const results = [];

    for (const request of requests) {
      if (request.endDate > today) continue;

      const tool = await ctx.db.get(request.toolId);
      const borrower = await ctx.db.get(request.borrowerId);
      if (!tool || !borrower) continue;

      results.push({
        borrowRequestId: request._id,
        reminderKey: `reminder:${request._id}:${today}`,
        toolName: tool.name,
        borrowerName: borrower.name,
        borrowerEmail: borrower.email,
        returnBy: addDays(request.endDate, -1),
        daysOverdue: daysBetween(request.endDate, today),
      });
    }

    return results;
  },
});

export const claimReminder = internalMutation({
  args: {
    borrowRequestId: v.id("borrowRequests"),
    reminderKey: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.borrowRequestId);
    const today = dateInNairobi();

    if (
      !request ||
      request.status !== "approved" ||
      request.endDate > today
    ) {
      return { status: "not_applicable" as const };
    }

    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_idempotency", (q) =>
        q.eq("idempotencyKey", args.reminderKey),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      if (existing.status === "sent") {
        return { status: "already_sent" as const };
      }
      if (existing.status === "skipped") {
        return { status: "not_applicable" as const };
      }
      if (
        existing.status === "processing" &&
        (existing.leaseExpiresAt ?? 0) > now
      ) {
        return { status: "busy" as const };
      }
      if (existing.status === "failed" && existing.attempts >= 3) {
        return { status: "exhausted" as const };
      }

      const leaseToken = crypto.randomUUID();
      const attempts = existing.attempts + 1;

      await ctx.db.patch(existing._id, {
        status: "processing",
        attempts,
        leaseToken,
        leaseExpiresAt: now + 10 * 60 * 1000,
        updatedAt: now,
      });

      return {
        status: "claimed" as const,
        leaseToken,
        attempt: attempts,
        borrowRequestId: request._id,
        reminderKey: args.reminderKey,
      };
    }

    const leaseToken = crypto.randomUUID();

    await ctx.db.insert("automationEvents", {
      borrowRequestId: request._id,
      kind: "overdue_reminder",
      status: "processing",
      idempotencyKey: args.reminderKey,
      eventType: "overdue_reminder",
      attempts: 1,
      leaseToken,
      leaseExpiresAt: now + 10 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
    });

    return {
      status: "claimed" as const,
      leaseToken,
      attempt: 1,
      borrowRequestId: request._id,
      reminderKey: args.reminderKey,
    };
  },
});

export const completeReminder = internalMutation({
  args: {
    borrowRequestId: v.id("borrowRequests"),
    reminderKey: v.string(),
    leaseToken: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("automationEvents")
      .withIndex("by_idempotency", (q) =>
        q.eq("idempotencyKey", args.reminderKey),
      )
      .unique();

    if (!event) return { ok: false, error: "missing" as const };
    if (event.status === "sent") return { ok: true, duplicate: true };

    if (event.leaseToken !== args.leaseToken) {
      return { ok: false, error: "stale" as const };
    }

    const now = Date.now();

    if (args.status === "sent") {
      await ctx.db.patch(event._id, {
        status: "sent",
        processedAt: now,
        updatedAt: now,
        leaseExpiresAt: now,
        ...(args.providerMessageId
          ? { providerMessageId: args.providerMessageId }
          : {}),
      });
    } else {
      await ctx.db.patch(event._id, {
        status: "failed",
        lastError: (args.error ?? "Reminder delivery failed.").slice(0, 300),
        leaseExpiresAt: now,
        updatedAt: now,
      });
    }

    return { ok: true, duplicate: false };
  },
});

export const recordWorkflowError = internalMutation({
  args: {
    workflow: v.string(),
    executionId: v.optional(v.string()),
    message: v.string(),
    occurredAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = `error:${args.workflow}:${
      args.executionId ?? args.occurredAt ?? Date.now()
    }`;
    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_idempotency", (q) =>
        q.eq("idempotencyKey", key),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("automationEvents", {
      kind: "workflow_error",
      status: "failed",
      idempotencyKey: key,
      eventType: "workflow_error",
      attempts: 1,
      lastError: args.message.slice(0, 300),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
