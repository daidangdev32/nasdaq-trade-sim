import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("en-US");

export function fmtUSD(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return usd.format(n);
}

export function fmtUSDCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return usdCompact.format(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  // n is expressed as a percent value (e.g. 1.23 = 1.23%).
  return pctFmt.format(n / 100);
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return intFmt.format(n);
}

export function fmtQty(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1) return n.toFixed(2);
  return n.toFixed(6);
}

export function tone(n: number | null | undefined): "bull" | "bear" | "flat" {
  if (n === null || n === undefined || Number.isNaN(n) || n === 0) return "flat";
  return n > 0 ? "bull" : "bear";
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Round to 4 decimal places — matches the `numeric(18,4)` precision in DB.
 */
export function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
