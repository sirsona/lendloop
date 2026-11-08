"use client";

import { api } from "@/convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function BoardPage() {
  const me = useQuery(api.users.me);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          LendLoop
        </Link>
        <UserButton />
      </header>

      <h1 className="mt-10 text-3xl font-bold tracking-tight text-slate-900">
        Your board
      </h1>

      {me === undefined && <p className="mt-4 text-slate-600">Loading…</p>}

      {me === null && (
        <p className="mt-4 text-slate-600">Setting up your account…</p>
      )}

      {me && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-slate-700">
            Signed in as <span className="font-semibold">{me.name}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Role: {me.role}
            {me.trustedLender ? " · Trusted lender" : ""}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Foundation only. Listings and requests arrive in next.
          </p>
        </div>
      )}
    </main>
  );
}
