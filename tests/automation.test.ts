import { describe, expect, it } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { addDays, dateInNairobi } from "../convex/lib/dates";
import { createTool, seedUsers } from "./helpers";

describe("automation", () => {
  it("claims a daily reminder once, locks it, then completes it", async () => {
    const { t, alice, bobId, aliceId } = await seedUsers();
    const toolId = await createTool(alice);
    const today = dateInNairobi();

    const requestId = await t.run(async (ctx) => {
      return await ctx.db.insert("borrowRequests", {
        toolId,
        borrowerId: bobId,
        lenderId: aliceId,
        startDate: addDays(today, -5),
        endDate: addDays(today, -2),
        status: "approved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const reminderKey = `reminder:${requestId}:${today}`;

    const first = await t.mutation(internal.automation.claimReminder, {
      borrowRequestId: requestId,
      reminderKey,
      channel: "email",
    });

    if (first.status !== "claimed") {
      throw new Error(`Expected claimed, got ${first.status}`);
    }
    expect(first.leaseToken).toBeTruthy();
    expect(first.borrowRequestId).toBe(requestId);
    expect(first.reminderKey).toBe(reminderKey);

    const second = await t.mutation(internal.automation.claimReminder, {
      borrowRequestId: requestId,
      reminderKey,
      channel: "email",
    });
    expect(second.status).toBe("busy");

    const complete = await t.mutation(internal.automation.completeReminder, {
      borrowRequestId: requestId,
      reminderKey,
      leaseToken: first.leaseToken,
      status: "sent",
      providerMessageId: "mock-1",
    });
    expect(complete.ok).toBe(true);

    const third = await t.mutation(internal.automation.claimReminder, {
      borrowRequestId: requestId,
      reminderKey,
      channel: "email",
    });
    expect(third.status).toBe("already_sent");
  });

  it("does not claim a reminder after the loan is returned", async () => {
    const { t, alice, bobId, aliceId } = await seedUsers();
    const toolId = await createTool(alice);
    const today = dateInNairobi();

    const requestId = await t.run(async (ctx) => {
      return await ctx.db.insert("borrowRequests", {
        toolId,
        borrowerId: bobId,
        lenderId: aliceId,
        startDate: addDays(today, -5),
        endDate: addDays(today, -2),
        status: "approved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await alice.mutation(api.borrowRequests.markReturned, { requestId });

    const result = await t.mutation(internal.automation.claimReminder, {
      borrowRequestId: requestId,
      reminderKey: `reminder:${requestId}:${today}`,
      channel: "email",
    });
    expect(result.status).toBe("not_applicable");
  });
});
