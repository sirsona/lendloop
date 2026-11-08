import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { addDays, dateInNairobi } from "../convex/lib/dates";

export const modules = import.meta.glob("../convex/**/*.ts");

export function makeTest() {
  return convexTest(schema, modules);
}

export function identity(email: string, name: string) {
  return {
    tokenIdentifier: `clerk|${email}`,
    subject: email,
    issuer: "https://example.clerk.accounts.dev",
    email,
    name,
  };
}

export async function seedUsers() {
  const t = makeTest();

  const alice = t.withIdentity(identity("alice@example.com", "Alice"));
  const bob = t.withIdentity(identity("bob@example.com", "Bob"));
  const charlie = t.withIdentity(identity("charlie@example.com", "Charlie"));

  const aliceId = await alice.mutation(api.users.sync, {});
  const bobId = await bob.mutation(api.users.sync, {});
  const charlieId = await charlie.mutation(api.users.sync, {});

  return { t, alice, bob, charlie, aliceId, bobId, charlieId };
}

export function tomorrow() {
  return addDays(dateInNairobi(), 1);
}

export async function createTool(
  actor: ReturnType<typeof makeTest>["withIdentity"] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never,
  name = "Cordless drill",
) {
  return await actor.mutation(api.tools.create, {
    name,
    category: "power_tools" as const,
    condition: "good" as const,
    description: "A reliable cordless drill for neighborhood projects.",
  });
}
