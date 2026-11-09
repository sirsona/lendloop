"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "@/components/icons";
import {
  addDays,
  formatDay,
  formatRange,
  relativeDue,
  statusLabel,
} from "@/lib/format";
import type { ReactNode } from "react";

export type RequestItem = FunctionReturnType<
  typeof api.borrowRequests.listMine
>[number];

export function RequestCard({
  request,
  side,
  actions,
}: {
  request: RequestItem;
  side: "borrower" | "lender";
  actions?: ReactNode;
}) {
  const overdue = request.isOverdue;
  const tone = overdue
    ? "danger"
    : request.status === "approved"
      ? "brand"
      : request.status === "pending"
        ? "accent"
        : "neutral";

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar
            name={request.counterpartyName}
            className="mt-0.5 size-9 text-xs"
          />
          <div>
            <h3 className="text-base font-semibold text-ink">
              {request.tool.name}
            </h3>
            <p className="mt-0.5 text-sm text-ink-muted">
              {side === "borrower" ? "Lender" : "Borrower"} ·{" "}
              {request.counterpartyName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {request.tool.isRemoved ? (
            <Badge tone="neutral">Listing removed</Badge>
          ) : null}
          <Badge tone={tone} dot>
            {overdue ? "Overdue" : statusLabel(request.status)}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <CalendarIcon className="size-4 text-ink-muted" />
          {formatRange(request.startDate, request.returnBy)}
        </span>
        {request.status === "approved" ? (
          <span
            className={
              overdue
                ? "text-sm font-semibold text-danger"
                : "text-sm text-ink-muted"
            }
          >
            {relativeDue(request.returnBy)}
          </span>
        ) : null}
      </div>

      {request.message ? (
        <blockquote className="mt-3 rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-ink-soft">
          &ldquo;{request.message}&rdquo;
        </blockquote>
      ) : null}

      {request.status === "pending" ? (
        <p className="mt-3 text-xs text-ink-muted">
          {side === "borrower"
            ? "Waiting for the lender to respond. You can cancel while it is pending."
            : "Approve to hold these dates, or decline to release the request."}
        </p>
      ) : null}

      {request.status === "approved" && !overdue && !request.tool.isRemoved ? (
        <p className="mt-3 text-xs text-ink-muted">
          Available again to the board on {formatDay(addDays(request.returnBy, 1))}.
        </p>
      ) : null}

      {request.status === "approved" && overdue ? (
        <p className="mt-3 text-xs font-semibold text-danger">
          Past the return-by date. Close the loan once the tool is back.
        </p>
      ) : null}

      {actions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
