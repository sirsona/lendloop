import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { writeAudit } from "./lib/audit";
import { requireUser } from "./lib/auth";
import { isHeld, isOverdue } from "./lib/availability";
import { addDays, dateInNairobi } from "./lib/dates";

const categoryValidator = v.union(
  v.literal("power_tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("other"),
);

const conditionValidator = v.union(
  v.literal("new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
);

function cleanText(
  value: string,
  min: number,
  max: number,
  field: string,
) {
  const text = value.trim();

  if (text.length < min || text.length > max) {
    throw new ConvexError(
      `${field} must be between ${min} and ${max} characters.`,
    );
  }

  return text;
}

function groupByTool<T extends { toolId: Id<"tools"> }>(items: T[]) {
  const grouped = new Map<Id<"tools">, T[]>();

  for (const item of items) {
    const current = grouped.get(item.toolId) ?? [];
    current.push(item);
    grouped.set(item.toolId, current);
  }

  return grouped;
}

async function getAvailability(ctx: QueryCtx) {
  const approved = await ctx.db
    .query("borrowRequests")
    .withIndex("by_status", (q) => q.eq("status", "approved"))
    .take(1000);

  const pending = await ctx.db
    .query("borrowRequests")
    .withIndex("by_status", (q) => q.eq("status", "pending"))
    .take(1000);

  return {
    today: dateInNairobi(),
    approvedByTool: groupByTool(approved),
    pendingByTool: groupByTool(pending),
  };
}

function decorateTool(
  tool: Doc<"tools">,
  owner: Doc<"users"> | null,
  approved: Doc<"borrowRequests">[],
  pendingCount: number,
  today: string,
  isMine: boolean,
) {
  const onLoan = approved.some((request) => isHeld(request, today));
  const overdue = approved.some((request) => isOverdue(request, today));

  const upcoming = approved
    .filter((request) => request.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return {
    _id: tool._id,
    name: tool.name,
    category: tool.category,
    condition: tool.condition,
    description: tool.description,
    isRemoved: tool.isRemoved,
    ownerName: owner?.name ?? "Neighbor",
    ownerTrusted: owner?.trustedLender ?? false,
    isMine,
    status: (onLoan ? "on_loan" : "available") as
      | "available"
      | "on_loan",
    isOverdue: overdue,
    pendingRequestCount: pendingCount,
    upcomingReservation: upcoming
      ? {
          startDate: upcoming.startDate,
          returnBy: addDays(upcoming.endDate, -1),
        }
      : null,
  };
}

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const approved = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .take(1000);
    const byTool = groupByTool(approved);
    const today = dateInNairobi();

    const tools = await ctx.db
      .query("tools")
      .withIndex("by_removed", (q) => q.eq("isRemoved", false))
      .take(100);

    return tools
      .filter(
        (tool) =>
          !(byTool.get(tool._id) ?? []).some((request) =>
            isHeld(request, today),
          ),
      )
      .map((tool) => ({
        _id: tool._id,
        name: tool.name,
        category: tool.category,
      }));
  },
});

export const listBoard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const { today, approvedByTool, pendingByTool } =
      await getAvailability(ctx);

    const tools = await ctx.db
      .query("tools")
      .withIndex("by_removed", (q) => q.eq("isRemoved", false))
      .take(100);

    const results = [];

    for (const tool of tools) {
      const owner = await ctx.db.get(tool.ownerId);
      const approved = approvedByTool.get(tool._id) ?? [];
      const pendingCount = (pendingByTool.get(tool._id) ?? []).length;

      results.push(
        decorateTool(
          tool,
          owner,
          approved,
          pendingCount,
          today,
          tool.ownerId === user._id,
        ),
      );
    }

    return results;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const { today, approvedByTool, pendingByTool } =
      await getAvailability(ctx);

    const tools = await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .take(100);

    return tools.map((tool) =>
      decorateTool(
        tool,
        user,
        approvedByTool.get(tool._id) ?? [],
        (pendingByTool.get(tool._id) ?? []).length,
        today,
        true,
      ),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const toolId = await ctx.db.insert("tools", {
      ownerId: user._id,
      name: cleanText(args.name, 2, 80, "Name"),
      category: args.category,
      condition: args.condition,
      description: cleanText(
        args.description,
        10,
        600,
        "Description",
      ),
      isRemoved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "tool.created",
      "tool",
      toolId,
    );

    return toolId;
  },
});

export const update = mutation({
  args: {
    toolId: v.id("tools"),
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(args.toolId);

    if (!tool) throw new ConvexError("Tool not found.");
    if (tool.ownerId !== user._id) {
      throw new ConvexError("You can only edit your own tools.");
    }
    if (tool.isRemoved) {
      throw new ConvexError("Removed tools cannot be edited.");
    }

    await ctx.db.patch(tool._id, {
      name: cleanText(args.name, 2, 80, "Name"),
      category: args.category,
      condition: args.condition,
      description: cleanText(
        args.description,
        10,
        600,
        "Description",
      ),
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "tool.updated",
      "tool",
      tool._id,
    );
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(args.toolId);

    if (!tool) throw new ConvexError("Tool not found.");
    if (tool.ownerId !== user._id) {
      throw new ConvexError("You can only remove your own tools.");
    }
    if (tool.isRemoved) return;

    await ctx.db.patch(tool._id, {
      isRemoved: true,
      removedAt: Date.now(),
      removedBy: user._id,
      updatedAt: Date.now(),
    });

    await writeAudit(
      ctx,
      user._id,
      "tool.removed_by_owner",
      "tool",
      tool._id,
    );
  },
});
