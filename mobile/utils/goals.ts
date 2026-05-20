const DAYS_PER_MONTH = 30;

export function durationMonthsFromDays(durationDays: number): number {
  return Math.max(1, Math.round(durationDays / DAYS_PER_MONTH));
}

export function durationDaysFromMonths(months: number): number {
  return Math.max(1, Math.round(months)) * DAYS_PER_MONTH;
}

export function goalMonthIndex(startDate: string, durationMonths: number, now = new Date()): number {
  const start = new Date(startDate);
  const monthDiff =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.min(Math.max(0, monthDiff), durationMonths - 1);
}

export function goalMonthWindow(startDate: string, monthIndex: number): { start: Date; end: Date } {
  const start = new Date(startDate);
  const windowStart = new Date(start.getFullYear(), start.getMonth() + monthIndex, 1);
  const windowEnd = new Date(start.getFullYear(), start.getMonth() + monthIndex + 1, 1);
  return { start: windowStart, end: windowEnd };
}
