"use client";

import type { FunctionReturnType } from "convex/server";
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
import { formatTimestamp, shortId } from "@/lib/format";

type LogEntry = FunctionReturnType<typeof api.audit.list>[number];

const ACTION_LABELS: Record<string, string> = {
  "tool.created": "Tool listed",
  "tool.updated": "Listing edited",
  "tool.removed_by_owner": "Listing removed by owner",
  "tool.removed_by_admin": "Listing removed by admin",
  "request.created": "Request sent",
  "request.approved": "Request approved",
  "request.declined": "Request declined",
  "request.cancelled": "Request cancelled",
  "request.returned": "Loan returned",
  "admin.trusted_lender_changed": "Trusted lender changed",
};

const RESOURCE_LABELS: Record<string, string> = {
  tool: "Tool",
  borrowRequest: "Loan",
  user: "User",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function parseMetadata(value?: string) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    return Object.entries(parsed);
  } catch {
    return null;
  }
}

export default function AdminAuditPage() {
  const logs = useQuery(api.audit.list, {});
  const users = useQuery(api.admin.listUsers, {});
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users ?? []) map.set(user._id, user.name);
    return map;
  }, [users]);

  const actions = useMemo(
    () => Array.from(new Set((logs ?? []).map((log) => log.action))),
    [logs],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (logs ?? []).filter((log) => {
      if (action !== "all" && log.action !== action) return false;
      if (!needle) return true;

      const actor = names.get(log.actorId) ?? "";
      return [actor, actionLabel(log.action), log.resourceId, log.resourceType]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [logs, action, names, query]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Audit log</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Append-only record of listing and loan changes. Newest first, capped
          at 100 rows.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actor, action, or resource"
            aria-label="Search audit log"
            className="w-full rounded-xl border border-line-strong bg-paper py-2.5 pr-3 pl-10 text-sm text-ink placeholder:text-ink-muted/80 focus:border-brand"
          />
        </div>
        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          aria-label="Filter by action"
          className="rounded-xl border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand"
        >
          <option value="all">All actions</option>
          {actions.map((value) => (
            <option key={value} value={value}>
              {actionLabel(value)}
            </option>
          ))}
        </select>
      </div>

      {logs === undefined ? (
        <Skeleton className="h-80" />
      ) : (
        <TableCard caption="Audit log entries">
          <thead>
            <tr>
              <th scope="col" className={thClassName}>
                Time
              </th>
              <th scope="col" className={thClassName}>
                Actor
              </th>
              <th scope="col" className={thClassName}>
                Action
              </th>
              <th scope="col" className={thClassName}>
                Resource
              </th>
              <th scope="col" className={thClassName}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log: LogEntry) => {
              const metadata = parseMetadata(log.metadata);

              return (
                <tr key={log._id} className={trClassName}>
                  <td className={tdClassName}>
                    <span className="whitespace-nowrap text-xs text-ink-muted">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </td>
                  <td className={tdClassName}>
                    <p className="font-medium text-ink">
                      {names.get(log.actorId) ?? "Unknown actor"}
                    </p>
                    <p className="font-mono text-[11px] text-ink-muted">
                      {shortId(log.actorId)}
                    </p>
                  </td>
                  <td className={tdClassName}>{actionLabel(log.action)}</td>
                  <td className={tdClassName}>
                    <p className="text-xs text-ink-soft">
                      {RESOURCE_LABELS[log.resourceType] ?? log.resourceType}
                    </p>
                    <p className="font-mono text-[11px] text-ink-muted">
                      {shortId(log.resourceId)}
                    </p>
                  </td>
                  <td className={tdClassName}>
                    {metadata && metadata.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {metadata.map(([key, value]) => (
                          <Badge key={key} tone="neutral">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-ink-muted" colSpan={5}>
                  No audit entries match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </TableCard>
      )}
    </div>
  );
}
