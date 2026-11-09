"use client";

import { useState } from "react";
import { AlertIcon } from "@/components/icons";
import { Button } from "./button";
import { Dialog } from "./dialog";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setPending(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "That action could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={pending ? () => undefined : onClose}
      labelledBy="confirm-dialog-title"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertIcon className="size-5" />
        </span>
        <div>
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-ink"
          >
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">{description}</p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger-line bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="solidDanger" onClick={handleConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
