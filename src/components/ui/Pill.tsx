import { cn } from "@/lib/utils";

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "bull" | "bear" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium tabular-nums",
        tone === "neutral" && "bg-bg-hover text-text-muted",
        tone === "bull" && "bg-bull/10 text-bull",
        tone === "bear" && "bg-bear/10 text-bear",
        tone === "accent" && "bg-accent/15 text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
