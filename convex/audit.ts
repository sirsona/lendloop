import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_created")
      .order("desc")
      .take(100);
  },
});
