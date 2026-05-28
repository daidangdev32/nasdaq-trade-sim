"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Repeat,
  Eye,
  Trophy,
  Award,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/dashboard/portfolio",    label: "Portfolio",    icon: Briefcase },
  { href: "/dashboard/trade",        label: "Trade",        icon: Repeat },
  { href: "/dashboard/watchlist",    label: "Watchlist",    icon: Eye },
  { href: "/dashboard/leaderboard",  label: "Leaderboard",  icon: Trophy },
  { href: "/dashboard/achievements", label: "Achievements", icon: Award },
  { href: "/dashboard/what-if",      label: "What-If",      icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r border-border-subtle bg-bg-subtle/40 flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-bold">N</div>
        <span className="font-semibold text-sm">NASDAQ Sim</span>
      </Link>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-bg-hover text-text"
                  : "text-text-muted hover:bg-bg-hover/60 hover:text-text",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post" className="p-3 border-t border-border-subtle">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-bg-hover hover:text-text"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
