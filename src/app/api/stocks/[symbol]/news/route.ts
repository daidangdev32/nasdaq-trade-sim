import { NextResponse } from "next/server";
import { getCompanyNews } from "@/lib/services/finnhub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { symbol: string } }) {
  try {
    const news = await getCompanyNews(params.symbol);
    return NextResponse.json({ news });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
