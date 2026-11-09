"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CloseIcon } from "@/components/icons";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { categoryLabel } from "@/lib/tool-options";
import { RequestForm } from "./request-form";
import type { BoardTool } from "./tool-card";

export function RequestDialog({
  tool,
  onClose,
}: {
  tool: BoardTool;
  onClose: () => void;
}) {
  const availability = useQuery(api.borrowRequests.listAvailability, {
    toolId: tool._id,
  });
  const create = useMutation(api.borrowRequests.create);
  const toast = useToast();

  return (
    <Dialog open onClose={onClose} labelledBy="request-dialog-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="request-dialog-title"
            className="text-xl font-semibold text-ink"
          >
            Request {tool.name}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            From {tool.ownerName} · {categoryLabel(tool.category)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div className="mt-5">
        {availability ? (
          <RequestForm
            windows={availability.windows}
            onCancel={onClose}
            onSubmit={async (draft) => {
              await create({
                toolId: tool._id,
                startDate: draft.startDate,
                returnBy: draft.returnBy,
                message: draft.message.trim() || undefined,
              });
              toast({
                tone: "success",
                title: "Request sent",
                description: `${tool.ownerName} can approve or decline those dates.`,
              });
              onClose();
            }}
          />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        )}
      </div>
    </Dialog>
  );
}
