import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { addDays } from "../convex/lib/dates";
import { createTool, seedUsers, tomorrow } from "./helpers";

describe("admin", () => {
  it("rejects admin queries and mutations for normal users", async () => {
    const { bob, aliceId } = await seedUsers();
    const toolId = await createTool(bob, "Bob's ladder");

    await expect(bob.query(api.admin.listUsers, {})).rejects.toThrow();
    await expect(
      bob.query(api.admin.listAllBorrowRequests, {}),
    ).rejects.toThrow();
    await expect(bob.query(api.audit.list, {})).rejects.toThrow();
    await expect(
      bob.mutation(api.admin.setTrustedLender, {
        userId: aliceId,
        trusted: true,
      }),
    ).rejects.toThrow();
    await expect(
      bob.mutation(api.admin.adminRemove, { toolId }),
    ).rejects.toThrow();
  });

  it("lets an admin view users, loans, and audit logs", async () => {
    const { t, alice, bob, charlie, aliceId } = await seedUsers();

    await t.run(async (ctx) => {
      await ctx.db.patch(aliceId, { role: "admin" });
    });

    const toolId = await createTool(bob, "Bob's ladder");
    const startDate = tomorrow();

    await charlie.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy: addDays(startDate, 1),
    });

    const users = await alice.query(api.admin.listUsers, {});
    expect(users).toHaveLength(3);

    const loans = await alice.query(api.admin.listAllBorrowRequests, {});
    expect(loans).toHaveLength(1);
    expect(loans[0].toolName).toBe("Bob's ladder");
    expect(loans[0].lenderName).toBe("Bob");
    expect(loans[0].borrowerName).toBe("Charlie");

    const logs = await alice.query(api.audit.list, {});
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((log) => log.action === "request.created")).toBe(true);
  });

  it("lets an admin mark a lender trusted and audits the change", async () => {
    const { t, alice, bob, aliceId, bobId } = await seedUsers();

    await t.run(async (ctx) => {
      await ctx.db.patch(aliceId, { role: "admin" });
    });

    await alice.mutation(api.admin.setTrustedLender, {
      userId: bobId,
      trusted: true,
    });

    const bobMe = await bob.query(api.users.me, {});
    expect(bobMe?.trustedLender).toBe(true);

    const logs = await t.run(async (ctx) => {
      return await ctx.db.query("auditLogs").collect();
    });

    expect(
      logs.some(
        (log) =>
          log.action === "admin.trusted_lender_changed" &&
          log.resourceId === bobId,
      ),
    ).toBe(true);
  });

  it("lets an admin remove another user's listing and preserves history", async () => {
    const { t, alice, bob, charlie, aliceId } = await seedUsers();

    await t.run(async (ctx) => {
      await ctx.db.patch(aliceId, { role: "admin" });
    });

    const toolId = await createTool(bob, "Bob's ladder");
    const startDate = tomorrow();

    await charlie.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy: addDays(startDate, 1),
    });

    await alice.mutation(api.admin.adminRemove, { toolId });

    const tool = await t.run(async (ctx) => {
      return await ctx.db.get(toolId);
    });
    expect(tool?.isRemoved).toBe(true);

    const charlieRequests = await charlie.query(
      api.borrowRequests.listMine,
      {},
    );
    expect(charlieRequests).toHaveLength(1);
    expect(charlieRequests[0].tool.isRemoved).toBe(true);

    const logs = await alice.query(api.audit.list, {});
    expect(logs.some((log) => log.action === "tool.removed_by_admin")).toBe(
      true,
    );
  });

  it("does not let an admin act on requests where they are not a party", async () => {
    const { t, alice, bob, charlie, aliceId } = await seedUsers();

    await t.run(async (ctx) => {
      await ctx.db.patch(aliceId, { role: "admin" });
    });

    const toolId = await createTool(bob, "Bob's saw");
    const startDate = tomorrow();

    const requestId = await charlie.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy: addDays(startDate, 1),
    });

    await expect(
      alice.mutation(api.borrowRequests.approve, { requestId }),
    ).rejects.toThrow();
  });
});
