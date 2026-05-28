import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AchievementRow, UserAchievementRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("*").order("category"),
    supabase.from("user_achievements").select("*").eq("user_id", user.id),
  ]);
  const unlocked = new Map((mine ?? []).map((r) => [(r as UserAchievementRow).achievement_code, r as UserAchievementRow]));
  const rows = (all ?? []) as AchievementRow[];

  const unlockedCount = rows.filter((r) => unlocked.has(r.code)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-sm">Your progress</p>
          <h1 className="text-2xl font-semibold mt-1">Achievements</h1>
        </div>
        <Pill tone="accent">{unlockedCount} / {rows.length} unlocked</Pill>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((a) => {
          const isUnlocked = unlocked.has(a.code);
          const iconName = a.icon
            .split("-")
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join("");
          const IconComp = (Icons as unknown as Record<string, LucideIcon>)[iconName] ?? Icons.Award;
          return (
            <Card
              key={a.code}
              className={cn(
                "transition-all",
                isUnlocked ? "border-accent/40 bg-accent/5" : "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg grid place-items-center shrink-0",
                  isUnlocked ? "bg-accent/15 text-accent" : "bg-bg-hover text-text-muted",
                )}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-text-muted mt-0.5">{a.description}</div>
                  {isUnlocked && (
                    <div className="text-xs text-bull mt-2">
                      ✓ Unlocked {new Date(unlocked.get(a.code)!.unlocked_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
