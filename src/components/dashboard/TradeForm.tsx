"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtUSD } from "@/lib/utils";
import type { TradeSide } from "@/types/stocks";

interface Props {
  symbol: string;
  price: number;
  cash: number;
  ownedQty: number;
}

export function TradeForm({ symbol, price, cash, ownedQty }: Props) {
  const router = useRouter();
  const [side, setSide] = useState<TradeSide>("buy");
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const quantity = Number(qty);
  const total = useMemo(() => (isFinite(quantity) ? quantity * price : 0), [quantity, price]);

  const max = side === "buy" ? Math.floor((cash / price) * 100) / 100 : ownedQty;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!isFinite(quantity) || quantity <= 0) {
      setError("Enter a positive quantity.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, side, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Trade failed");
      const verb = side === "buy" ? "Bought" : "Sold";
      setSuccess(`${verb} ${quantity} ${symbol} @ ${fmtUSD(data.executedPrice)}.`);
      setQty("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <SideButton
          active={side === "buy"}
          onClick={() => setSide("buy")}
          tone="bull"
          label="Buy"
          icon={<ArrowDownToLine className="w-4 h-4" />}
        />
        <SideButton
          active={side === "sell"}
          onClick={() => setSide("sell")}
          tone="bear"
          label="Sell"
          icon={<ArrowUpFromLine className="w-4 h-4" />}
        />
      </div>

      <label className="block">
        <div className="flex items-center justify-between text-xs">
          <span className="uppercase tracking-wide text-text-muted">Quantity</span>
          <button
            type="button"
            onClick={() => setQty(max.toString())}
            className="text-accent hover:text-accent-hover"
          >
            Max: {max.toFixed(4)}
          </button>
        </div>
        <input
          type="number"
          step="0.0001"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="mt-1 w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-base tabular-nums"
        />
      </label>

      <div className="rounded-lg border border-border-subtle bg-bg-subtle/40 p-3 text-sm space-y-1">
        <Row label="Price" value={fmtUSD(price)} />
        <Row label="Estimated total" value={fmtUSD(total || 0)} bold />
        <Row label={side === "buy" ? "Cash after" : "Cash after"} value={fmtUSD(side === "buy" ? cash - (total || 0) : cash + (total || 0))} />
        <Row label="Shares owned" value={ownedQty.toFixed(4)} />
      </div>

      {error && <p className="text-bear text-sm">{error}</p>}
      {success && <p className="text-bull text-sm">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium",
          side === "buy" ? "bg-bull hover:bg-bull/90" : "bg-bear hover:bg-bear/90",
          "disabled:opacity-60",
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : side === "buy" ? "Buy" : "Sell"}
      </button>
    </form>
  );
}

function SideButton({
  active, onClick, tone, label, icon,
}: { active: boolean; onClick: () => void; tone: "bull" | "bear"; label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors",
        active
          ? tone === "bull"
            ? "bg-bull/10 border-bull/40 text-bull"
            : "bg-bear/10 border-bear/40 text-bear"
          : "border-border bg-bg-subtle text-text-muted hover:text-text",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold text-text")}>{value}</span>
    </div>
  );
}
