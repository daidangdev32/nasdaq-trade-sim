"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Repeat,
  Eye,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard",             label: "Home",  icon: LayoutDashboard },
  { href: "/dashboard/portfolio",   label: "Folio", icon: Briefcase },
  { href: "/dashboard/trade",       label: "Trade", icon: Repeat },
  { href: "/dashboard/watchlist",   label: "Watch", icon: Eye },
  { href: "/dashboard/leaderboard", label: "Top",   icon: Trophy },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-subtle/90 backdrop-blur border-t border-border-subtle">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 text-[11px]",
                active ? "text-accent" : "text-text-muted",
              )}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
