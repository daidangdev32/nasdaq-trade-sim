"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function WatchlistButton({ symbol, initiallyOn }: { symbol: string; initiallyOn: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initiallyOn);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (on) {
        await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        });
      }
      setOn(!on);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border",
        on
          ? "bg-accent/10 border-accent/40 text-accent"
          : "bg-bg-subtle border-border text-text-muted hover:text-text",
      )}
    >
      {on ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
      {on ? "On watchlist" : "Watch"}
    </button>
  );
}
