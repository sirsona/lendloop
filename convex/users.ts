import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { currentUser } from "./lib/auth";

function claimIsTrue(value: unknown) {
  return value === true || value === "true";
}

function hasVerifiedEmail(identity: unknown) {
  const claims = identity as {
    emailVerified?: unknown;
    email_verified?: unknown;
  };

  return (
    claimIsTrue(claims.emailVerified) || claimIsTrue(claims.email_verified)
  );
}

export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const email = identity.email?.trim().toLowerCase() ?? "";
    const name = identity.name?.trim() || email || "Neighbor";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      const patch: { name?: string; email?: string } = {};

      if (name) patch.name = name;
      if (email) patch.email = email;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }

      return existing._id;
    }

    const allowlist = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    const role =
      hasVerifiedEmail(identity) && allowlist.includes(email)
        ? "admin"
        : "user";

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name,
      email,
      role,
      trustedLender: false,
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await currentUser(ctx);
  },
});

export const provisionAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) {
      throw new Error("That user must sign in once before being promoted.");
    }

    await ctx.db.patch(user._id, { role: "admin" });
  },
});
