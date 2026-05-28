import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioSummary, getTransactions, riskScore, winRate } from "@/lib/services/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const summary = await getPortfolioSummary(supabase, user.id);
  if (!summary) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const txs = await getTransactions(supabase, summary.portfolio.id);
  const { rate, wins, total } = winRate(txs);

  return NextResponse.json({
    portfolio: summary.portfolio,
    holdings: summary.holdings,
    quotes: summary.quotes,
    transactions: txs,
    totals: {
      holdingsValue: summary.holdingsValue,
      totalValue: summary.totalValue,
      totalPnl: summary.totalPnl,
      totalPnlPct: summary.totalPnlPct,
      dayPnl: summary.dayPnl,
      dayPnlPct: summary.dayPnlPct,
    },
    stats: {
      riskScore: riskScore(summary),
      winRate: rate,
      wins,
      totalSells: total,
    },
  });
}
