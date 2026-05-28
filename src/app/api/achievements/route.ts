import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AchievementRow, UserAchievementRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("*").eq("user_id", user.id),
  ]);

  const unlocked = new Map((mine ?? []).map((r) => [r.achievement_code, r as UserAchievementRow]));
  const rows = ((all ?? []) as AchievementRow[]).map((a) => ({
    ...a,
    unlocked: unlocked.has(a.code),
    unlockedAt: unlocked.get(a.code)?.unlocked_at ?? null,
  }));

  return NextResponse.json({ achievements: rows });
}
