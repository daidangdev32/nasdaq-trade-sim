import { notFound } from "next/navigation";
import { TrendingDown, TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCandles, getCompanyNews, getQuote } from "@/lib/services/finnhub";
import { generateInsight } from "@/lib/services/anthropic";
import { TRACKED_SYMBOLS, getStockInfo } from "@/constants/stocks";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Pill } from "@/components/ui/Pill";
import { CandleChart } from "@/components/charts/CandleChart";
import { TradeForm } from "@/components/dashboard/TradeForm";
import { WatchlistButton } from "@/components/dashboard/WatchlistButton";
import { fmtUSD, fmtPct, fmtUSDCompact, tone, cn } from "@/lib/utils";
import { format } from "date-fns";
import type { HoldingRow, PortfolioRow, WatchlistRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  if (!TRACKED_SYMBOLS.includes(symbol)) notFound();
  const info = getStockInfo(symbol);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [quote, candles, news, portfolio, watchlist] = await Promise.all([
    getQuote(symbol),
    getCandles(symbol, "D", 180),
    getCompanyNews(symbol).catch(() => []),
    supabase.from("portfolios").select("*").eq("user_id", user.id).single<PortfolioRow>(),
    supabase.from("watchlists").select("*").eq("user_id", user.id).eq("symbol", symbol).maybeSingle<WatchlistRow>(),
  ]);

  const { data: holding } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio.data?.id ?? "")
    .eq("symbol", symbol)
    .maybeSingle<HoldingRow>();

  const insight = await generateInsight(quote, candles).catch(() => null);
  const t = tone(quote.changePct);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center font-semibold"
            style={{ background: `${info?.color}26`, color: info?.color }}
          >
            {symbol.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{quote.name}</h1>
            <p className="text-sm text-text-muted">
              {symbol} · {info?.sector}
              {quote.isMock && <Pill tone="neutral" className="ml-2">Mock data</Pill>}
            </p>
          </div>
        </div>
        <WatchlistButton symbol={symbol} initiallyOn={!!watchlist.data} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Stat label="Price" value={fmtUSD(quote.price)} />
        </Card>
        <Card>
          <Stat
            label="Today's change"
            value={fmtUSD(quote.change)}
            tone={t}
            hint={fmtPct(quote.changePct)}
          />
        </Card>
        <Card>
          <Stat label="Prev close" value={fmtUSD(quote.prevClose)} hint={`H ${fmtUSD(quote.dayHigh)} · L ${fmtUSD(quote.dayLow)}`} />
        </Card>
        <Card>
          <Stat label="Market cap" value={quote.marketCap ? fmtUSDCompact(quote.marketCap) : "—"} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>180-day price history</CardTitle>
            <Pill tone={t === "flat" ? "neutral" : t}>
              {t === "bull" ? <TrendingUp className="w-3 h-3" /> : t === "bear" ? <TrendingDown className="w-3 h-3" /> : null}
              {fmtPct(quote.changePct)}
            </Pill>
          </CardHeader>
          <CandleChart candles={candles} height={400} />
        </Card>

        <Card>
          <CardHeader><CardTitle>Trade</CardTitle></CardHeader>
          {portfolio.data ? (
            <TradeForm
              symbol={symbol}
              price={quote.price}
              cash={portfolio.data.cash_balance}
              ownedQty={holding?.quantity ?? 0}
            />
          ) : (
            <p className="text-text-muted text-sm">Portfolio not loaded.</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>News</CardTitle>
            <span className="text-xs text-text-subtle">Powered by Finnhub</span>
          </CardHeader>
          {news.length === 0 ? (
            <p className="text-text-muted text-sm">No recent news.</p>
          ) : (
            <div className="-mx-5 -mb-5 max-h-[28rem] overflow-y-auto">
              {news.slice(0, 12).map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-5 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-hover/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{n.headline}</div>
                      <div className="text-xs text-text-muted mt-1 line-clamp-2">{n.summary}</div>
                      <div className="text-xs text-text-subtle mt-1.5">
                        {n.source} · {format(new Date(n.publishedAt), "MMM d, HH:mm")}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-subtle shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-accent" /> AI insight</CardTitle>
            {insight?.isMock && <Pill tone="neutral">Mock</Pill>}
          </CardHeader>
          {!insight ? (
            <p className="text-text-muted text-sm">Insight unavailable.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-text">{insight.summary}</p>
              <div>
                <span className="text-xs uppercase tracking-wide text-text-muted">Outlook</span>
                <div className="mt-1">
                  <Pill tone={insight.outlook === "bullish" ? "bull" : insight.outlook === "bearish" ? "bear" : "neutral"}>
                    {insight.outlook}
                  </Pill>
                </div>
              </div>
              {insight.risks.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-text-muted">Risks</span>
                  <ul className="mt-1 space-y-1">
                    {insight.risks.map((r, i) => (
                      <li key={i} className={cn("text-text-muted flex gap-2")}>
                        <span className="text-accent">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
