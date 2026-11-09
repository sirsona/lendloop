import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "brand" | "accent" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-paper text-ink-soft",
  brand: "border-brand-line bg-brand-soft text-brand",
  accent: "border-accent-line bg-accent-soft text-accent",
  danger: "border-danger-line bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
