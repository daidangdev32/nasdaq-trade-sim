/**
 * Market hours utilities for the US equity market (NASDAQ / NYSE).
 *
 * Regular session: Mon–Fri, 09:30–16:00 America/New_York.
 * We don't try to model holidays — the cron job catches up the next weekday.
 */

const NYC = "America/New_York";

function nycParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  // Intl returns weekday name, not number — derive ourselves.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NYC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayShort = get("weekday");
  // Sun = 0 … Sat = 6
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: weekdayMap[weekdayShort] ?? 0,
  };
}

export function isMarketOpen(now: Date = new Date()): boolean {
  const { hour, minute, weekday } = nycParts(now);
  if (weekday === 0 || weekday === 6) return false;
  const minutes = hour * 60 + minute;
  const open = 9 * 60 + 30; // 09:30
  const close = 16 * 60;     // 16:00
  return minutes >= open && minutes < close;
}

export type MarketStatus = "open" | "pre" | "after" | "closed-weekend";

export function marketStatus(now: Date = new Date()): MarketStatus {
  const { hour, minute, weekday } = nycParts(now);
  if (weekday === 0 || weekday === 6) return "closed-weekend";
  const minutes = hour * 60 + minute;
  if (minutes < 9 * 60 + 30) return "pre";
  if (minutes >= 16 * 60) return "after";
  return "open";
}

export function marketStatusLabel(status: MarketStatus): string {
  switch (status) {
    case "open":           return "Market open";
    case "pre":            return "Pre-market";
    case "after":          return "After hours";
    case "closed-weekend": return "Closed (weekend)";
  }
}

/** YYYY-MM-DD in NYC. */
export function nycDateString(d: Date = new Date()): string {
  const { year, month, day } = nycParts(d);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
