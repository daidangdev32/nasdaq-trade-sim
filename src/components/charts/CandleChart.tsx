"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import type { Candle } from "@/types/stocks";

interface Props {
  candles: Candle[];
  height?: number;
}

/**
 * TradingView-style candlestick chart powered by their open-source
 * lightweight-charts library.
 */
export function CandleChart({ candles, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a96b0",
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        horzLines: { color: "#172238" },
        vertLines: { color: "#172238" },
      },
      rightPriceScale: { borderColor: "#1f2a44" },
      timeScale: { borderColor: "#1f2a44", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      autoSize: true,
    });
    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(
      candles.map((c) => ({
        time: c.t as Time,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}
