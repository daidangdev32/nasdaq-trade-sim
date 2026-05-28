import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "bull" | "bear";
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={cn(
          "text-2xl font-semibold mt-1 tabular-nums",
          tone === "bull" && "text-bull",
          tone === "bear" && "text-bear",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-text-subtle mt-0.5">{hint}</div>}
    </div>
  );
}
