import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] grid place-items-center text-center">
      <div>
        <h1 className="text-2xl font-semibold">Symbol not tracked</h1>
        <p className="text-text-muted mt-2">This simulator only tracks 10 NASDAQ tech stocks.</p>
        <Link href="/dashboard/trade" className="inline-block mt-4 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm">
          See the list
        </Link>
      </div>
    </div>
  );
}
