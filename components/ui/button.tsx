import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";
import { Spinner } from "./feedback";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "soft"
  | "danger"
  | "solidDanger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark disabled:bg-line disabled:text-ink-soft",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-ink-muted hover:bg-paper disabled:border-line disabled:text-ink-muted",
  ghost:
    "text-ink-soft hover:bg-line/60 hover:text-ink disabled:text-ink-muted",
  soft: "bg-brand-soft text-brand hover:bg-brand-line/70 disabled:bg-line disabled:text-ink-muted",
  danger:
    "border border-danger-line bg-surface text-danger hover:bg-danger-soft disabled:border-line disabled:text-ink-muted",
  solidDanger:
    "bg-danger text-white hover:bg-danger/90 disabled:bg-line disabled:text-ink-soft",
};

const SIZES: Record<Size, string> = {
  // 40px on touch, denser on pointer devices. AA target size is 24px.
  sm: "min-h-10 px-3 text-xs sm:min-h-8",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-sm",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}
