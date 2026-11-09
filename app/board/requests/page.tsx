"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { LoopMark } from "@/components/icons";
import { RequestCard, type RequestItem } from "@/components/request-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { formatDay, todayInNairobi } from "@/lib/format";

const HISTORY = new Set(["declined", "cancelled", "returned"]);

export default function MyRequestsPage() {
  const requests = useQuery(api.borrowRequests.listMine, {});
  const cancel = useMutation(api.borrowRequests.cancel);
  const markReturned = useMutation(api.borrowRequests.markReturned);
  const toast = useToast();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<RequestItem | null>(null);

  const today = todayInNairobi();
  const pending = (requests ?? []).filter((request) => request.status === "pending");
  const approved = (requests ?? []).filter((request) => request.status === "approved");
  const history = (requests ?? []).filter((request) => HISTORY.has(request.status));

  async function cancelRequest(request: RequestItem) {
    setPendingId(request._id);
    try {
      await cancel({ requestId: request._id });
      toast({
        tone: "success",
        title: "Request cancelled",
        description: `${request.tool.name} is free for those dates again.`,
      });
    } catch (cause) {
      toast({
        tone: "error",
        title: "Could not cancel",
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
        <h1 className="text-3xl font-semibold text-ink">My requests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tools you asked to borrow, and where each request stands.
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
          icon={<LoopMark className="size-5" />}
          title="No requests yet"
          description="Find a tool you need, pick the days, and send the request. The lender decides."
          action={
            <Link href="/board" className={buttonStyles()}>
              Browse the board
            </Link>
          }
        />
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                Waiting for a lender ({pending.length})
              </h2>
              {pending.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  side="borrower"
                  actions={
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={pendingId === request._id}
                      onClick={() => cancelRequest(request)}
                    >
                      Cancel request
                    </Button>
                  }
                />
              ))}
            </section>
          ) : null}

          {approved.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                Approved loans ({approved.length})
              </h2>
              {approved.map((request) => {
                const startsLater = request.startDate > today;

                return (
                  <RequestCard
                    key={request._id}
                    request={request}
                    side="borrower"
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
                    side="borrower"
                  />
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}

      {confirmReturn ? (
        <ConfirmDialog
          title="Mark this loan returned?"
          description={`This releases ${confirmReturn.tool.name} back to the board. Only confirm once the tool is back in the owner's hands.`}
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
