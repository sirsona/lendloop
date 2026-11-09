import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function TableCard({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
    </div>
  );
}

export const thClassName =
  "whitespace-nowrap border-b border-line bg-paper px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase";

export const tdClassName =
  "border-b border-line/70 px-4 py-3 align-top text-ink-soft";

export const trClassName = "transition-colors hover:bg-paper/70";
