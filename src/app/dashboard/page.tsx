import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getQuotes } from "@/lib/services/finnhub";
import { getPortfolioSummary } from "@/lib/services/portfolio";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Pill } from "@/components/ui/Pill";
import { StockRow, StockRowHeader } from "@/components/dashboard/StockRow";
import { AllocationPie } from "@/components/charts/AllocationPie";
import { fmtUSD, fmtPct, tone } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [summary, quotes] = await Promise.all([
    getPortfolioSummary(supabase, user.id),
    getQuotes(),
  ]);

  if (!summary) return null;

  const pieData = summary.holdings.map((h) => ({ symbol: h.symbol, value: h.marketValue }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-text-muted text-sm">Welcome back</p>
          <h1 className="text-2xl font-semibold mt-1">Trading Dashboard</h1>
        </div>
        <Link
          href="/dashboard/trade"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium"
        >
          Place a trade <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Stat label="Total value" value={fmtUSD(summary.totalValue)} />
        </Card>
        <Card>
          <Stat
            label="All-time P&L"
            value={fmtUSD(summary.totalPnl)}
            tone={tone(summary.totalPnl)}
            hint={fmtPct(summary.totalPnlPct)}
          />
        </Card>
        <Card>
          <Stat
            label="Today's P&L"
            value={fmtUSD(summary.dayPnl)}
            tone={tone(summary.dayPnl)}
            hint={fmtPct(summary.dayPnlPct)}
          />
        </Card>
        <Card>
          <Stat label="Cash" value={fmtUSD(summary.portfolio.cash_balance)} hint={`of ${fmtUSD(summary.portfolio.starting_balance)} starting`} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tracked stocks</CardTitle>
            <Link href="/dashboard/trade" className="text-xs text-accent">View all →</Link>
          </CardHeader>
          <div className="-mx-5 -mb-5">
            <StockRowHeader />
            {quotes.map((q) => (
              <StockRow key={q.symbol} quote={q} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio allocation</CardTitle>
            {summary.holdings.length > 0 && (
              <Pill tone="accent">{summary.holdings.length} positions</Pill>
            )}
          </CardHeader>
          <AllocationPie data={pieData} />
        </Card>
      </div>
    </div>
  );
}
