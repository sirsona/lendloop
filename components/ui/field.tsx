"use client";

import { cn } from "@/lib/cn";
import {
  useId,
  type ComponentProps,
  type ReactNode,
} from "react";

const CONTROL =
  "mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-muted/80 focus:border-brand disabled:bg-paper";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {optional ? (
          <span className="text-xs font-medium text-ink-muted">Optional</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type BaseFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  ...props
}: BaseFieldProps & ComponentProps<"input">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, error && "border-danger")}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  children,
  ...props
}: BaseFieldProps & ComponentProps<"select">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, "appearance-none", error && "border-danger")}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  ...props
}: BaseFieldProps & ComponentProps<"textarea">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL, "resize-y", error && "border-danger")}
        {...props}
      />
    </Field>
  );
}
