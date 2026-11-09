"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { CategoryIcon } from "@/components/category-icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClockIcon, ShieldCheckIcon, UsersIcon } from "@/components/icons";
import { formatDay } from "@/lib/format";
import { categoryLabel, conditionLabel } from "@/lib/tool-options";

export type BoardTool = FunctionReturnType<typeof api.tools.listBoard>[number];

export function ToolCard({
  tool,
  onRequest,
}: {
  tool: BoardTool;
  onRequest: () => void;
}) {
  const badge = tool.isOverdue
    ? { tone: "danger" as const, label: "Overdue" }
    : tool.status === "on_loan"
      ? { tone: "accent" as const, label: "On loan" }
      : { tone: "brand" as const, label: "Available" };

  const canRequest = !tool.isMine && !tool.isOverdue;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-paper text-brand">
          <CategoryIcon category={tool.category} className="size-5" />
        </span>
        <Badge tone={badge.tone} dot>
          {badge.label}
        </Badge>
      </div>

      <h3 className="mt-4 text-base font-semibold text-ink">{tool.name}</h3>
      <p className="mt-0.5 text-sm text-ink-muted">
        {categoryLabel(tool.category)} · {conditionLabel(tool.condition)}
      </p>

      <p className="mt-3 line-clamp-3 text-sm text-ink-soft">
        {tool.description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <Avatar name={tool.ownerName} />
        <span className="truncate">{tool.isMine ? "You" : tool.ownerName}</span>
        {tool.ownerTrusted ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <ShieldCheckIcon className="size-3.5" />
            Trusted
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        {tool.pendingRequestCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {tool.pendingRequestCount} open request
            {tool.pendingRequestCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {tool.status === "on_loan" && !tool.isOverdue ? (
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            Back {formatDay(tool.availableFrom)}
          </span>
        ) : null}
        {tool.upcomingReservation && tool.status !== "on_loan" ? (
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            Next booking {formatDay(tool.upcomingReservation.startDate)}
          </span>
        ) : null}
      </div>

      {tool.isOverdue ? (
        <p className="mt-3 text-xs font-medium text-danger">
          Unavailable until the overdue loan is returned.
        </p>
      ) : null}
      {tool.isMine ? (
        <p className="mt-3 text-xs text-ink-muted">
          Manage this tool in My listings.
        </p>
      ) : null}

      <div className="flex-1" aria-hidden="true" />

      <div className="mt-5 border-t border-line/70 pt-4">
        <Button
          size="sm"
          onClick={onRequest}
          disabled={!canRequest}
          className="w-full"
        >
          {tool.isMine
            ? "Your listing"
            : tool.isOverdue
              ? "Unavailable"
              : "Request"}
        </Button>
      </div>
    </article>
  );
}
