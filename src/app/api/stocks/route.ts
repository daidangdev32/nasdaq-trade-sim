import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/services/finnhub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stocks
 * Returns quotes for all 10 tracked symbols.
 */
export async function GET() {
  try {
    const quotes = await getQuotes();
    return NextResponse.json({ quotes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
