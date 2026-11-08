import { ConvexError } from "convex/values";

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;
const MAX_USE_DAYS = 90;

export function dateInNairobi(ms = Date.now()) {
  return new Date(ms + NAIROBI_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);

  return Math.round((end - start) / 86_400_000);
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === value;
}

export function validateBorrowWindow(
  startDate: string,
  returnBy: string,
  today = dateInNairobi(),
) {
  if (!isDateOnly(startDate) || !isDateOnly(returnBy)) {
    throw new ConvexError("Dates must be YYYY-MM-DD.");
  }

  if (startDate < today) {
    throw new ConvexError("The loan cannot start in the past.");
  }

  if (returnBy < startDate) {
    throw new ConvexError("Return-by must be on or after the start date.");
  }

  const endDate = addDays(returnBy, 1);

  if (daysBetween(startDate, endDate) > MAX_USE_DAYS) {
    throw new ConvexError("Loans cannot exceed 90 days.");
  }

  return { endDate };
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart < bEnd && aEnd > bStart;
}
