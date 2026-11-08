import { PublicToolGrid } from "@/components/public-tool-grid";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        LendLoop
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
        Borrow what you need. Lend what you don’t.
      </h1>

      <p className="mt-4 max-w-xl text-lg text-slate-600">
        A neighborhood tool board for borrowing and lending without the awkward
        group-chat negotiation.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Sign in to lend or borrow
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <Link
            href="/board"
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open board
          </Link>
          <UserButton />
        </Show>
      </div>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-slate-900">
          Available tools
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Public listings show only the tool and category.
        </p>
        <div className="mt-4">
          <PublicToolGrid />
        </div>
      </section>
    </main>
  );
}
