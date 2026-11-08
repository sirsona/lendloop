import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { writeAudit } from "./lib/audit";
import { requireAdmin } from "./lib/auth";
import { addDays } from "./lib/dates";

export const listAllBorrowRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const requests = await ctx.db.query("borrowRequests").take(200);

    const results = [];

    for (const request of requests) {
      const tool = await ctx.db.get(request.toolId);
      const lender = await ctx.db.get(request.lenderId);
      const borrower = await ctx.db.get(request.borrowerId);

      if (!tool) continue;

      results.push({
        _id: request._id,
        status: request.status,
        startDate: request.startDate,
        returnBy: addDays(request.endDate, -1),
        toolName: tool.name,
        toolCategory: tool.category,
        toolRemoved: tool.isRemoved,
        lenderName: lender?.name ?? "Neighbor",
        borrowerName: borrower?.name ?? "Neighbor",
      });
    }

    return results.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").take(200);

    return users
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        trustedLender: user.trustedLender,
        createdAt: user.createdAt,
      }));
  },
});
export const setTrustedLender = mutation({
  args: {
    userId: v.id("users"),
    trusted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);

    if (!user) throw new Error("User not found.");

    await ctx.db.patch(user._id, {
      trustedLender: args.trusted,
    });

    await writeAudit(
      ctx,
      admin._id,
      "admin.trusted_lender_changed",
      "user",
      user._id,
      JSON.stringify({ trusted: args.trusted }),
    );
  },
});
export const adminRemove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const tool = await ctx.db.get(args.toolId);

    if (!tool) throw new ConvexError("Tool not found.");
    if (tool.isRemoved) return;

    await ctx.db.patch(tool._id, {
      isRemoved: true,
      removedAt: Date.now(),
      removedBy: admin._id,
      updatedAt: Date.now(),
    });

    await writeAudit(ctx, admin._id, "tool.removed_by_admin", "tool", tool._id);
  },
});
