"use client";

import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { BoxIcon, LockIcon } from "@/components/icons";
import { categoryLabel } from "@/lib/tool-options";

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="size-10" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-4 h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PublicToolGrid() {
  const tools = useQuery(api.tools.listPublic);
  const { openSignIn } = useClerk();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            Available right now
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Guests see the tool and its category. The owner and the dates appear
            once you sign in.
          </p>
        </div>
        {tools && tools.length > 0 ? (
          <Badge tone="brand" dot>
            {tools.length} available
          </Badge>
        ) : null}
      </div>

      <div className="mt-6">
        {tools === undefined ? (
          <GridSkeleton />
        ) : tools.length === 0 ? (
          <EmptyState
            icon={<BoxIcon className="size-5" />}
            title="No tools available right now"
            description="Every listed tool is out on loan, or the board is empty. Sign in to be the first neighbor to lend one."
            action={
              <Button onClick={() => openSignIn({})}>List a tool</Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool._id}>
                <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:shadow-pop">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-xl border border-line bg-paper text-brand">
                      <CategoryIcon
                        category={tool.category}
                        className="size-5"
                      />
                    </span>
                    <Badge tone="brand" dot>
                      Available
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {tool.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {categoryLabel(tool.category)}
                  </p>
                  <p className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-ink-muted">
                    <LockIcon className="size-3.5" />
                    Sign in to see owner and dates
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        Already lending?{" "}
        <Link
          href="/board"
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Open your board
        </Link>
        .
      </p>
    </div>
  );
}
