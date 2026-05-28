import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/services/finnhub";
import { Card } from "@/components/ui/Card";
import { StockRow, StockRowHeader } from "@/components/dashboard/StockRow";
import { Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("watchlists")
    .select("symbol")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const symbols = (rows ?? []).map((r) => r.symbol);
  const quotes = await Promise.all(symbols.map((s) => getQuote(s)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-text-muted text-sm">Stocks you're tracking</p>
        <h1 className="text-2xl font-semibold mt-1">Watchlist</h1>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <Eye className="w-10 h-10 mx-auto text-text-subtle mb-3" />
            <p className="text-text-muted">Your watchlist is empty.</p>
            <Link href="/dashboard/trade" className="inline-block mt-4 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm">
              Browse stocks
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <StockRowHeader />
          {quotes.map((q) => (
            <StockRow key={q.symbol} quote={q} />
          ))}
        </Card>
      )}
    </div>
  );
}
