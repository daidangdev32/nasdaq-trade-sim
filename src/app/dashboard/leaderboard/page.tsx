import { headers } from "next/headers";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { fmtUSD, fmtPct, tone, cn } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { Trophy, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

interface Row {
  userId: string;
  displayName: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  positions: number;
}

async function fetchLeaderboard(): Promise<Row[]> {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/leaderboard`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.leaderboard ?? [];
}

export default async function LeaderboardPage() {
  const rows = await fetchLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-text-muted text-sm">Who's beating the market</p>
        <h1 className="text-2xl font-semibold mt-1">Leaderboard</h1>
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-5 py-3">
          <CardTitle>Ranked by total return</CardTitle>
          <Pill tone="accent">{rows.length} traders</Pill>
        </CardHeader>
        <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs uppercase tracking-wide text-text-muted border-b border-border-subtle">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Trader</div>
          <div className="col-span-2 text-right">Positions</div>
          <div className="col-span-2 text-right">Total value</div>
          <div className="col-span-2 text-right">Return</div>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-text-muted">No traders yet.</p>
        ) : (
          rows.map((row, idx) => {
            const t = tone(row.totalPnl);
            return (
              <div
                key={row.userId}
                className="grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b border-border-subtle last:border-b-0 hover:bg-bg-hover/60"
              >
                <div className="col-span-1 flex items-center">
                  {idx === 0 ? <Trophy className="w-4 h-4 text-yellow-400" />
                    : idx === 1 ? <Medal className="w-4 h-4 text-gray-300" />
                    : idx === 2 ? <Medal className="w-4 h-4 text-orange-400" />
                    : <span className="text-text-muted">{idx + 1}</span>}
                </div>
                <div className="col-span-5 truncate">{row.displayName}</div>
                <div className="col-span-2 text-right tabular-nums text-text-muted">{row.positions}</div>
                <div className="col-span-2 text-right tabular-nums">{fmtUSD(row.totalValue)}</div>
                <div className={cn("col-span-2 text-right tabular-nums font-medium", t === "bull" ? "text-bull" : t === "bear" ? "text-bear" : "")}>
                  {fmtPct(row.totalPnlPct)}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
