import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TRACKED_SYMBOLS } from "@/constants/stocks";
import { evaluateWatchlistAchievements } from "@/lib/services/achievements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({ symbol: z.string().min(1).max(8) });
const DeleteSchema = z.object({ symbol: z.string().min(1).max(8) });

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ watchlist: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = PostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const symbol = parsed.data.symbol.toUpperCase();
  if (!TRACKED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: "Symbol not tracked" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlists")
    .insert({ user_id: user.id, symbol })
    .select()
    .maybeSingle();

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const newlyUnlocked = await evaluateWatchlistAchievements(supabase, user.id);
  return NextResponse.json({ ok: true, newlyUnlocked });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const querySymbol = url.searchParams.get("symbol");
  const body = querySymbol ? { symbol: querySymbol } : await req.json().catch(() => ({}));
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const symbol = parsed.data.symbol.toUpperCase();
  await supabase.from("watchlists").delete().eq("user_id", user.id).eq("symbol", symbol);
  return NextResponse.json({ ok: true });
}
