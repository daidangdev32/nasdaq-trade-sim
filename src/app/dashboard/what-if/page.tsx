"use client";

import { useEffect, useMemo, useState } from "react";
import { TRACKED_STOCKS } from "@/constants/stocks";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { fmtUSD, fmtPct, tone } from "@/lib/utils";
import type { Candle } from "@/types/stocks";

/**
 * "What if I'd bought X dollars of Y, Z days ago?" — fetches historical candles
 * client-side and computes the hypothetical return.
 */
export default function WhatIfPage() {
  const [symbol, setSymbol] = useState(TRACKED_STOCKS[0].symbol);
  const [amount, setAmount] = useState("10000");
  const [daysAgo, setDaysAgo] = useState("90");
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/stocks/${symbol}/candles?resolution=D&range=${Math.max(30, Number(daysAgo) + 5)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setCandles(d.candles);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [symbol, daysAgo]);

  const result = useMemo(() => {
    if (!candles || candles.length < 2) return null;
    const days = Math.max(1, Number(daysAgo) | 0);
    const idx = Math.max(0, candles.length - 1 - days);
    const buy = candles[idx];
    const now = candles[candles.length - 1];
    const amt = Math.max(0, Number(amount));
    const shares = amt / buy.c;
    const nowValue = shares * now.c;
    const pnl = nowValue - amt;
    const pct = amt > 0 ? (pnl / amt) * 100 : 0;
    return { buyDate: new Date(buy.t * 1000), buyPrice: buy.c, nowPrice: now.c, shares, nowValue, pnl, pct };
  }, [candles, amount, daysAgo]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-text-muted text-sm">Counterfactual analysis</p>
        <h1 className="text-2xl font-semibold mt-1">What-If</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>If I had invested…</CardTitle></CardHeader>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Stock">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-sm"
            >
              {TRACKED_STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount ($)">
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-sm tabular-nums"
            />
          </Field>
          <Field label="Days ago">
            <input
              type="number"
              min="1"
              max="365"
              value={daysAgo}
              onChange={(e) => setDaysAgo(e.target.value)}
              className="w-full rounded-lg bg-bg-subtle border border-border focus:border-accent outline-none px-3 py-2 text-sm tabular-nums"
            />
          </Field>
        </div>
      </Card>

      {error && <p className="text-bear text-sm">{error}</p>}
      {loading && <p className="text-text-muted text-sm">Loading historical prices…</p>}

      {result && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><Stat label="Buy price" value={fmtUSD(result.buyPrice)} hint={result.buyDate.toLocaleDateString()} /></Card>
          <Card><Stat label="Current price" value={fmtUSD(result.nowPrice)} /></Card>
          <Card><Stat label="Current value" value={fmtUSD(result.nowValue)} hint={`${result.shares.toFixed(4)} shares`} /></Card>
          <Card>
            <Stat label="Return" value={fmtUSD(result.pnl)} tone={tone(result.pnl)} hint={fmtPct(result.pct)} />
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
