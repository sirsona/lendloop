"use client";

import Link from "next/link";
import { AlertIcon } from "@/components/icons";
import { Button, buttonStyles } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        <AlertIcon className="size-6" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        This page could not load. It is usually a temporary connection problem.
        Try again, and if it keeps happening, reload the page.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-ink-muted">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          Back to the board
        </Link>
      </div>
    </main>
  );
}
