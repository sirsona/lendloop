"use client";

import { useMemo, useState } from "react";
import { AlertIcon, CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField } from "@/components/ui/field";
import {
  buildCalendar,
  rangeHasBlockedDay,
  type AvailabilityWindow,
} from "@/lib/availability";
import { cn } from "@/lib/cn";
import {
  addDays,
  daysBetween,
  formatDay,
  formatDayNumber,
  formatRange,
  formatWeekdayNarrow,
  todayInNairobi,
} from "@/lib/format";

export type RequestDraft = {
  startDate: string;
  returnBy: string;
  message: string;
};

const MAX_DAYS = 90;

export function RequestForm({
  windows,
  onSubmit,
  onCancel,
}: {
  windows: AvailabilityWindow[];
  onSubmit: (draft: RequestDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const today = todayInNairobi();
  const calendar = useMemo(() => buildCalendar(windows), [windows]);
  const [startDate, setStartDate] = useState("");
  const [returnBy, setReturnBy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const dayCount =
    startDate && returnBy ? daysBetween(startDate, returnBy) + 1 : 0;
  const crossesBooking = Boolean(
    startDate && returnBy && rangeHasBlockedDay(startDate, returnBy, windows),
  );
  const tooLong = dayCount > MAX_DAYS;

  function validationMessage() {
    if (!startDate || !returnBy) return "Pick your borrow dates to continue.";
    if (startDate < today) return "The loan cannot start in the past.";
    if (returnBy < startDate)
      return "Return by must be on or after the borrow date.";
    if (crossesBooking)
      return "Those dates cross a booking. Choose a free range.";
    if (tooLong) return "Loans can be up to 90 days.";
    return "";
  }

  function choose(day: string) {
    setError("");
    if (!startDate || !returnBy) {
      setStartDate(day);
      setReturnBy(day);
      return;
    }
    if (day < startDate) {
      setStartDate(day);
      setReturnBy(day);
      return;
    }
    setReturnBy(day);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validationMessage();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setPending(true);
    try {
      await onSubmit({ startDate, returnBy, message });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not send the request.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Pick your days</p>
          <p className="text-xs text-ink-muted">Nairobi time</p>
        </div>

        <div
          role="group"
          aria-label="Tool availability for the next five weeks"
          className="mt-2 grid grid-cols-7 gap-1.5"
        >
          {calendar.map((day) => {
            const selected = Boolean(
              startDate && returnBy && day.date >= startDate && day.date <= returnBy,
            );

            return (
              <button
                key={day.date}
                type="button"
                disabled={day.blocked}
                aria-pressed={selected}
                aria-label={`${formatDay(day.date)}${day.blocked ? " — booked" : ""}`}
                onClick={() => choose(day.date)}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-xl border text-center transition-colors",
                  day.blocked
                    ? "cursor-not-allowed border-dashed border-line-strong bg-line/40 text-ink-muted"
                    : selected
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-ink hover:border-brand hover:bg-brand-soft",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase",
                    selected ? "text-white/80" : "text-ink-muted",
                  )}
                >
                  {formatWeekdayNarrow(day.date)}
                </span>
                <span className="tnum text-sm font-semibold">
                  {formatDayNumber(day.date)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-line bg-surface" /> Free
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-line bg-line/40" />{" "}
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-brand" /> Your dates
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Borrow from"
          type="date"
          min={today}
          value={startDate}
          onChange={(event) => {
            const value = event.target.value;
            setStartDate(value);
            if (!returnBy || value > returnBy) setReturnBy(value);
          }}
        />
        <TextField
          label="Return by"
          type="date"
          min={startDate || today}
          max={startDate ? addDays(startDate, MAX_DAYS - 1) : undefined}
          value={returnBy}
          onChange={(event) => setReturnBy(event.target.value)}
          hint="Inclusive: back in your hands that day."
        />
      </div>

      <div
        aria-live="polite"
        className="rounded-xl border border-line bg-paper p-3"
      >
        {startDate && returnBy && !crossesBooking && !tooLong ? (
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">
              {dayCount} day{dayCount === 1 ? "" : "s"}
            </span>{" "}
            · {formatRange(startDate, returnBy)} · available again{" "}
            {formatDay(addDays(returnBy, 1))}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <CalendarIcon className="size-4" />
            Tap your first day, then the last day you need the tool.
          </p>
        )}
      </div>

      <div>
        <TextareaField
          label="Message"
          optional
          rows={3}
          maxLength={300}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="How will you use it?"
        />
        <p className="mt-1 text-right text-xs text-ink-muted tnum">
          {message.length}/300
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger-line bg-danger-soft p-3 text-sm text-danger"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-ink-muted">
          The owner approves before anything is booked.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {pending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>
    </form>
  );
}
