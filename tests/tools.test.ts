import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import { createTool, seedUsers } from "./helpers";

describe("tools", () => {
  it("returns only id, name, and category publicly", async () => {
    const { t, alice } = await seedUsers();
    await createTool(alice);

    const tools = await t.query(api.tools.listPublic, {});
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("Cordless drill");
    expect(tools[0].category).toBe("power_tools");
    expect(Object.keys(tools[0]).sort()).toEqual([
      "_id",
      "category",
      "name",
    ]);
  });

  it("hides removed tools publicly", async () => {
    const { t, alice } = await seedUsers();
    const toolId = await createTool(alice);

    await alice.mutation(api.tools.remove, { toolId });

    expect(await t.query(api.tools.listPublic, {})).toHaveLength(0);
  });

  it("rejects edits and removals from another user", async () => {
    const { alice, bob } = await seedUsers();
    const toolId = await createTool(alice);

    await expect(
      bob.mutation(api.tools.update, {
        toolId,
        name: "Hijacked",
        category: "garden",
        condition: "fair",
        description: "This should never be allowed by the backend.",
      }),
    ).rejects.toThrow();

    await expect(
      bob.mutation(api.tools.remove, { toolId }),
    ).rejects.toThrow();
  });
});
