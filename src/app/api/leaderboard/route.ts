import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getQuotes } from "@/lib/services/finnhub";
import type { HoldingRow, PortfolioRow, UserRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard
 *
 * Aggregates all users' portfolios into a public leaderboard. We use the
 * service-role client because RLS would otherwise hide other users' portfolios.
 * Only safe, non-sensitive fields are returned (display name, total value, P&L).
 */
export async function GET() {
  const svc = createServiceClient();

  const { data: portfolios } = await svc
    .from("portfolios")
    .select("*, users:users(id, email, display_name)")
    .order("created_at");

  if (!portfolios || portfolios.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  const { data: holdings } = await svc.from("holdings").select("*");
  const holdingRows = (holdings ?? []) as HoldingRow[];

  const allSymbols = Array.from(new Set(holdingRows.map((h) => h.symbol)));
  const quotes = allSymbols.length > 0 ? await getQuotes(allSymbols) : [];
  const priceBy: Record<string, number> = Object.fromEntries(quotes.map((q) => [q.symbol, q.price]));

  const rows = (portfolios as Array<PortfolioRow & { users: Pick<UserRow, "id" | "email" | "display_name"> | null }>)
    .map((p) => {
      const userHoldings = holdingRows.filter((h) => h.portfolio_id === p.id);
      let holdingsValue = 0;
      for (const h of userHoldings) {
        holdingsValue += h.quantity * (priceBy[h.symbol] ?? h.avg_cost);
      }
      const totalValue = p.cash_balance + holdingsValue;
      const baseline = p.starting_balance;
      const totalPnl = totalValue - baseline;
      const totalPnlPct = baseline > 0 ? (totalPnl / baseline) * 100 : 0;
      return {
        userId: p.user_id,
        displayName: p.users?.display_name || p.users?.email?.split("@")[0] || "Trader",
        totalValue,
        totalPnl,
        totalPnlPct,
        positions: userHoldings.length,
      };
    })
    .sort((a, b) => b.totalPnlPct - a.totalPnlPct);

  return NextResponse.json({ leaderboard: rows });
}
