"use client";

import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { SearchIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import {
  TableCard,
  tdClassName,
  thClassName,
  trClassName,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import {
  formatRange,
  isPastDue,
  relativeDue,
  statusLabel,
} from "@/lib/format";
import { categoryLabel } from "@/lib/tool-options";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "approved",
  "declined",
  "returned",
  "cancelled",
] as const;

function statusTone(status: string, overdue: boolean) {
  if (overdue) return "danger" as const;
  if (status === "approved") return "brand" as const;
  if (status === "pending") return "accent" as const;
  return "neutral" as const;
}

export default function AdminLoansPage() {
  const loans = useQuery(api.admin.listAllBorrowRequests, {});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (loans ?? []).filter((loan) => {
      if (status !== "all" && loan.status !== status) return false;
      if (!needle) return true;

      return [loan.toolName, loan.lenderName, loan.borrowerName].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [loans, query, status]);

  const overdue = (loans ?? []).filter(
    (loan) => loan.status === "approved" && isPastDue(loan.returnBy),
  ).length;
  const open = (loans ?? []).filter(
    (loan) => loan.status === "pending" || loan.status === "approved",
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">All loans</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every request on the board. Admins can see state; they cannot act on
            loans they are not part of.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{open} open</Badge>
          <Badge tone={overdue > 0 ? "danger" : "neutral"} dot={overdue > 0}>
            {overdue} overdue
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tool, lender, or borrower"
            aria-label="Search loans"
            className="w-full rounded-xl border border-line-strong bg-paper py-2.5 pr-3 pl-10 text-sm text-ink placeholder:text-ink-muted/80 focus:border-brand"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className="rounded-xl border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : statusLabel(option)}
            </option>
          ))}
        </select>
      </div>

      {loans === undefined ? (
        <Skeleton className="h-80" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">No loans match</p>
          <p className="mt-1 text-sm text-ink-muted">
            {loans.length === 0
              ? "No requests have been made yet."
              : "Try a different search or status."}
          </p>
        </div>
      ) : (
        <>
          <TableCard caption="All borrow requests">
            <thead>
              <tr>
                <th scope="col" className={thClassName}>
                  Tool
                </th>
                <th scope="col" className={thClassName}>
                  Lender
                </th>
                <th scope="col" className={thClassName}>
                  Borrower
                </th>
                <th scope="col" className={thClassName}>
                  Dates
                </th>
                <th scope="col" className={thClassName}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => {
                const late =
                  loan.status === "approved" && isPastDue(loan.returnBy);

                return (
                  <tr key={loan._id} className={trClassName}>
                    <td className={tdClassName}>
                      <p className="font-medium text-ink">{loan.toolName}</p>
                      <p className="text-xs text-ink-muted">
                        {categoryLabel(loan.toolCategory)}
                        {loan.toolRemoved ? " · removed" : ""}
                      </p>
                    </td>
                    <td className={tdClassName}>{loan.lenderName}</td>
                    <td className={tdClassName}>{loan.borrowerName}</td>
                    <td className={cn(tdClassName, "whitespace-nowrap")}>
                      {formatRange(loan.startDate, loan.returnBy)}
                    </td>
                    <td className={tdClassName}>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={statusTone(loan.status, late)} dot>
                          {late ? "Overdue" : statusLabel(loan.status)}
                        </Badge>
                        {loan.status === "approved" ? (
                          <span
                            className={
                              late
                                ? "text-xs font-semibold text-danger"
                                : "text-xs text-ink-muted"
                            }
                          >
                            {relativeDue(loan.returnBy)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
          {loans.length >= 200 ? (
            <p className="text-xs text-ink-muted">
              Showing the latest 200 loans. Pagination is not built yet.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
