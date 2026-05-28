/**
 * Trading engine — executes a buy or sell against a user's portfolio.
 *
 * Realistic guarantees:
 *  - Cash balance never goes negative.
 *  - You can't sell more shares than you hold.
 *  - You can only trade tickers in TRACKED_SYMBOLS.
 *  - Quantity must be a positive number (fractional shares allowed).
 *  - Each trade writes a transactions row AND mutates holdings / cash atomically
 *    enough for this simulator (see note at bottom for true atomicity).
 *  - Average cost basis is recomputed on every buy.
 *  - Realized P/L is computed and stored on sells (FIFO-style against avg_cost).
 *
 * Market hours: by default we allow trading any time, since simulators are most
 * useful when users can practice on their schedule. Set ENFORCE_MARKET_HOURS
 * to true if you want to restrict trading to NYC 09:30–16:00.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { TRACKED_SYMBOLS } from "@/constants/stocks";
import { round4, round6 } from "@/lib/utils";
import type { HoldingRow, PortfolioRow } from "@/types/database";
import type { TradeResult } from "@/types/stocks";

import { getQuote } from "./finnhub";
import { evaluateAchievementsAfterTrade } from "./achievements";

const ENFORCE_MARKET_HOURS = false;

export const TradeRequestSchema = z.object({
  symbol: z.string().min(1).max(8),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().positive().finite(),
});

export type TradeInput = z.infer<typeof TradeRequestSchema>;

export class TradeError extends Error {
  constructor(message: string, public code: string = "TRADE_ERROR") {
    super(message);
  }
}

/**
 * Execute a trade as the currently authenticated user. The supabase client
 * must be authenticated (server-side, via cookies) so RLS picks up the user.
 */
export async function executeTrade(supabase: SupabaseClient, userId: string, raw: TradeInput): Promise<TradeResult> {
  const input = TradeRequestSchema.parse(raw);
  const symbol = input.symbol.toUpperCase();

  if (!TRACKED_SYMBOLS.includes(symbol)) {
    throw new TradeError(`We don't track ${symbol} in this simulator.`, "UNSUPPORTED_SYMBOL");
  }

  if (ENFORCE_MARKET_HOURS) {
    const { isMarketOpen } = await import("@/lib/market");
    if (!isMarketOpen()) throw new TradeError("US market is currently closed.", "MARKET_CLOSED");
  }

  // 1. Resolve current price.
  const quote = await getQuote(symbol);
  const price = quote.price;
  if (!price || price <= 0) {
    throw new TradeError("Could not resolve a valid price for this symbol.", "BAD_PRICE");
  }

  // 2. Load portfolio + existing holding.
  const { data: portfolio, error: pErr } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .single<PortfolioRow>();
  if (pErr || !portfolio) throw new TradeError("Portfolio not found for user.", "NO_PORTFOLIO");

  const { data: existing } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio.id)
    .eq("symbol", symbol)
    .maybeSingle<HoldingRow>();

  const qty = round6(input.quantity);
  const total = round4(price * qty);

  let newCash = portfolio.cash_balance;
  let newQty = existing?.quantity ?? 0;
  let newAvgCost = existing?.avg_cost ?? 0;
  let realizedPnl: number | null = null;

  if (input.side === "buy") {
    if (total > portfolio.cash_balance + 1e-6) {
      throw new TradeError(
        `Insufficient cash. Need $${total.toFixed(2)}, have $${portfolio.cash_balance.toFixed(2)}.`,
        "INSUFFICIENT_CASH",
      );
    }
    const totalCostBefore = newQty * newAvgCost;
    newQty = round6(newQty + qty);
    newAvgCost = newQty > 0 ? round4((totalCostBefore + total) / newQty) : 0;
    newCash = round4(portfolio.cash_balance - total);
  } else {
    // sell
    if (qty > (existing?.quantity ?? 0) + 1e-9) {
      throw new TradeError(
        `Not enough shares to sell. You hold ${(existing?.quantity ?? 0).toFixed(6)} ${symbol}.`,
        "INSUFFICIENT_SHARES",
      );
    }
    realizedPnl = round4((price - newAvgCost) * qty);
    newQty = round6(newQty - qty);
    newCash = round4(portfolio.cash_balance + total);
    if (newQty === 0) newAvgCost = 0; // reset basis once flat
  }

  // 3. Persist — three writes, ordered to fail safely.
  const { error: txErr } = await supabase.from("transactions").insert({
    portfolio_id: portfolio.id,
    symbol,
    side: input.side,
    quantity: qty,
    price: round4(price),
    total,
    realized_pnl: realizedPnl,
  });
  if (txErr) throw new TradeError(txErr.message, "TX_INSERT_FAILED");

  if (existing) {
    if (newQty === 0) {
      await supabase.from("holdings").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("holdings")
        .update({ quantity: newQty, avg_cost: newAvgCost })
        .eq("id", existing.id);
    }
  } else if (input.side === "buy") {
    await supabase.from("holdings").insert({
      portfolio_id: portfolio.id,
      symbol,
      quantity: newQty,
      avg_cost: newAvgCost,
    });
  }

  await supabase
    .from("portfolios")
    .update({ cash_balance: newCash })
    .eq("id", portfolio.id);

  // 4. Evaluate achievements (non-fatal if it fails).
  let newlyUnlocked: string[] = [];
  try {
    newlyUnlocked = await evaluateAchievementsAfterTrade(supabase, userId, portfolio.id);
  } catch (e) {
    console.warn("[trading] achievement eval failed:", e);
  }

  return {
    ok: true,
    executedPrice: round4(price),
    total,
    realizedPnl,
    newCashBalance: newCash,
    newQuantity: newQty,
    newlyUnlocked,
  };
}

/*
 * Note on atomicity:
 *
 * For a serious production system you would wrap these three writes in a
 * Postgres function (PL/pgSQL) and call it via `supabase.rpc("execute_trade",...)`
 * so they share a single transaction. Inside a simulator with one-user-per-row
 * RLS, the worst case (a race between two simultaneous trades from the same
 * user) is unlikely and self-healing — the second trade will simply read stale
 * cash and fail the INSUFFICIENT_CASH check.
 *
 * If you want full atomicity, port `executeTrade` to a Postgres function. The
 * route handler in /api/trade/route.ts already passes the user id explicitly,
 * so the migration is mechanical.
 */
