"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { CategoryIcon } from "@/components/category-icon";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  WrenchIcon,
} from "@/components/icons";
import { ListingForm, type ListingDraft } from "@/components/listing-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { formatDay } from "@/lib/format";
import { categoryLabel, conditionLabel } from "@/lib/tool-options";

type Listing = FunctionReturnType<typeof api.tools.listMine>[number];

export default function MyListingsPage() {
  const tools = useQuery(api.tools.listMine, {});
  const createTool = useMutation(api.tools.create);
  const updateTool = useMutation(api.tools.update);
  const removeTool = useMutation(api.tools.remove);
  const toast = useToast();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [removing, setRemoving] = useState<Listing | null>(null);

  const active = (tools ?? []).filter((tool) => !tool.isRemoved);
  const removed = (tools ?? []).filter((tool) => tool.isRemoved);

  async function handleCreate(draft: ListingDraft) {
    await createTool(draft);
    toast({
      tone: "success",
      title: "Listing published",
      description: `${draft.name} is now on the board.`,
    });
    setCreating(false);
  }

  async function handleUpdate(draft: ListingDraft) {
    if (!editing) return;
    await updateTool({ toolId: editing._id, ...draft });
    toast({ tone: "success", title: "Listing updated" });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">My listings</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tools you are lending. You approve every request yourself.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon className="size-4" />
          List a tool
        </Button>
      </header>

      {tools === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      ) : active.length === 0 && removed.length === 0 ? (
        <EmptyState
          icon={<WrenchIcon className="size-5" />}
          title="You have not listed a tool yet"
          description="Start with something you would happily lend to a neighbor. You keep control of every request."
          action={
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="size-4" />
              List your first tool
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {active.map((tool) => (
                <li key={tool._id}>
                  <ListingCard
                    tool={tool}
                    onEdit={() => setEditing(tool)}
                    onRemove={() => setRemoving(tool)}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {removed.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                Removed ({removed.length})
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Removed listings are hidden from the board. Borrowers with
                existing history can still see them.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {removed.map((tool) => (
                  <li key={tool._id}>
                    <ListingCard tool={tool} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      {creating ? (
        <Dialog open onClose={() => setCreating(false)} labelledBy="create-title">
          <h2 id="create-title" className="text-xl font-semibold text-ink">
            List a tool
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Only signed-in neighbors can see the full listing.
          </p>
          <div className="mt-5">
            <ListingForm
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        </Dialog>
      ) : null}

      {editing ? (
        <Dialog open onClose={() => setEditing(null)} labelledBy="edit-title">
          <h2 id="edit-title" className="text-xl font-semibold text-ink">
            Edit listing
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Changes are visible immediately. Loans are not affected.
          </p>
          <div className="mt-5">
            <ListingForm
              initial={{
                name: editing.name,
                category: editing.category as ListingDraft["category"],
                condition: editing.condition as ListingDraft["condition"],
                description: editing.description,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Dialog>
      ) : null}

      {removing ? (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          description="It disappears from the board and from browse. Existing loans and request history are preserved, but there is no restore action in the app."
          confirmLabel="Remove listing"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await removeTool({ toolId: removing._id });
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

function ListingCard({
  tool,
  onEdit,
  onRemove,
}: {
  tool: Listing;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const status = tool.isRemoved
    ? { tone: "neutral" as const, label: "Removed" }
    : tool.isOverdue
      ? { tone: "danger" as const, label: "Overdue" }
      : tool.status === "on_loan"
        ? { tone: "accent" as const, label: "On loan" }
        : { tone: "brand" as const, label: "Available" };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-paper text-brand">
          <CategoryIcon category={tool.category} className="size-5" />
        </span>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <h3 className="mt-4 text-base font-semibold text-ink">{tool.name}</h3>
      <p className="mt-0.5 text-sm text-ink-muted">
        {categoryLabel(tool.category)} · {conditionLabel(tool.condition)}
      </p>

      <p className="mt-3 line-clamp-2 text-sm text-ink-soft">
        {tool.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>
          {tool.pendingRequestCount} open request
          {tool.pendingRequestCount === 1 ? "" : "s"}
        </span>
        {tool.status === "on_loan" && !tool.isOverdue ? (
          <span>Back {formatDay(tool.availableFrom)}</span>
        ) : null}
      </div>

      <div className="flex-1" aria-hidden="true" />

      {onEdit && onRemove ? (
        <div className="mt-5 flex gap-2 border-t border-line/70 pt-4">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={onRemove}>
            <TrashIcon className="size-3.5" />
            Remove
          </Button>
        </div>
      ) : null}
    </article>
  );
}
