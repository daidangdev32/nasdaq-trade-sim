import { NextResponse } from "next/server";
import { getCandles, getQuote } from "@/lib/services/finnhub";
import { generateInsight } from "@/lib/services/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { symbol: string } }) {
  try {
    const [quote, candles] = await Promise.all([
      getQuote(params.symbol),
      getCandles(params.symbol, "D", 60),
    ]);
    const insight = await generateInsight(quote, candles);
    return NextResponse.json({ insight });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
