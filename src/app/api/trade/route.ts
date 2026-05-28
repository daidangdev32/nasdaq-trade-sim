import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeTrade, TradeError, TradeRequestSchema } from "@/lib/services/trading";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/trade
 * Body: { symbol, side: "buy" | "sell", quantity }
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TradeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trade request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await executeTrade(supabase, user.id, parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof TradeError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
