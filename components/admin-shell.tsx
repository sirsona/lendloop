"use client";

import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheckIcon } from "@/components/icons";
import { Button, buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/admin", label: "Loans" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me);
  const pathname = usePathname();
  const { openSignIn } = useClerk();

  if (me === undefined) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
        <Skeleton className="mt-8 h-80 w-full" />
      </main>
    );
  }

  if (me === null) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <ShieldCheckIcon className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          The admin console is limited to moderated accounts.
        </p>
        <Button className="mt-6" onClick={() => openSignIn({})}>
          Sign in
        </Button>
      </main>
    );
  }

  if (me.role !== "admin") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-surface text-ink-muted shadow-card">
          <ShieldCheckIcon className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          This area is for moderation and audit. Your account does not have
          admin access.
        </p>
        <Link
          href="/board"
          className={buttonStyles({ variant: "secondary", className: "mt-6" })}
        >
          Back to your board
        </Link>
      </main>
    );
  }

  return (
    <>
      <div className="bg-ink text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheckIcon className="size-3.5 text-brand-line" />
            Admin console
          </p>
          <Link
            href="/board"
            className="text-xs font-semibold text-white/80 transition-colors hover:text-white"
          >
            Back to board
          </Link>
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 sm:px-6">
          <nav
            aria-label="Admin sections"
            className="no-scrollbar -mb-px flex gap-1 overflow-x-auto py-2"
          >
            {LINKS.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
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
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
