export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  dayHigh: number | null;
  dayLow: number | null;
  marketCap: number | null;
  volume: number | null;
  updatedAt: string;
  /** True when the data came from the mock fallback (API down or quota hit). */
  isMock?: boolean;
}

export interface Candle {
  /** Unix seconds. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface NewsItem {
  id: string | number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

export type TradeSide = "buy" | "sell";

export interface TradeRequest {
  symbol: string;
  side: TradeSide;
  quantity: number;
}

export interface TradeResult {
  ok: true;
  executedPrice: number;
  total: number;
  realizedPnl: number | null;
  newCashBalance: number;
  newQuantity: number;
  newlyUnlocked: string[];
}
