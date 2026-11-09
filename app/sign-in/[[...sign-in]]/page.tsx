import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckIcon, LoopMark, ShieldCheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sign in" };

const POINTS = [
  "See the full listing: owner, condition, and dates.",
  "Request a tool for the days you actually need it.",
  "Approve or decline requests on your own tools.",
];

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-16">
        <aside className="hidden flex-col justify-center lg:flex">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-card">
            <LoopMark className="size-6" />
          </span>
          <h2 className="mt-6 max-w-md text-3xl font-semibold text-balance text-ink">
            A better way to share what you already own.
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-ink-soft">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-10 flex items-start gap-2 text-xs text-ink-muted">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
            Signed-in neighbors see full listings. Guests only ever see a tool
            name and category.
          </p>
        </aside>
        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <SignIn
              appearance={{ variables: { colorPrimary: "#0f6b4f" } }}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
