"use client";

import { api } from "@/convex/_generated/api";
import { categoryLabel } from "@/lib/tool-options";
import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

type Tab = "loans" | "users" | "listings" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "loans", label: "All loans" },
  { id: "users", label: "Users" },
  { id: "listings", label: "Listings" },
  { id: "audit", label: "Audit log" },
];

function Status({ value }: { value: string }) {
  const tone =
    value === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : value === "pending"
        ? "bg-amber-100 text-amber-800"
        : value === "returned"
          ? "bg-slate-100 text-slate-600"
          : "bg-red-100 text-red-800";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {value}
    </span>
  );
}

export default function AdminPage() {
  const me = useQuery(api.users.me);
  const isAdmin = me?.role === "admin";
  const adminArgs = isAdmin ? {} : "skip";

  const loans = useQuery(api.admin.listAllBorrowRequests, adminArgs);
  const users = useQuery(api.admin.listUsers, adminArgs);
  const listings = useQuery(api.tools.listBoard, adminArgs);
  const audit = useQuery(api.audit.list, adminArgs);

  const setTrustedLender = useMutation(api.admin.setTrustedLender);
  const adminRemove = useMutation(api.admin.adminRemove);

  const [tab, setTab] = useState<Tab>("loans");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (me === undefined) {
    return <p className="p-8">Loading…</p>;
  }
  if (me === null) {
    return <p className="p-8">Setting up your account…</p>;
  }
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-3 text-slate-600">
          You do not have access to the admin dashboard.
        </p>
        <Link href="/board" className="mt-5 inline-block text-sm font-semibold text-emerald-700">
          Back to board
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          LendLoop
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/board" className="text-sm font-medium text-slate-600">
            Board
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Moderation and audit
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Admin visibility is limited to moderation. Request transitions remain party-only.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "loans" && (
        <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Lender</th>
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(loans ?? []).map((loan) => (
                <tr key={loan._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{loan.toolName}</p>
                    <p className="text-xs text-slate-500">
                      {categoryLabel(loan.toolCategory)}
                      {loan.toolRemoved ? " · removed" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">{loan.lenderName}</td>
                  <td className="px-4 py-3">{loan.borrowerName}</td>
                  <td className="px-4 py-3">
                    {loan.startDate} → {loan.returnBy}
                  </td>
                  <td className="px-4 py-3">
                    <Status value={loan.status} />
                  </td>
                </tr>
              ))}
              {loans && loans.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No loans yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {tab === "users" && (
        <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Trusted lender</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => (
                <tr key={user._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        run(() =>
                          setTrustedLender({
                            userId: user._id,
                            trusted: !user.trustedLender,
                          }),
                        )
                      }
                      disabled={busy}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {user.trustedLender ? "Remove trusted" : "Mark trusted"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "listings" && (
        <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(listings ?? []).map((tool) => (
                <tr key={tool._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-xs text-slate-500">
                      {categoryLabel(tool.category)}
                    </p>
                  </td>
                  <td className="px-4 py-3">{tool.ownerName}</td>
                  <td className="px-4 py-3">
                    {tool.isOverdue ? "overdue" : tool.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">{tool.pendingRequestCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => run(() => adminRemove({ toolId: tool._id }))}
                      disabled={busy}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "audit" && (
        <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
              </tr>
            </thead>
            <tbody>
              {(audit ?? []).map((log) => (
                <tr key={log._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.actorId}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.resourceType}/{log.resourceId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
