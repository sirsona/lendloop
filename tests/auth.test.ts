import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

describe("users auth foundation", () => {
  it("rejects an unauthenticated sync", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.sync, {})).rejects.toThrow();
  });

  it("creates exactly one user for a Clerk identity", async () => {
    const t = convexTest(schema, modules);

    const alice = t.withIdentity({
      tokenIdentifier: "clerk|alice",
      subject: "alice",
      issuer: "https://example.clerk.accounts.dev",
      email: "alice@example.com",
      name: "Alice",
    });

    await alice.mutation(api.users.sync, {});
    await alice.mutation(api.users.sync, {});

    const me = await alice.query(api.users.me, {});
    expect(me?.email).toBe("alice@example.com");
    expect(me?.role).toBe("user");

    const users = await t.run(async (ctx) => {
      return await ctx.db.query("users").collect();
    });

    expect(users).toHaveLength(1);
  });

  it("does not downgrade an existing admin on sync", async () => {
    const t = convexTest(schema, modules);

    const alice = t.withIdentity({
      tokenIdentifier: "clerk|alice",
      subject: "alice",
      issuer: "https://example.clerk.accounts.dev",
      email: "alice@example.com",
      name: "Alice",
    });

    const id = await alice.mutation(api.users.sync, {});

    await t.run(async (ctx) => {
      await ctx.db.patch(id, { role: "admin" });
    });

    await alice.mutation(api.users.sync, {});

    const me = await alice.query(api.users.me, {});
    expect(me?.role).toBe("admin");
  });
});
