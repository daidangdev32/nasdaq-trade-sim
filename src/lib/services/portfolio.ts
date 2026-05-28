/**
 * Portfolio aggregation — pure-ish read helpers used by both API routes and
 * server components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuotes } from "./finnhub";
import { STARTING_BALANCE } from "@/constants/stocks";
import type { HoldingRow, PortfolioRow, TransactionRow } from "@/types/database";
import type { Quote } from "@/types/stocks";

export interface EnrichedHolding extends HoldingRow {
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  weight: number;
  name: string;
}

export interface PortfolioSummary {
  portfolio: PortfolioRow;
  holdings: EnrichedHolding[];
  quotes: Quote[];
  holdingsValue: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  dayPnl: number;
  dayPnlPct: number;
}

export async function getPortfolioSummary(supabase: SupabaseClient, userId: string): Promise<PortfolioSummary | null> {
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .single<PortfolioRow>();
  if (!portfolio) return null;

  const { data: holdingsData } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio.id);
  const holdings = (holdingsData ?? []) as HoldingRow[];

  const symbols = holdings.map((h) => h.symbol);
  const quotes = symbols.length > 0 ? await getQuotes(symbols) : [];
  const priceBy: Record<string, Quote> = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  let holdingsValue = 0;
  let dayPnl = 0;
  const enriched: EnrichedHolding[] = holdings.map((h) => {
    const q = priceBy[h.symbol];
    const currentPrice = q?.price ?? h.avg_cost;
    const marketValue = currentPrice * h.quantity;
    const unrealizedPnl = (currentPrice - h.avg_cost) * h.quantity;
    const unrealizedPnlPct = h.avg_cost > 0 ? ((currentPrice - h.avg_cost) / h.avg_cost) * 100 : 0;
    holdingsValue += marketValue;
    if (q) dayPnl += (q.price - q.prevClose) * h.quantity;
    return {
      ...h,
      currentPrice,
      marketValue,
      unrealizedPnl,
      unrealizedPnlPct,
      weight: 0, // filled in below once we know holdingsValue
      name: q?.name ?? h.symbol,
    };
  });
  for (const e of enriched) {
    e.weight = holdingsValue > 0 ? e.marketValue / holdingsValue : 0;
  }

  const totalValue = holdingsValue + portfolio.cash_balance;
  const baseline = portfolio.starting_balance || STARTING_BALANCE;
  const totalPnl = totalValue - baseline;
  const totalPnlPct = baseline > 0 ? (totalPnl / baseline) * 100 : 0;
  const dayPnlPct = totalValue - dayPnl > 0 ? (dayPnl / (totalValue - dayPnl)) * 100 : 0;

  return {
    portfolio,
    holdings: enriched.sort((a, b) => b.marketValue - a.marketValue),
    quotes,
    holdingsValue,
    totalValue,
    totalPnl,
    totalPnlPct,
    dayPnl,
    dayPnlPct,
  };
}

export async function getTransactions(
  supabase: SupabaseClient,
  portfolioId: string,
  limit = 50,
): Promise<TransactionRow[]> {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("executed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as TransactionRow[];
}

/**
 * Compute a coarse "risk score" from 0–100.
 *  - Higher concentration → higher risk
 *  - More cash on the sidelines → lower risk
 *  - More distinct positions → lower risk
 */
export function riskScore(summary: PortfolioSummary): number {
  if (summary.totalValue <= 0) return 0;
  const cashRatio = summary.portfolio.cash_balance / summary.totalValue;
  const n = summary.holdings.length;
  const concentration = summary.holdings.reduce((m, h) => Math.max(m, h.weight), 0);
  let score = 50;
  score += (concentration - 0.2) * 100;   // each +1% concentration → +1 point
  score -= cashRatio * 30;                // a lot of cash → safer
  score -= Math.min(n, 5) * 4;            // diversification helps
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Win rate: of all completed sells, what fraction were profitable.
 */
export function winRate(transactions: TransactionRow[]): { rate: number; wins: number; total: number } {
  const sells = transactions.filter((t) => t.side === "sell");
  const wins = sells.filter((t) => (t.realized_pnl ?? 0) > 0).length;
  const total = sells.length;
  return { rate: total > 0 ? (wins / total) * 100 : 0, wins, total };
}
