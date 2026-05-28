import { NextResponse } from "next/server";
import { getCandles } from "@/lib/services/finnhub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  const url = new URL(req.url);
  const resolution = (url.searchParams.get("resolution") || "D") as "D" | "60" | "30" | "15";
  const rangeDays = Number(url.searchParams.get("range") || 180);
  try {
    const candles = await getCandles(params.symbol, resolution, rangeDays);
    return NextResponse.json({ candles });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
