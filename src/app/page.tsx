import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Trophy, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-subtle">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center font-bold">N</div>
            <span className="font-semibold tracking-tight">NASDAQ Trader Simulator</span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/auth/login" className="px-3 py-1.5 rounded-md text-text-muted hover:text-text">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="px-3 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card border border-border text-xs text-text-muted mb-6">
            <Zap className="w-3 h-3 text-accent" />
            Real market data · Paper money · Zero risk
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Practice trading the
            <br />
            <span className="bg-gradient-to-r from-accent to-bull bg-clip-text text-transparent">
              biggest NASDAQ names
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-text-muted text-lg">
            Start with <span className="text-text font-medium">$100,000 virtual cash</span>, build
            a portfolio of Apple, NVIDIA, Tesla and 7 more tech leaders, and track your performance
            against the rest of the leaderboard — all powered by live Finnhub data.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bg-card border border-border hover:bg-bg-hover text-text"
            >
              I have an account
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
          <FeatureCard icon={<BarChart3 className="w-5 h-5" />} title="Live charts" body="TradingView-style candle charts powered by lightweight-charts." />
          <FeatureCard icon={<ShieldCheck className="w-5 h-5" />} title="Realistic rules" body="No negative cash. Sell only what you own. Real prev-close P&L." />
          <FeatureCard icon={<Trophy className="w-5 h-5" />} title="Achievements" body="Unlock 12 badges as you hit trading milestones." />
          <FeatureCard icon={<Zap className="w-5 h-5" />} title="AI insights" body="Plug in an Anthropic key for daily market commentary on every ticker." />
        </section>
      </main>

      <footer className="border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-text-subtle flex items-center justify-between">
          <span>Paper-trading simulator — not financial advice.</span>
          <span>Built with Next.js + Supabase + Finnhub</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="w-9 h-9 rounded-lg bg-bg-hover grid place-items-center text-accent mb-3">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-text-muted mt-1">{body}</p>
    </div>
  );
}
