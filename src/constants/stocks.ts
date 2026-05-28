/**
 * The 10 NASDAQ tech tickers the simulator supports.
 * Add a symbol here and it flows through prices, trading, charts, and the cron job.
 */
export type SymbolInfo = {
  symbol: string;
  name: string;
  sector: string;
  color: string;
};

export const TRACKED_STOCKS: SymbolInfo[] = [
  { symbol: "AAPL",  name: "Apple Inc.",                 sector: "Consumer Electronics",  color: "#a3a3a3" },
  { symbol: "MSFT",  name: "Microsoft Corporation",      sector: "Software",              color: "#00a4ef" },
  { symbol: "NVDA",  name: "NVIDIA Corporation",         sector: "Semiconductors",        color: "#76b900" },
  { symbol: "AMZN",  name: "Amazon.com, Inc.",           sector: "E-commerce / Cloud",    color: "#ff9900" },
  { symbol: "META",  name: "Meta Platforms, Inc.",       sector: "Social Media",          color: "#1877f2" },
  { symbol: "TSLA",  name: "Tesla, Inc.",                sector: "Electric Vehicles",     color: "#e31937" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)",    sector: "Search / Cloud",        color: "#4285f4" },
  { symbol: "NFLX",  name: "Netflix, Inc.",              sector: "Streaming",             color: "#e50914" },
  { symbol: "AMD",   name: "Advanced Micro Devices",     sector: "Semiconductors",        color: "#ed1c24" },
  { symbol: "INTC",  name: "Intel Corporation",          sector: "Semiconductors",        color: "#0071c5" },
];

export const TRACKED_SYMBOLS = TRACKED_STOCKS.map((s) => s.symbol);

export function getStockInfo(symbol: string): SymbolInfo | undefined {
  return TRACKED_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
}

export const STARTING_BALANCE = 100_000;
