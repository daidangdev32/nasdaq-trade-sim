"use client";

import { useEffect, useState } from "react";
import { marketStatus, marketStatusLabel } from "@/lib/market";
import { cn } from "@/lib/utils";

export function MarketStatusBadge() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const status = marketStatus(now);
  const isOpen = status === "open";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-text-muted">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isOpen ? "bg-bull animate-pulse-soft" : "bg-text-subtle",
        )}
      />
      {marketStatusLabel(status)}
    </span>
  );
}
