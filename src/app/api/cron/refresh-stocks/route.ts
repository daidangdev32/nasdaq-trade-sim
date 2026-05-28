/**
 * Scheduled job — refreshes the price + history tables and writes a daily
 * portfolio snapshot for every user.
 *
 * Triggered by Vercel Cron:  see vercel.json — runs at 13:30 UTC, Mon–Fri,
 * which is 09:30 NY time (US market open) outside of daylight-saving.
 *
 * Manual invocation:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://<your-domain>/api/cron/refresh-stocks
 *
 * The route uses the **service role** Supabase client so it can write to
 * stock_prices, stock_history, and portfolio_snapshots regardless of RLS.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCandles, getQuote } from "@/lib/services/finnhub";
import { TRACKED_STOCKS } from "@/constants/stocks";
import { nycDateString } from "@/lib/market";
import type { HoldingRow, PortfolioRow } from "@/types/database";

export const runtime = "nodejs";
// Vercel cron jobs have a 60s default timeout on Hobby — keep this snappy.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically for crons
  // configured in vercel.json. Anyone hitting the route manually must include
  // the same header.
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization") || "";
  return got === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const startedAt = new Date().toISOString();
  const errors: Array<{ symbol: string; error: string }> = [];
  const priceRows = [];
  const historyRows = [];

  // -- 1. Refresh prices + append a history row -------------------------------
  for (const stock of TRACKED_STOCKS) {
    try {
      const quote = await getQuote(stock.symbol);
      priceRows.push({
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        change_pct: quote.changePct,
        prev_close: quote.prevClose,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        market_cap: quote.marketCap,
        volume: quote.volume,
        updated_at: new Date().toISOString(),
      });

      const candles = await getCandles(stock.symbol, "D", 5);
      const latest = candles[candles.length - 1];
      if (latest) {
        historyRows.push({
          symbol: stock.symbol,
          trade_date: nycDateString(new Date(latest.t * 1000)),
          open: latest.o,
          high: latest.h,
          low: latest.l,
          close: latest.c,
          volume: latest.v,
        });
      }
    } catch (e) {
      errors.push({ symbol: stock.symbol, error: e instanceof Error ? e.message : "Unknown" });
    }
  }

  if (priceRows.length > 0) {
    const { error } = await svc.from("stock_prices").upsert(priceRows, { onConflict: "symbol" });
    if (error) errors.push({ symbol: "*", error: `stock_prices upsert: ${error.message}` });
  }
  if (historyRows.length > 0) {
    const { error } = await svc
      .from("stock_history")
      .upsert(historyRows, { onConflict: "symbol,trade_date" });
    if (error) errors.push({ symbol: "*", error: `stock_history upsert: ${error.message}` });
  }

  // -- 2. Snapshot every user's portfolio value -------------------------------
  const snapshotDate = nycDateString();
  const priceBy: Record<string, number> = Object.fromEntries(priceRows.map((p) => [p.symbol, Number(p.price)]));

  const { data: portfolios } = await svc.from("portfolios").select("*");
  const { data: holdings } = await svc.from("holdings").select("*");
  const holdingRows = (holdings ?? []) as HoldingRow[];

  const snapshots = (portfolios ?? []).map((p: PortfolioRow) => {
    const ph = holdingRows.filter((h) => h.portfolio_id === p.id);
    let holdingsValue = 0;
    for (const h of ph) {
      holdingsValue += h.quantity * (priceBy[h.symbol] ?? h.avg_cost);
    }
    return {
      portfolio_id: p.id,
      snapshot_date: snapshotDate,
      cash_balance: p.cash_balance,
      holdings_value: holdingsValue,
      total_value: p.cash_balance + holdingsValue,
    };
  });

  if (snapshots.length > 0) {
    const { error } = await svc
      .from("portfolio_snapshots")
      .upsert(snapshots, { onConflict: "portfolio_id,snapshot_date" });
    if (error) errors.push({ symbol: "*", error: `snapshots upsert: ${error.message}` });
  }

  return NextResponse.json({
    ok: errors.length === 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    pricesUpdated: priceRows.length,
    historyAppended: historyRows.length,
    snapshotsWritten: snapshots.length,
    errors,
  });
}
