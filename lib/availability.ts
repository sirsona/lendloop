import { addDays, todayInNairobi } from "./format";

export type AvailabilityWindow = { startDate: string; endDate: string };

/** Windows are half-open: [startDate, endDate). */
export function isDayBlocked(
  day: string,
  windows: AvailabilityWindow[],
): boolean {
  return windows.some(
    (window) => day >= window.startDate && day < window.endDate,
  );
}

export function buildCalendar(
  windows: AvailabilityWindow[],
  days = 35,
): { date: string; blocked: boolean }[] {
  const today = todayInNairobi();

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index);
    return { date, blocked: isDayBlocked(date, windows) };
  });
}

export function rangeHasBlockedDay(
  start: string,
  returnBy: string,
  windows: AvailabilityWindow[],
): boolean {
  if (!start || !returnBy) return false;

  const end = addDays(returnBy, 1);
  return windows.some(
    (window) => start < window.endDate && end > window.startDate,
  );
}
