/**
 * Anthropic helper for the "AI market insights" feature.
 *
 * The Anthropic key is optional — if it isn't configured we return a static
 * placeholder so the UI still renders.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Candle, Quote } from "@/types/stocks";

const MODEL = "claude-haiku-4-5-20251001";

export interface MarketInsight {
  summary: string;
  outlook: "bullish" | "bearish" | "neutral";
  risks: string[];
  isMock?: boolean;
}

function hasKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function generateInsight(quote: Quote, candles: Candle[]): Promise<MarketInsight> {
  if (!hasKey()) return mockInsight(quote);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const recent = candles.slice(-30).map((c) => ({
    date: new Date(c.t * 1000).toISOString().slice(0, 10),
    close: c.c,
  }));

  const prompt = `You are a calm, educational market analyst writing for a paper-trading simulator.
This is NOT investment advice — students are practicing.

Stock: ${quote.name} (${quote.symbol})
Current price: $${quote.price.toFixed(2)}
Day change: ${quote.changePct.toFixed(2)}%
Market cap: ${quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : "n/a"}

Last 30 closes (oldest → newest):
${recent.map((r) => `${r.date}: $${r.close.toFixed(2)}`).join("\n")}

Return a JSON object with this exact shape:
{
  "summary": "2-3 sentences explaining what the recent price action looks like and any obvious context (in plain English, no jargon).",
  "outlook": "bullish" | "bearish" | "neutral",
  "risks": ["short risk 1", "short risk 2", "short risk 3"]
}

Respond with ONLY the JSON object — no markdown, no preamble.`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<MarketInsight>;
    return {
      summary: parsed.summary?.toString() ?? "Insight unavailable.",
      outlook: ((parsed.outlook as MarketInsight["outlook"]) ?? "neutral"),
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5).map(String) : [],
    };
  } catch (e) {
    console.warn(`[anthropic] insight failed for ${quote.symbol}:`, e);
    return mockInsight(quote);
  }
}

function mockInsight(quote: Quote): MarketInsight {
  const direction = quote.changePct >= 0 ? "up" : "down";
  return {
    summary: `${quote.name} is currently trading ${direction} ${Math.abs(quote.changePct).toFixed(2)}% on the day. Connect an Anthropic API key in .env.local to enable real AI-generated commentary.`,
    outlook: quote.changePct >= 1 ? "bullish" : quote.changePct <= -1 ? "bearish" : "neutral",
    risks: [
      "This is a paper trading simulator — none of this is financial advice.",
      "Market conditions can change rapidly intraday.",
      "Past performance does not guarantee future returns.",
    ],
    isMock: true,
  };
}
