"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native <dialog> so focus trapping, Escape, and focus restoration come from
 * the browser instead of hand-rolled key handlers.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    node.addEventListener("cancel", handleCancel);
    return () => node.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40",
        className,
      )}
    >
      {open ? (
        <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
