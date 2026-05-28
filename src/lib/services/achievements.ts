/**
 * Achievement evaluator. Called after every trade. Idempotent — re-running it
 * just no-ops on already-unlocked achievements.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HoldingRow, TransactionRow } from "@/types/database";
import { getQuotes } from "./finnhub";

/**
 * Returns the list of achievement codes that were *newly* unlocked by this call.
 */
export async function evaluateAchievementsAfterTrade(
  supabase: SupabaseClient,
  userId: string,
  portfolioId: string,
): Promise<string[]> {
  // Load everything we need to evaluate every rule.
  const [{ data: holdings }, { data: txs }, { data: unlocked }, { data: portfolio }] = await Promise.all([
    supabase.from("holdings").select("*").eq("portfolio_id", portfolioId),
    supabase.from("transactions").select("*").eq("portfolio_id", portfolioId).order("executed_at"),
    supabase.from("user_achievements").select("achievement_code").eq("user_id", userId),
    supabase.from("portfolios").select("cash_balance").eq("id", portfolioId).single<{ cash_balance: number }>(),
  ]);

  const holdingRows = (holdings ?? []) as HoldingRow[];
  const txRows = (txs ?? []) as TransactionRow[];
  const have = new Set((unlocked ?? []).map((r) => r.achievement_code));
  const cash = portfolio?.cash_balance ?? 0;

  // Live valuation needs current prices.
  const symbols = Array.from(new Set(holdingRows.map((h) => h.symbol)));
  let portfolioValue = cash;
  if (symbols.length > 0) {
    const quotes = await getQuotes(symbols);
    const priceBy: Record<string, number> = {};
    for (const q of quotes) priceBy[q.symbol] = q.price;
    for (const h of holdingRows) {
      portfolioValue += h.quantity * (priceBy[h.symbol] ?? h.avg_cost);
    }
  }

  const wantsUnlock: string[] = [];
  const want = (code: string, cond: boolean) => {
    if (cond && !have.has(code)) wantsUnlock.push(code);
  };

  const buyCount = txRows.filter((t) => t.side === "buy").length;
  const totalTrades = txRows.length;
  const profitableSells = txRows.filter((t) => t.side === "sell" && (t.realized_pnl ?? 0) > 0);
  const maxSellPnL = txRows
    .filter((t) => t.side === "sell")
    .reduce((m, t) => Math.max(m, t.realized_pnl ?? 0), 0);

  want("first_trade",    buyCount >= 1);
  want("ten_trades",     totalTrades >= 10);
  want("hundred_trades", totalTrades >= 100);
  want("first_profit",   profitableSells.length >= 1);
  want("big_win_1k",     maxSellPnL >= 1_000);
  want("big_win_10k",    maxSellPnL >= 10_000);
  want("portfolio_110k", portfolioValue >= 110_000);
  want("portfolio_150k", portfolioValue >= 150_000);
  want("portfolio_200k", portfolioValue >= 200_000);
  want("diversified",    holdingRows.length >= 5);

  // All-in: 90%+ of value in a single position
  if (portfolioValue > 0 && symbols.length > 0) {
    const quotes = await getQuotes(symbols);
    const priceBy: Record<string, number> = Object.fromEntries(quotes.map((q) => [q.symbol, q.price]));
    const largestPos = holdingRows.reduce((m, h) => Math.max(m, h.quantity * (priceBy[h.symbol] ?? h.avg_cost)), 0);
    want("all_in", largestPos / portfolioValue >= 0.9);
  }

  if (wantsUnlock.length === 0) return [];

  await supabase
    .from("user_achievements")
    .insert(wantsUnlock.map((code) => ({ user_id: userId, achievement_code: code })))
    .select();
  return wantsUnlock;
}

/**
 * Evaluate the watchlist-size achievement. Called from the watchlist API route.
 */
export async function evaluateWatchlistAchievements(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const [{ count }, { data: unlocked }] = await Promise.all([
    supabase.from("watchlists").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_achievements").select("achievement_code").eq("user_id", userId),
  ]);
  const have = new Set((unlocked ?? []).map((r) => r.achievement_code));
  if ((count ?? 0) >= 5 && !have.has("watchlist_5")) {
    await supabase.from("user_achievements").insert({ user_id: userId, achievement_code: "watchlist_5" });
    return ["watchlist_5"];
  }
  return [];
}
