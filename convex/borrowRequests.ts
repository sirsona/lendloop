import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { writeAudit } from "./lib/audit";
import { requireUser } from "./lib/auth";
import { isOverdue } from "./lib/availability";
import {
  addDays,
  dateInNairobi,
  rangesOverlap,
  validateBorrowWindow,
} from "./lib/dates";

function cleanMessage(message?: string) {
  if (!message) return undefined;

  const text = message.trim();

  if (text.length > 300) {
    throw new ConvexError("Message cannot exceed 300 characters.");
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
    throw new ConvexError("Message contains unsupported control characters.");
  }

  return text || undefined;
}

function presentRequest(
  request: Doc<"borrowRequests">,
  tool: Doc<"tools">,
  counterpartyName: string,
  today: string,
) {
  return {
    _id: request._id,
    status: request.status,
    startDate: request.startDate,
    endDate: request.endDate,
    returnBy: addDays(request.endDate, -1),
    message: request.message ?? null,
    createdAt: request.createdAt,
    isOverdue: isOverdue(request, today),
    tool: {
      name: tool.name,
      category: tool.category,
      isRemoved: tool.isRemoved,
    },
    counterpartyName,
  };
}

export const create = mutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    returnBy: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(args.toolId);

    if (!tool) throw new ConvexError("Tool not found.");
    if (tool.isRemoved) {
      throw new ConvexError("This tool is no longer available.");
    }
    if (tool.ownerId === user._id) {
      throw new ConvexError("You cannot request your own tool.");
    }

    const { endDate } = validateBorrowWindow(
      args.startDate,
      args.returnBy,
    );
    const today = dateInNairobi();
    const approved = await ctx.db
      .query("borrowRequests")
      .withIndex("by_tool_status", (q) =>
        q.eq("toolId", tool._id).eq("status", "approved"),
      )
      .take(100);

    if (approved.some((request) => isOverdue(request, today))) {
      throw new ConvexError(
        "This tool has an overdue loan. It cannot be requested until it is returned.",
      );
    }

    if (
      approved.some((request) =>
        rangesOverlap(
          request.startDate,
          request.endDate,
          args.startDate,
          endDate,
        ),
      )
    ) {
      throw new ConvexError(
        "This tool is not available for those dates.",
      );
    }

    const pending = await ctx.db
      .query("borrowRequests")
      .withIndex("by_borrower_status", (q) =>
        q.eq("borrowerId", user._id).eq("status", "pending"),
      )
      .take(100);

    if (
      pending.some(
        (request) =>
          request.toolId === tool._id &&
          rangesOverlap(
            request.startDate,
            request.endDate,
            args.startDate,
            endDate,
          ),
      )
    ) {
      throw new ConvexError(
        "You already have an overlapping pending request for this tool.",
      );
    }

    const requestId = await ctx.db.insert("borrowRequests", {
      toolId: tool._id,
      borrowerId: user._id,
      lenderId: tool.ownerId,
      startDate: args.startDate,
      endDate,
      status: "pending",
      message: cleanMessage(args.message),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "request.created",
      "borrowRequest",
      requestId,
    );

    return requestId;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const today = dateInNairobi();
    const requests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
      .take(100);

    const results = [];

    for (const request of requests) {
      const tool = await ctx.db.get(request.toolId);
      const lender = await ctx.db.get(request.lenderId);
      if (!tool) continue;

      results.push(
        presentRequest(
          request,
          tool,
          lender?.name ?? "Neighbor",
          today,
        ),
      );
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listIncoming = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const today = dateInNairobi();
    const requests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
      .take(100);

    const results = [];

    for (const request of requests) {
      const tool = await ctx.db.get(request.toolId);
      const borrower = await ctx.db.get(request.borrowerId);
      if (!tool) continue;

      results.push(
        presentRequest(
          request,
          tool,
          borrower?.name ?? "Neighbor",
          today,
        ),
      );
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const approve = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request) throw new ConvexError("Request not found.");
    if (request.status !== "pending") {
      throw new ConvexError("Only pending requests can be approved.");
    }
    if (request.lenderId !== user._id) {
      throw new ConvexError("Only the lender can approve this request.");
    }

    const tool = await ctx.db.get(request.toolId);
    if (!tool) throw new ConvexError("Tool not found.");
    if (tool.isRemoved) {
      throw new ConvexError("This tool has been removed.");
    }

    const today = dateInNairobi();
    const approved = await ctx.db
      .query("borrowRequests")
      .withIndex("by_tool_status", (q) =>
        q.eq("toolId", tool._id).eq("status", "approved"),
      )
      .take(100);

    if (approved.some((item) => isOverdue(item, today))) {
      throw new ConvexError(
        "This tool has an overdue loan. Resolve it before approving another request.",
      );
    }

    if (
      approved.some((item) =>
        rangesOverlap(
          item.startDate,
          item.endDate,
          request.startDate,
          request.endDate,
        ),
      )
    ) {
      throw new ConvexError(
        "This tool is already approved for overlapping dates.",
      );
    }

    await ctx.db.patch(request._id, {
      status: "approved",
      decidedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "request.approved",
      "borrowRequest",
      request._id,
    );
  },
});

export const decline = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request) throw new ConvexError("Request not found.");
    if (request.status !== "pending") {
      throw new ConvexError("Only pending requests can be declined.");
    }
    if (request.lenderId !== user._id) {
      throw new ConvexError("Only the lender can decline this request.");
    }

    await ctx.db.patch(request._id, {
      status: "declined",
      decidedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "request.declined",
      "borrowRequest",
      request._id,
    );
  },
});

export const cancel = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request) throw new ConvexError("Request not found.");
    if (request.status !== "pending") {
      throw new ConvexError("Only pending requests can be cancelled.");
    }
    if (request.borrowerId !== user._id) {
      throw new ConvexError("Only the borrower can cancel this request.");
    }

    await ctx.db.patch(request._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "request.cancelled",
      "borrowRequest",
      request._id,
    );
  },
});

export const markReturned = mutation({
  args: { requestId: v.id("borrowRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request) throw new ConvexError("Request not found.");
    if (request.status !== "approved") {
      throw new ConvexError("Only approved loans can be returned.");
    }
    if (
      request.lenderId !== user._id &&
      request.borrowerId !== user._id
    ) {
      throw new ConvexError(
        "Only the lender or borrower can mark this loan returned.",
      );
    }

    await ctx.db.patch(request._id, {
      status: "returned",
      returnedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "request.returned",
      "borrowRequest",
      request._id,
    );
  },
});
