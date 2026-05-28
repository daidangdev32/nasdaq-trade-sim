import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioSummary, getTransactions, riskScore, winRate } from "@/lib/services/portfolio";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Pill } from "@/components/ui/Pill";
import { AllocationPie } from "@/components/charts/AllocationPie";
import { fmtUSD, fmtPct, fmtQty, tone, cn } from "@/lib/utils";
import { format } from "date-fns";
import { Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const summary = await getPortfolioSummary(supabase, user.id);
  if (!summary) return null;
  const txs = await getTransactions(supabase, summary.portfolio.id, 100);
  const wr = winRate(txs);
  const risk = riskScore(summary);
  const pie = summary.holdings.map((h) => ({ symbol: h.symbol, value: h.marketValue }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-text-muted text-sm">Your account</p>
        <h1 className="text-2xl font-semibold mt-1">Portfolio</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><Stat label="Total value" value={fmtUSD(summary.totalValue)} /></Card>
        <Card><Stat label="Holdings value" value={fmtUSD(summary.holdingsValue)} /></Card>
        <Card><Stat label="Cash" value={fmtUSD(summary.portfolio.cash_balance)} /></Card>
        <Card>
          <Stat
            label="All-time P&L"
            value={fmtUSD(summary.totalPnl)}
            tone={tone(summary.totalPnl)}
            hint={fmtPct(summary.totalPnlPct)}
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          {summary.holdings.length === 0 ? (
            <EmptyHoldings />
          ) : (
            <div className="-mx-5 -mb-5">
              <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs uppercase tracking-wide text-text-muted border-b border-border-subtle">
                <div className="col-span-3">Symbol</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Avg cost</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-3 text-right">P&L</div>
              </div>
              {summary.holdings.map((h) => (
                <Link
                  href={`/dashboard/stock/${h.symbol}`}
                  key={h.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-bg-hover/60 border-b border-border-subtle last:border-b-0"
                >
                  <div className="col-span-3">
                    <div className="font-medium">{h.symbol}</div>
                    <div className="text-xs text-text-muted truncate">{h.name}</div>
                  </div>
                  <div className="col-span-2 text-right tabular-nums">{fmtQty(h.quantity)}</div>
                  <div className="col-span-2 text-right tabular-nums text-text-muted">{fmtUSD(h.avg_cost)}</div>
                  <div className="col-span-2 text-right tabular-nums">{fmtUSD(h.currentPrice)}</div>
                  <div className={cn("col-span-3 text-right tabular-nums", tone(h.unrealizedPnl) === "bull" ? "text-bull" : tone(h.unrealizedPnl) === "bear" ? "text-bear" : "")}>
                    {fmtUSD(h.unrealizedPnl)} <span className="text-text-muted">({fmtPct(h.unrealizedPnlPct)})</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <Pill tone="accent">{summary.holdings.length} positions</Pill>
          </CardHeader>
          <AllocationPie data={pie} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Risk score" value={`${risk}/100`} hint={risk > 70 ? "Concentrated" : risk > 40 ? "Moderate" : "Conservative"} />
            <Stat label="Win rate" value={`${wr.rate.toFixed(0)}%`} hint={`${wr.wins} of ${wr.total} sells`} />
            <Stat label="Positions" value={summary.holdings.length.toString()} />
            <Stat label="Today's P&L" value={fmtUSD(summary.dayPnl)} tone={tone(summary.dayPnl)} />
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          {txs.length === 0 ? (
            <p className="text-text-muted text-sm">No trades yet.</p>
          ) : (
            <div className="-mx-5 -mb-5 max-h-96 overflow-y-auto">
              {txs.slice(0, 20).map((t) => (
                <div key={t.id} className="px-5 py-2.5 border-b border-border-subtle last:border-b-0 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill tone={t.side === "buy" ? "bull" : "bear"}>{t.side.toUpperCase()}</Pill>
                    <span className="font-medium">{t.symbol}</span>
                    <span className="text-text-muted tabular-nums">{fmtQty(t.quantity)} @ {fmtUSD(t.price)}</span>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums">{fmtUSD(t.total)}</div>
                    <div className="text-xs text-text-muted">{format(new Date(t.executed_at), "MMM d, HH:mm")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmptyHoldings() {
  return (
    <div className="py-10 text-center">
      <Briefcase className="w-10 h-10 mx-auto text-text-subtle mb-3" />
      <p className="text-text-muted">No positions yet. Place your first trade to get started.</p>
      <Link href="/dashboard/trade" className="inline-block mt-4 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm">
        Open trade page
      </Link>
    </div>
  );
}
