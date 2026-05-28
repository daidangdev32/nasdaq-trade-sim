import Link from "next/link";
import { MarketStatusBadge } from "./MarketStatus";

export function Header({ email }: { email: string | null }) {
  return (
    <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 lg:px-6 bg-bg-subtle/40 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent grid place-items-center font-bold text-sm">N</div>
        </Link>
        <MarketStatusBadge />
      </div>
      <div className="text-xs text-text-muted truncate">{email}</div>
    </header>
  );
}
