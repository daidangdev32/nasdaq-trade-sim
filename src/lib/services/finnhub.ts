/**
 * Finnhub API client.
 *
 * Docs: https://finnhub.io/docs/api
 * Free tier: 60 calls / minute. We deliberately serialise + cache so we don't
 * burn the quota.
 *
 * Every public function has a graceful fallback to deterministic mock data so
 * the app still works without an API key (handy for local dev and screenshots).
 */

import { TRACKED_STOCKS, getStockInfo, type SymbolInfo } from "@/constants/stocks";
import type { Candle, NewsItem, Quote } from "@/types/stocks";

const BASE = "https://finnhub.io/api/v1";

function apiKey(): string | null {
  return process.env.FINNHUB_API_KEY?.trim() || null;
}

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // change %
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // prev close
  t: number;  // timestamp (seconds)
}

interface FinnhubProfile {
  marketCapitalization?: number; // in millions of USD
  shareOutstanding?: number;
  name?: string;
  weburl?: string;
  logo?: string;
}

interface FinnhubCandles {
  s: "ok" | "no_data";
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
}

interface FinnhubNews {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
}

async function fetchJson<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("FINNHUB_API_KEY is not set");
  const usp = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), token: key });
  const url = `${BASE}${path}?${usp.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Finnhub ${path} failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ----- in-memory cache (per server instance) ---------------------------------
type Cached<T> = { value: T; expiresAt: number };
const cache = new Map<string, Cached<unknown>>();

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ----- quotes ----------------------------------------------------------------
export async function getQuote(symbol: string): Promise<Quote> {
  const sym = symbol.toUpperCase();
  const info = getStockInfo(sym);
  if (!info) throw new Error(`Unsupported symbol: ${symbol}`);

  const cacheKey = `quote:${sym}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) return cached;

  if (!apiKey()) return mockQuote(info);

  try {
    const [q, profile] = await Promise.all([
      fetchJson<FinnhubQuote>("/quote", { symbol: sym }),
      fetchJson<FinnhubProfile>("/stock/profile2", { symbol: sym }).catch(() => ({} as FinnhubProfile)),
    ]);
    if (!q.c) return mockQuote(info);
    const marketCap = profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : null;
    const quote: Quote = {
      symbol: sym,
      name: profile.name || info.name,
      price: q.c,
      change: q.d,
      changePct: q.dp,
      prevClose: q.pc,
      dayHigh: q.h || null,
      dayLow: q.l || null,
      marketCap,
      volume: null,
      updatedAt: new Date(q.t * 1000).toISOString(),
    };
    setCached(cacheKey, quote, 30_000);
    return quote;
  } catch (e) {
    console.warn(`[finnhub] getQuote(${sym}) failed, using mock:`, e);
    return mockQuote(info);
  }
}

export async function getQuotes(symbols: string[] = TRACKED_STOCKS.map((s) => s.symbol)): Promise<Quote[]> {
  // Serialise to be polite to the free quota.
  const out: Quote[] = [];
  for (const s of symbols) {
    out.push(await getQuote(s));
  }
  return out;
}

// ----- candles ---------------------------------------------------------------
export async function getCandles(
  symbol: string,
  resolution: "D" | "60" | "30" | "15" = "D",
  rangeDays: number = 180,
): Promise<Candle[]> {
  const sym = symbol.toUpperCase();
  const cacheKey = `candles:${sym}:${resolution}:${rangeDays}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) return cached;

  if (!apiKey()) return mockCandles(sym, rangeDays);

  const to = Math.floor(Date.now() / 1000);
  const from = to - rangeDays * 24 * 60 * 60;
  try {
    const data = await fetchJson<FinnhubCandles>("/stock/candle", { symbol: sym, resolution, from, to });
    if (data.s !== "ok" || !data.c || data.c.length === 0) return mockCandles(sym, rangeDays);
    const candles: Candle[] = data.t.map((t, i) => ({
      t,
      o: data.o[i],
      h: data.h[i],
      l: data.l[i],
      c: data.c[i],
      v: data.v[i],
    }));
    setCached(cacheKey, candles, 5 * 60_000);
    return candles;
  } catch (e) {
    console.warn(`[finnhub] getCandles(${sym}) failed, using mock:`, e);
    return mockCandles(sym, rangeDays);
  }
}

// ----- news ------------------------------------------------------------------
export async function getCompanyNews(symbol: string, days = 14): Promise<NewsItem[]> {
  const sym = symbol.toUpperCase();
  const cacheKey = `news:${sym}:${days}`;
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  if (!apiKey()) return mockNews(sym);

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const data = await fetchJson<FinnhubNews[]>("/company-news", {
      symbol: sym,
      from: iso(fromDate),
      to: iso(toDate),
    });
    const items: NewsItem[] = (data || []).slice(0, 20).map((n) => ({
      id: n.id,
      headline: n.headline,
      summary: n.summary,
      url: n.url,
      source: n.source,
      publishedAt: new Date(n.datetime * 1000).toISOString(),
    }));
    setCached(cacheKey, items, 10 * 60_000);
    return items;
  } catch (e) {
    console.warn(`[finnhub] getCompanyNews(${sym}) failed, using mock:`, e);
    return mockNews(sym);
  }
}

// ----- mock fallback ---------------------------------------------------------
// Deterministic per-symbol so the UI doesn't flicker between renders.

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function mockQuote(info: SymbolInfo): Quote {
  const r = rng(hashSeed(info.symbol));
  const base = 50 + r() * 450;
  const changePct = (r() - 0.5) * 6; // -3% .. +3%
  const price = +(base * (1 + changePct / 100)).toFixed(2);
  const prevClose = +base.toFixed(2);
  const change = +(price - prevClose).toFixed(2);
  return {
    symbol: info.symbol,
    name: info.name,
    price,
    change,
    changePct: +changePct.toFixed(2),
    prevClose,
    dayHigh: +(price * (1 + r() * 0.02)).toFixed(2),
    dayLow: +(price * (1 - r() * 0.02)).toFixed(2),
    marketCap: Math.round(price * (1e9 + r() * 2e12)),
    volume: Math.round(1e6 + r() * 1e8),
    updatedAt: new Date().toISOString(),
    isMock: true,
  };
}

function mockCandles(symbol: string, days: number): Candle[] {
  const r = rng(hashSeed(symbol));
  const out: Candle[] = [];
  let price = 50 + r() * 450;
  const now = Math.floor(Date.now() / 1000);
  for (let i = days - 1; i >= 0; i--) {
    const t = now - i * 86400;
    const drift = (r() - 0.5) * 0.04 * price; // ±2%
    const open = price;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) * (1 + r() * 0.01);
    const low = Math.min(open, close) * (1 - r() * 0.01);
    const v = Math.round(1e6 + r() * 5e7);
    out.push({ t, o: +open.toFixed(2), h: +high.toFixed(2), l: +low.toFixed(2), c: +close.toFixed(2), v });
    price = close;
  }
  return out;
}

function mockNews(symbol: string): NewsItem[] {
  const headlines = [
    `${symbol} hits new analyst targets amid sector rally`,
    `${symbol} CEO speaks about long-term roadmap`,
    `What's next for ${symbol} after earnings beat`,
    `${symbol} expands into new markets`,
    `Three reasons traders are watching ${symbol} this week`,
  ];
  return headlines.map((headline, i) => ({
    id: `mock-${symbol}-${i}`,
    headline,
    summary: "Sample news content shown while no Finnhub API key is configured.",
    url: "https://finnhub.io",
    source: "Mock Feed",
    publishedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
}
