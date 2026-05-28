import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-text-muted">
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    </div>
  );
}
