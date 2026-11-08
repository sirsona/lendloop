"use client";

import {
  ListingForm,
  type ListingDraft,
} from "@/components/listing-form";
import {
  RequestForm,
  type RequestDraft,
} from "@/components/request-form";
import { categoryLabel, conditionLabel } from "@/lib/tool-options";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

type Tab = "browse" | "listings" | "requests" | "incoming";

type BoardTool = {
  _id: Id<"tools">;
  name: string;
  category: string;
  condition: string;
  description: string;
  isRemoved: boolean;
  ownerName: string;
  ownerTrusted: boolean;
  isMine: boolean;
  status: "available" | "on_loan";
  isOverdue: boolean;
  pendingRequestCount: number;
  upcomingReservation: { startDate: string; returnBy: string } | null;
};

type RequestItem = {
  _id: Id<"borrowRequests">;
  status: "pending" | "approved" | "declined" | "returned" | "cancelled";
  startDate: string;
  endDate: string;
  returnBy: string;
  message: string | null;
  createdAt: number;
  isOverdue: boolean;
  tool: { name: string; category: string; isRemoved: boolean };
  counterpartyName: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "browse", label: "Browse" },
  { id: "listings", label: "My listings" },
  { id: "requests", label: "My requests" },
  { id: "incoming", label: "Incoming requests" },
];

function StatusPill({ request }: { request: RequestItem }) {
  const label = request.isOverdue ? "overdue" : request.status;
  const styles =
    label === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : label === "pending"
        ? "bg-amber-100 text-amber-800"
        : label === "declined" || label === "cancelled"
          ? "bg-slate-100 text-slate-600"
          : label === "overdue"
            ? "bg-red-100 text-red-800"
            : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function RequestCard({
  request,
  side,
  busy,
  onApprove,
  onDecline,
  onCancel,
  onReturn,
}: {
  request: RequestItem;
  side: "borrower" | "lender";
  busy: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onReturn: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{request.tool.name}</p>
          <p className="text-sm text-slate-500">
            {categoryLabel(request.tool.category)} ·{" "}
            {side === "borrower" ? "Lender" : "Borrower"}:{" "}
            {request.counterpartyName}
          </p>
        </div>
        <StatusPill request={request} />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {request.startDate} → return by {request.returnBy}
      </p>
      {request.tool.isRemoved && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-red-600">
          Removed listing
        </p>
      )}
      {request.message && (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          “{request.message}”
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {side === "lender" && request.status === "pending" && (
          <>
            <button
              onClick={onApprove}
              disabled={busy || request.isOverdue || request.tool.isRemoved}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={onDecline}
              disabled={busy}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Decline
            </button>
          </>
        )}

        {side === "lender" && request.status === "approved" && (
          <button
            onClick={onReturn}
            disabled={busy}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Mark returned
          </button>
        )}

        {side === "borrower" && request.status === "pending" && (
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Cancel request
          </button>
        )}

        {side === "borrower" && request.status === "approved" && (
          <button
            onClick={onReturn}
            disabled={busy}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Mark returned
          </button>
        )}
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  onRequest,
}: {
  tool: BoardTool;
  onRequest: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{tool.name}</p>
          <p className="text-sm text-slate-500">
            {categoryLabel(tool.category)} · {conditionLabel(tool.condition)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            tool.isOverdue
              ? "bg-red-100 text-red-800"
              : tool.status === "on_loan"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {tool.isOverdue ? "overdue" : tool.status.replace("_", " ")}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-slate-600">
        {tool.description}
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Owner: {tool.ownerName}
        {tool.ownerTrusted ? " · Trusted lender" : ""}
      </p>
      {tool.pendingRequestCount > 0 && (
        <p className="mt-1 text-xs font-medium text-amber-700">
          {tool.pendingRequestCount} pending request
          {tool.pendingRequestCount === 1 ? "" : "s"}
        </p>
      )}
      {tool.upcomingReservation && (
        <p className="mt-1 text-xs text-slate-500">
          Reserved from {tool.upcomingReservation.startDate}; return by{" "}
          {tool.upcomingReservation.returnBy}
        </p>
      )}

      <button
        onClick={onRequest}
        disabled={tool.isMine || tool.isOverdue}
        className="mt-4 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {tool.isMine ? "Your listing" : tool.isOverdue ? "Unavailable" : "Request"}
      </button>
    </div>
  );
}

export default function BoardPage() {
  const me = useQuery(api.users.me);
  const authArgs = me ? {} : "skip";
  const board = useQuery(api.tools.listBoard, authArgs);
  const myTools = useQuery(api.tools.listMine, authArgs);
  const myRequests = useQuery(api.borrowRequests.listMine, authArgs);
  const incoming = useQuery(api.borrowRequests.listIncoming, authArgs);

  const createTool = useMutation(api.tools.create);
  const updateTool = useMutation(api.tools.update);
  const removeTool = useMutation(api.tools.remove);
  const createRequest = useMutation(api.borrowRequests.create);
  const approve = useMutation(api.borrowRequests.approve);
  const decline = useMutation(api.borrowRequests.decline);
  const cancel = useMutation(api.borrowRequests.cancel);
  const markReturned = useMutation(api.borrowRequests.markReturned);

  const [tab, setTab] = useState<Tab>("browse");
  const [category, setCategory] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BoardTool | null>(null);
  const [requesting, setRequesting] = useState<BoardTool | null>(null);
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

  const filteredBoard = (board ?? []).filter(
    (tool) => category === "all" || tool.category === category,
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          LendLoop
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {me.name}
          </span>
          <UserButton />
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Your board
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Borrow tools from neighbors, or lend your own.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setTab("listings");
          }}
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          + List a tool
        </button>
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

      {tab === "browse" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-slate-600">
              Category
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              <option value="power_tools">Power tools</option>
              <option value="garden">Garden</option>
              <option value="kitchen">Kitchen</option>
              <option value="camping">Camping</option>
              <option value="other">Other</option>
            </select>
          </div>

          {board === undefined && <p className="mt-6">Loading tools…</p>}
          {board && filteredBoard.length === 0 && (
            <p className="mt-6 text-slate-600">No tools match this category.</p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBoard.map((tool) => (
              <ToolCard
                key={tool._id}
                tool={tool}
                onRequest={() => setRequesting(tool)}
              />
            ))}
          </div>
        </section>
      )}

      {tab === "listings" && (
        <section className="mt-6 space-y-5">
          {(creating || editing) && (
            <ListingForm
              key={editing?._id ?? "new"}
              initial={
                editing
                  ? {
                      name: editing.name,
                      category: editing.category as ListingDraft["category"],
                      condition: editing.condition as ListingDraft["condition"],
                      description: editing.description,
                    }
                  : undefined
              }
              busy={busy}
              onSubmit={async (draft) => {
                if (editing) {
                  await updateTool({ toolId: editing._id, ...draft });
                } else {
                  await createTool(draft);
                }
                setCreating(false);
                setEditing(null);
              }}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
            />
          )}

          {myTools === undefined && <p>Loading your listings…</p>}
          {myTools && myTools.length === 0 && !creating && (
            <p className="text-slate-600">You have not listed a tool yet.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {(myTools ?? []).map((tool) => (
              <div
                key={tool._id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{tool.name}</p>
                    <p className="text-sm text-slate-500">
                      {categoryLabel(tool.category)} ·{" "}
                      {conditionLabel(tool.condition)}
                    </p>
                  </div>
                  {tool.isRemoved && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                      Removed
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {tool.pendingRequestCount} pending request
                  {tool.pendingRequestCount === 1 ? "" : "s"}
                </p>
                {!tool.isRemoved && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(tool);
                        setCreating(false);
                      }}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        run(() => removeTool({ toolId: tool._id }))
                      }
                      disabled={busy}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "requests" && (
        <section className="mt-6 space-y-4">
          {myRequests === undefined && <p>Loading your requests…</p>}
          {myRequests && myRequests.length === 0 && (
            <p className="text-slate-600">You have not requested a tool yet.</p>
          )}
          {(myRequests ?? []).map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              side="borrower"
              busy={busy}
              onApprove={() => {}}
              onDecline={() => {}}
              onCancel={() =>
                run(() => cancel({ requestId: request._id }))
              }
              onReturn={() =>
                run(() => markReturned({ requestId: request._id }))
              }
            />
          ))}
        </section>
      )}

      {tab === "incoming" && (
        <section className="mt-6 space-y-4">
          {incoming === undefined && <p>Loading incoming requests…</p>}
          {incoming && incoming.length === 0 && (
            <p className="text-slate-600">No one has requested your tools yet.</p>
          )}
          {(incoming ?? []).map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              side="lender"
              busy={busy}
              onApprove={() =>
                run(() => approve({ requestId: request._id }))
              }
              onDecline={() =>
                run(() => decline({ requestId: request._id }))
              }
              onCancel={() => {}}
              onReturn={() =>
                run(() => markReturned({ requestId: request._id }))
              }
            />
          ))}
        </section>
      )}

      {requesting && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4">
          <div className="mx-auto mt-16 max-w-xl">
            <RequestForm
              toolName={requesting.name}
              busy={busy}
              onSubmit={async (draft: RequestDraft) => {
                await createRequest({
                  toolId: requesting._id,
                  startDate: draft.startDate,
                  returnBy: draft.returnBy,
                  message: draft.message || undefined,
                });
                setRequesting(null);
              }}
              onCancel={() => setRequesting(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
