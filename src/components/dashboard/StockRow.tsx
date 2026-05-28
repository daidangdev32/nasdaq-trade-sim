import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Quote } from "@/types/stocks";
import { fmtUSD, fmtPct, fmtUSDCompact, cn, tone } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { getStockInfo } from "@/constants/stocks";

export function StockRow({ quote }: { quote: Quote }) {
  const t = tone(quote.changePct);
  const info = getStockInfo(quote.symbol);

  return (
    <Link
      href={`/dashboard/stock/${quote.symbol}`}
      className="grid grid-cols-12 items-center gap-2 px-4 py-3 hover:bg-bg-hover/60 border-b border-border-subtle last:border-b-0 transition-colors"
    >
      <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg grid place-items-center text-xs font-semibold shrink-0"
          style={{ background: `${info?.color ?? "#5b8def"}26`, color: info?.color ?? "#5b8def" }}
        >
          {quote.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{quote.symbol}</div>
          <div className="text-xs text-text-muted truncate">{quote.name}</div>
        </div>
      </div>
      <div className="col-span-3 sm:col-span-2 text-right tabular-nums font-medium">{fmtUSD(quote.price)}</div>
      <div className="col-span-4 sm:col-span-3 text-right">
        <Pill tone={t}>
          {t === "bull" ? <TrendingUp className="w-3 h-3" /> : t === "bear" ? <TrendingDown className="w-3 h-3" /> : null}
          {fmtPct(quote.changePct)}
        </Pill>
      </div>
      <div className="hidden sm:block sm:col-span-3 text-right text-sm text-text-muted tabular-nums">
        {quote.marketCap ? fmtUSDCompact(quote.marketCap) : "—"}
      </div>
    </Link>
  );
}

export function StockRowHeader() {
  return (
    <div className="grid grid-cols-12 items-center gap-2 px-4 py-2 border-b border-border text-xs uppercase tracking-wide text-text-muted bg-bg-subtle/40">
      <div className="col-span-5 sm:col-span-4">Symbol</div>
      <div className="col-span-3 sm:col-span-2 text-right">Price</div>
      <div className="col-span-4 sm:col-span-3 text-right">Day</div>
      <div className="hidden sm:block sm:col-span-3 text-right">Market cap</div>
    </div>
  );
}
