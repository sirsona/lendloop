"use client";

import { Show, UserButton, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { LoopMark } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { openSignIn } = useClerk();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl"
          aria-label="LendLoop home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-card">
            <LoopMark className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            LendLoop
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          <Link
            href="/#how"
            className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
          >
            How it works
          </Link>
          <Link
            href="/#trust"
            className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-line/60 hover:text-ink"
          >
            Trust &amp; privacy
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            {/* One CTA only: wrapping a hidden responsive override on Button fought the base display utility. */}
            <Button size="sm" onClick={() => openSignIn({})}>
              Get started
            </Button>
          </Show>
          <Show when="signed-in">
            <Link
              href="/board"
              className="inline-flex min-h-8 items-center rounded-full border border-line-strong bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-ink-muted hover:bg-paper"
            >
              Your board
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
