"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/board", label: "Browse" },
  { href: "/board/listings", label: "My listings" },
  { href: "/board/requests", label: "My requests" },
  { href: "/board/incoming", label: "Incoming" },
];

function ShellSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </main>
  );
}

function AccountSetup() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <Spinner className="size-6 text-brand" />
      <h1 className="mt-5 text-2xl font-semibold text-ink">
        Setting up your account
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        We are linking your sign-in to the board. This usually takes a second.
      </p>
      <Button
        variant="secondary"
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    </main>
  );
}

export function BoardShell({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me);
  const pathname = usePathname();

  if (me === undefined) return <ShellSkeleton />;
  if (me === null) return <AccountSetup />;

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <nav
            aria-label="Board sections"
            className="no-scrollbar -mb-px flex gap-1 overflow-x-auto py-2"
          >
            {LINKS.map((link) => {
              const active =
                link.href === "/board"
                  ? pathname === "/board"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "text-ink-soft hover:bg-line/60 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {me.role === "admin" ? (
            <Link
              href="/admin"
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-muted sm:inline-flex"
            >
              <ShieldCheckIcon className="size-3.5 text-brand" />
              Admin
            </Link>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
