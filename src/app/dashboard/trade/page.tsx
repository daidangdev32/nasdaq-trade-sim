import { getQuotes } from "@/lib/services/finnhub";
import { Card } from "@/components/ui/Card";
import { StockRow, StockRowHeader } from "@/components/dashboard/StockRow";

export const dynamic = "force-dynamic";

export default async function TradeIndexPage() {
  const quotes = await getQuotes();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-text-muted text-sm">Choose a stock to trade</p>
        <h1 className="text-2xl font-semibold mt-1">Market</h1>
      </div>

      <Card className="p-0 overflow-hidden">
        <StockRowHeader />
        {quotes.map((q) => (
          <StockRow key={q.symbol} quote={q} />
        ))}
      </Card>

      <p className="text-xs text-text-subtle">
        Prices are pulled from Finnhub (delayed by ~15 minutes on the free tier). Click a row to open the trade panel.
      </p>
    </div>
  );
}
