"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { PlusIcon, SearchIcon, WrenchIcon } from "@/components/icons";
import { RequestDialog } from "@/components/request-dialog";
import { ToolCard, type BoardTool } from "@/components/tool-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { TOOL_CATEGORIES } from "@/lib/tool-options";

export default function BrowsePage() {
  const tools = useQuery(api.tools.listBoard, {});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [requesting, setRequesting] = useState<BoardTool | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (tools ?? []).filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (availableOnly && (tool.status === "on_loan" || tool.isOverdue)) {
        return false;
      }
      if (!needle) return true;

      return [tool.name, tool.description, tool.ownerName].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [tools, query, category, availableOnly]);

  const hasFilters = query !== "" || category !== "all" || availableOnly;

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setAvailableOnly(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Browse the board</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everything neighbors are willing to lend. Request the days you need.
          </p>
        </div>
        <Link
          href="/board/listings"
          className={buttonStyles({ variant: "secondary" })}
        >
          <PlusIcon className="size-4" />
          List a tool
        </Link>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools, owners, descriptions"
            aria-label="Search tools"
            className="w-full rounded-xl border border-line-strong bg-paper py-2.5 pr-3 pl-10 text-sm text-ink transition-colors placeholder:text-ink-muted/80 focus:border-brand"
          />
        </div>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
          className="rounded-xl border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand"
        >
          <option value="all">All categories</option>
          {TOOL_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 px-1 text-sm font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
            className="size-4 accent-brand"
          />
          Available now
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {tools === undefined
            ? "Loading tools…"
            : `${filtered.length} tool${filtered.length === 1 ? "" : "s"}${
                hasFilters ? " match your filters" : " on the board"
              }`}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {tools === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<WrenchIcon className="size-5" />}
          title={tools.length === 0 ? "The board is empty" : "No tools match"}
          description={
            tools.length === 0
              ? "List the first tool and your neighbors will see it here."
              : "Try a different search or category, or clear the filters."
          }
          action={
            tools.length === 0 ? (
              <Link href="/board/listings" className={buttonStyles()}>
                List a tool
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className={buttonStyles({ variant: "secondary" })}
              >
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => (
            <li key={tool._id}>
              <ToolCard tool={tool} onRequest={() => setRequesting(tool)} />
            </li>
          ))}
        </ul>
      )}

      {requesting ? (
        <RequestDialog
          tool={requesting}
          onClose={() => setRequesting(null)}
        />
      ) : null}
    </div>
  );
}
