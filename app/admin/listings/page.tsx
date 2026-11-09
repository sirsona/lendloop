"use client";

import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { SearchIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/feedback";
import {
  TableCard,
  tdClassName,
  thClassName,
  trClassName,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDay } from "@/lib/format";
import { categoryLabel } from "@/lib/tool-options";

type Listing = FunctionReturnType<typeof api.tools.listBoard>[number];

export default function AdminListingsPage() {
  const listings = useQuery(api.tools.listBoard, {});
  const adminRemove = useMutation(api.admin.adminRemove);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<Listing | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (listings ?? []).filter((tool) => {
      if (!needle) return true;
      return [tool.name, tool.ownerName, tool.category].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [listings, query]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Listings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Active listings only. Removed listings are hidden here and stay
          visible to their owner and to borrowers with history.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-surface p-3 shadow-card">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tool, owner, or category"
            aria-label="Search listings"
            className="w-full rounded-xl border border-line-strong bg-paper py-2.5 pr-3 pl-10 text-sm text-ink placeholder:text-ink-muted/80 focus:border-brand"
          />
        </div>
      </div>

      {listings === undefined ? (
        <Skeleton className="h-72" />
      ) : (
        <TableCard caption="Active tool listings">
          <thead>
            <tr>
              <th scope="col" className={thClassName}>
                Tool
              </th>
              <th scope="col" className={thClassName}>
                Owner
              </th>
              <th scope="col" className={thClassName}>
                Availability
              </th>
              <th scope="col" className={thClassName}>
                Pending
              </th>
              <th scope="col" className={thClassName}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tool) => (
              <tr key={tool._id} className={trClassName}>
                <td className={tdClassName}>
                  <p className="font-medium text-ink">{tool.name}</p>
                  <p className="text-xs text-ink-muted">
                    {categoryLabel(tool.category)}
                  </p>
                </td>
                <td className={tdClassName}>{tool.ownerName}</td>
                <td className={tdClassName}>
                  <div className="flex flex-col items-start gap-1">
                    <Badge
                      tone={
                        tool.isOverdue
                          ? "danger"
                          : tool.status === "on_loan"
                            ? "accent"
                            : "brand"
                      }
                      dot
                    >
                      {tool.isOverdue
                        ? "Overdue"
                        : tool.status === "on_loan"
                          ? "On loan"
                          : "Available"}
                    </Badge>
                    {tool.status === "on_loan" && !tool.isOverdue ? (
                      <span className="text-xs text-ink-muted">
                        Back {formatDay(tool.availableFrom)}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={tdClassName}>{tool.pendingRequestCount}</td>
                <td className={tdClassName}>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setRemoving(tool)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-ink-muted" colSpan={5}>
                  No listings match that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </TableCard>
      )}

      {removing ? (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          description={`This hides the listing from the board for everyone. ${removing.ownerName} keeps the history and any approved loan still needs to be returned.`}
          confirmLabel="Remove listing"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await adminRemove({ toolId: removing._id });
            toast({
              tone: "success",
              title: "Listing removed",
              description: `${removing.name} is hidden from the board.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}
