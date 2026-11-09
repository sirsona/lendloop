export const NAIROBI_TZ = "Africa/Nairobi";

/** Today as a Nairobi date-only string (YYYY-MM-DD). */
export function todayInNairobi(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: NAIROBI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86_400_000,
  );
}

const shortDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const monthShort = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

const weekdayNarrow = new Intl.DateTimeFormat("en-GB", {
  weekday: "narrow",
  timeZone: "UTC",
});

export function formatDay(value: string): string {
  return shortDay.format(parseDateOnly(value));
}

export function formatDayLong(value: string): string {
  return longDay.format(parseDateOnly(value));
}

export function formatWeekdayNarrow(value: string): string {
  return weekdayNarrow.format(parseDateOnly(value));
}

export function formatDayNumber(value: string): number {
  return Number(value.slice(8, 10));
}

/** Compact inclusive range: "10–12 Nov" or "28 Nov – 2 Dec". */
export function formatRange(start: string, endInclusive: string): string {
  if (start === endInclusive) return formatDay(start);

  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = endInclusive.split("-").map(Number);
  const startMonthLabel = monthShort.format(
    new Date(Date.UTC(startYear, startMonth - 1, 1)),
  );

  if (startYear === endYear && startMonth === endMonth) {
    return `${formatDayNumber(start)}–${formatDayNumber(endInclusive)} ${startMonthLabel}`;
  }

  return `${formatDay(start)} – ${formatDay(endInclusive)}`;
}

export function relativeDue(returnBy: string): string {
  const diff = daysBetween(todayInNairobi(), returnBy);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < -1) return `${-diff} days overdue`;
  return `Due in ${diff} days`;
}

export function isPastDue(returnBy: string): boolean {
  return todayInNairobi() > returnBy;
}

export function formatTimestamp(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: NAIROBI_TZ,
  }).format(new Date(ms));
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function shortId(id: string): string {
  return id.length <= 12 ? id : `…${id.slice(-6)}`;
}
