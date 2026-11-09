import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckIcon, LoopMark, ShieldCheckIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Create an account" };

const POINTS = [
  "List the tools you are happy to lend.",
  "Set the dates for each loan on your terms.",
  "Keep a clear record of what is out and when it is due.",
];

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-16">
        <aside className="hidden flex-col justify-center lg:flex">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-card">
            <LoopMark className="size-6" />
          </span>
          <h2 className="mt-6 max-w-md text-3xl font-semibold text-balance text-ink">
            Join the board in under two minutes.
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
            You approve every request. No fee, no automatic bookings.
          </p>
        </aside>
        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <SignUp
              appearance={{ variables: { colorPrimary: "#0f6b4f" } }}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
