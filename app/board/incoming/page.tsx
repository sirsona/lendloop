"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { UsersIcon } from "@/components/icons";
import { RequestCard, type RequestItem } from "@/components/request-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { formatDay, todayInNairobi } from "@/lib/format";

const HISTORY = new Set(["declined", "cancelled", "returned"]);

export default function IncomingPage() {
  const requests = useQuery(api.borrowRequests.listIncoming, {});
  const approve = useMutation(api.borrowRequests.approve);
  const decline = useMutation(api.borrowRequests.decline);
  const markReturned = useMutation(api.borrowRequests.markReturned);
  const toast = useToast();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<RequestItem | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<RequestItem | null>(null);

  const today = todayInNairobi();
  const pending = (requests ?? []).filter((request) => request.status === "pending");
  const approved = (requests ?? []).filter((request) => request.status === "approved");
  const history = (requests ?? []).filter((request) => HISTORY.has(request.status));

  function blockedReason(request: RequestItem) {
    if (request.tool.isRemoved) return "This listing was removed. Decline the request.";
    if (request.isOverdue) return "Overdue loan on this tool. Return it before approving new dates.";
    if (request.returnBy < today) return "Those dates have passed. Decline the request instead.";
    return "";
  }

  async function approveRequest(request: RequestItem) {
    setPendingId(request._id);
    try {
      await approve({ requestId: request._id });
      toast({
        tone: "success",
        title: "Request approved",
        description: `${request.counterpartyName} has ${request.tool.name} for those dates.`,
      });
    } catch (cause) {
      toast({
        tone: "error",
        title: "Could not approve",
        description:
          cause instanceof Error ? cause.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Incoming requests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Neighbors asking to borrow your tools. You decide, and admin rules
          never override you.
        </p>
      </header>

      {requests === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-5" />}
          title="No one has asked yet"
          description="When a neighbor requests one of your tools, it appears here with the dates they need."
          action={
            <Link href="/board/listings" className={buttonStyles()}>
              Review my listings
            </Link>
          }
        />
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                Needs your decision ({pending.length})
              </h2>
              {pending.map((request) => {
                const blocked = blockedReason(request);

                return (
                  <RequestCard
                    key={request._id}
                    request={request}
                    side="lender"
                    actions={
                      <>
                        <Button
                          size="sm"
                          loading={pendingId === request._id}
                          disabled={Boolean(blocked)}
                          onClick={() => approveRequest(request)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmDecline(request)}
                        >
                          Decline
                        </Button>
                        {blocked ? (
                          <p className="w-full text-xs text-danger">{blocked}</p>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </section>
          ) : null}

          {approved.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                Out with a neighbor ({approved.length})
              </h2>
              {approved.map((request) => {
                const startsLater = request.startDate > today;

                return (
                  <RequestCard
                    key={request._id}
                    request={request}
                    side="lender"
                    actions={
                      startsLater ? (
                        <p className="text-xs text-ink-muted">
                          Return marking opens on {formatDay(request.startDate)}.
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={pendingId === request._id}
                          onClick={() => setConfirmReturn(request)}
                        >
                          Mark returned
                        </Button>
                      )
                    }
                  />
                );
              })}
            </section>
          ) : null}

          {history.length > 0 ? (
            <details className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                History ({history.length})
              </summary>
              <div className="mt-4 space-y-4">
                {history.map((request) => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    side="lender"
                  />
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}

      {confirmDecline ? (
        <ConfirmDialog
          title="Decline this request?"
          description={`${confirmDecline.counterpartyName} will not get ${confirmDecline.tool.name} for ${formatDay(
            confirmDecline.startDate,
          )}. Declining is final; they can send a new request for other dates.`}
          confirmLabel="Decline request"
          onClose={() => setConfirmDecline(null)}
          onConfirm={async () => {
            await decline({ requestId: confirmDecline._id });
            toast({
              tone: "success",
              title: "Request declined",
              description: `${confirmDecline.counterpartyName} can request other dates.`,
            });
          }}
        />
      ) : null}

      {confirmReturn ? (
        <ConfirmDialog
          title="Mark this loan returned?"
          description={`This releases ${confirmReturn.tool.name} back to the board. Only confirm once the tool is back in your hands.`}
          confirmLabel="Mark returned"
          onClose={() => setConfirmReturn(null)}
          onConfirm={async () => {
            await markReturned({ requestId: confirmReturn._id });
            toast({
              tone: "success",
              title: "Loan closed",
              description: `${confirmReturn.tool.name} is available again.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}
