import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { addDays, dateInNairobi } from "../convex/lib/dates";
import { createTool, seedUsers, tomorrow } from "./helpers";

describe("borrow requests", () => {
  it("runs the request -> approve -> return flow", async () => {
    const { alice, bob } = await seedUsers();
    const toolId = await createTool(alice);
    const startDate = tomorrow();
    const returnBy = addDays(startDate, 2);

    const requestId = await bob.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy,
      message: "I need this for a shelf.",
    });

    const incoming = await alice.query(api.borrowRequests.listIncoming, {});
    expect(incoming).toHaveLength(1);
    expect(incoming[0].status).toBe("pending");
    expect(incoming[0].counterpartyName).toBe("Bob");

    await alice.mutation(api.borrowRequests.approve, { requestId });

    const mine = await bob.query(api.borrowRequests.listMine, {});
    expect(mine[0].status).toBe("approved");
    expect(mine[0].returnBy).toBe(returnBy);

    await bob.mutation(api.borrowRequests.markReturned, { requestId });

    const returned = await bob.query(api.borrowRequests.listMine, {});
    expect(returned[0].status).toBe("returned");
  });

  it("rejects own-tool requests and past dates", async () => {
    const { alice, bob } = await seedUsers();
    const toolId = await createTool(alice);
    const startDate = tomorrow();

    await expect(
      alice.mutation(api.borrowRequests.create, {
        toolId,
        startDate,
        returnBy: startDate,
      }),
    ).rejects.toThrow();

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId,
        startDate: addDays(dateInNairobi(), -1),
        returnBy: tomorrow(),
      }),
    ).rejects.toThrow();
  });

  it("enforces the 90-day boundary", async () => {
    const { alice, bob } = await seedUsers();
    const firstTool = await createTool(alice, "Tool A");
    const secondTool = await createTool(alice, "Tool B");
    const today = dateInNairobi();
    const ninetyDayReturn = addDays(today, 89);
    const ninetyOneDayReturn = addDays(today, 90);

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId: firstTool,
        startDate: today,
        returnBy: ninetyDayReturn,
      }),
    ).resolves.toBeTruthy();

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId: secondTool,
        startDate: today,
        returnBy: ninetyOneDayReturn,
      }),
    ).rejects.toThrow();
  });

  it("blocks duplicate overlapping pending requests and approved overlaps", async () => {
    const { alice, bob } = await seedUsers();
    const toolId = await createTool(alice);
    const startDate = tomorrow();
    const returnBy = addDays(startDate, 2);

    const requestId = await bob.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy,
    });

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId,
        startDate,
        returnBy,
      }),
    ).rejects.toThrow();

    await alice.mutation(api.borrowRequests.approve, { requestId });

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId,
        startDate,
        returnBy,
      }),
    ).rejects.toThrow();
  });

  it("blocks approval after the listing is removed", async () => {
    const { alice, bob } = await seedUsers();
    const toolId = await createTool(alice);
    const startDate = tomorrow();

    const requestId = await bob.mutation(api.borrowRequests.create, {
      toolId,
      startDate,
      returnBy: startDate,
    });

    await alice.mutation(api.tools.remove, { toolId });

    await expect(
      alice.mutation(api.borrowRequests.approve, { requestId }),
    ).rejects.toThrow();

    await bob.mutation(api.borrowRequests.cancel, { requestId });
    const mine = await bob.query(api.borrowRequests.listMine, {});
    expect(mine[0].status).toBe("cancelled");
  });

  it("blocks a tool with an overdue unreturned loan until it is returned", async () => {
    const { t, alice, bob, aliceId, bobId } = await seedUsers();
    const toolId = await createTool(alice);
    const today = dateInNairobi();
    const pastStart = addDays(today, -5);
    const pastEnd = addDays(today, -2);

    const overdueId = await t.run(async (ctx) => {
      return await ctx.db.insert("borrowRequests", {
        toolId,
        borrowerId: bobId,
        lenderId: aliceId,
        startDate: pastStart,
        endDate: pastEnd,
        status: "approved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    expect(await t.query(api.tools.listPublic, {})).toHaveLength(0);

    await expect(
      bob.mutation(api.borrowRequests.create, {
        toolId,
        startDate: tomorrow(),
        returnBy: addDays(tomorrow(), 1),
      }),
    ).rejects.toThrow();

    await alice.mutation(api.borrowRequests.markReturned, {
      requestId: overdueId,
    });

    expect(await t.query(api.tools.listPublic, {})).toHaveLength(1);
  });
});
