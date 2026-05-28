# NASDAQ Trader Simulator — Complete Setup Guide

A full-stack paper-trading simulator. Practice investing with **$100,000 of virtual cash** against real NASDAQ tech market data. Includes a TradingView-style candlestick chart, watchlist, leaderboard, achievements, AI insights, and a daily auto-refresh job.

**Built with:** Next.js 14 · TypeScript · Tailwind · Supabase · Finnhub · Anthropic Claude · Vercel

---

## Table of contents

1. [What you'll need before you start](#1-what-youll-need-before-you-start)
2. [Step 1 — Install Node.js](#step-1--install-nodejs)
3. [Step 2 — Open the project in your terminal](#step-2--open-the-project-in-your-terminal)
4. [Step 3 — Install dependencies](#step-3--install-dependencies)
5. [Step 4 — Create a Supabase project](#step-4--create-a-supabase-project)
6. [Step 5 — Get a Finnhub API key](#step-5--get-a-finnhub-api-key)
7. [Step 6 — (Optional) Get an Anthropic API key](#step-6--optional-get-an-anthropic-api-key)
8. [Step 7 — Configure environment variables](#step-7--configure-environment-variables)
9. [Step 8 — Run the app](#step-8--run-the-app)
10. [Step 9 — Test the daily refresh cron job](#step-9--test-the-daily-refresh-cron-job)
11. [Step 10 — Deploy to Vercel](#step-10--deploy-to-vercel)
12. [How the app works](#how-the-app-works)
13. [Folder structure](#folder-structure)
14. [API reference](#api-reference)
15. [Troubleshooting](#troubleshooting)
16. [Bonus features and what's next](#bonus-features-and-whats-next)

---

## 1. What you'll need before you start

Three accounts (all free), plus Node.js on your computer:

| Thing | Why | Cost |
|---|---|---|
| **Node.js** (v18 or v20) | Runs the app on your computer | Free |
| **Supabase account** | Stores your users, trades, portfolio | Free tier is plenty |
| **Finnhub account** | Real stock prices and news | Free tier: 60 calls/min |
| **Anthropic account** *(optional)* | AI-generated market commentary | ~$5 of credit lasts thousands of insights |
| **Vercel account** *(only for deploy)* | Hosts the live site | Free tier is plenty |

You'll also need to be comfortable opening **Terminal** (on Mac) or **PowerShell** (on Windows) and pasting commands. Don't worry — every command you need is in this guide.

---

## Step 1 — Install Node.js

`npm` is the tool that downloads the building blocks the app uses. It comes bundled with Node.js.

### On macOS

1. Go to <https://nodejs.org/en/download>
2. Click **macOS Installer (.pkg)** — pick the LTS version (the green button)
3. Open the downloaded file and click **Continue → Continue → Install**. It will ask for your password.
4. **Close every Terminal window** and open a new one (important — the old window won't see the new install)
5. Type this and press Enter to check it worked:
   ```bash
   node --version
   npm --version
   ```
   You should see something like `v20.18.0` and `10.8.2`. If you see "command not found", restart your computer and try again.

### On Windows

1. Go to <https://nodejs.org/en/download>
2. Click **Windows Installer (.msi)** LTS
3. Run the installer — keep all defaults
4. Open **PowerShell** (search "PowerShell" in the Start menu)
5. Check it worked:
   ```powershell
   node --version
   npm --version
   ```

### On Linux

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Step 2 — Open the project in your terminal

The project lives at:

```
/Users/daitoan1234/Claude/Projects/App for testing market/nasdaq-trader-simulator
```

Open Terminal and run:

```bash
cd "/Users/daitoan1234/Claude/Projects/App for testing market/nasdaq-trader-simulator"
```

> 💡 The quotes are important because the path contains spaces.

To check you're in the right place, run `ls` — you should see `package.json`, `src`, `supabase`, `README.md`, etc.

---

## Step 3 — Install dependencies

Still in the terminal, run:

```bash
npm install
```

This downloads ~400 MB of building blocks (React, Next.js, the charting library, the Supabase SDK, etc.) into a folder called `node_modules`. It takes 1–3 minutes the first time.

You may see a few yellow warnings about deprecated sub-packages — those are normal and safe to ignore. The only thing you don't want is a red **ERR!** message.

When it's done, run:

```bash
npm run typecheck
```

This validates that all the TypeScript code compiles cleanly. It should print nothing and exit successfully. If you see errors, jump to [Troubleshooting](#troubleshooting).

---

## Step 4 — Create a Supabase project

Supabase is the database that will store your users, portfolios, trades, and watchlists.

### 4a. Sign up

1. Go to <https://supabase.com> and click **Start your project**
2. Sign in with GitHub or email
3. Click **New project**
4. Fill in:
   - **Name:** anything, e.g. `nasdaq-sim`
   - **Database password:** generate a strong one and **save it somewhere** (you won't need it for this app, but Supabase wants you to keep it)
   - **Region:** pick the one closest to you
   - **Pricing plan:** Free
5. Click **Create new project** and wait ~2 minutes for it to spin up

### 4b. Run the database schema

Once the project is ready:

1. In the left sidebar, click the **SQL Editor** icon (looks like `</>` or a database)
2. Click **+ New query**
3. Open the file `supabase/schema.sql` from this project in any text editor (TextEdit, VSCode, Notepad)
4. Copy the **entire contents** and paste them into the Supabase SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see a green **"Success. No rows returned"** message at the bottom

This creates all the tables (users, portfolios, holdings, transactions, stock_prices, watchlists, achievements, etc.), sets up Row-Level Security, and seeds 12 achievements.

### 4c. Copy your Supabase credentials

You'll paste these into the app in Step 7.

1. In the Supabase sidebar, click the **gear icon** (Project Settings) → **API**
2. You need three things from this page — copy each to a notepad:

   | Label in Supabase | Variable name you'll set later |
   |---|---|
   | **Project URL** (e.g. `https://abcde.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon public** key (long `eyJhbGc…` string) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role** key (different long `eyJhbGc…` string — click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY` |

   > ⚠️ The **service_role** key is a master key that bypasses security. **Never** paste it into the browser, public code, or chat. It only goes in `.env.local`, which is gitignored.

### 4d. Disable email confirmation for local dev (optional but recommended)

To skip the "click the link in your email" step during testing:

1. Supabase sidebar → **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** OFF
3. Click **Save**

You can turn this back on for production later.

---

## Step 5 — Get a Finnhub API key

Finnhub provides the live stock prices, candles, and news.

1. Go to <https://finnhub.io> and click **Get free API key**
2. Sign up with email
3. After confirming your email, log in. Your dashboard shows your API key right at the top (a long string of letters and numbers).
4. Copy it — you'll paste it as `FINNHUB_API_KEY` in Step 7.

**Free tier limits:** 60 API calls per minute. The app caches aggressively (30 seconds for quotes, 5 minutes for candles, 10 minutes for news) so you won't hit this in normal use.

---

## Step 6 — (Optional) Get an Anthropic API key

This powers the **AI Insight** card on each stock page. If you skip this step, the app falls back to a placeholder message — everything else still works.

1. Go to <https://console.anthropic.com>
2. Sign up with email
3. In the left sidebar, click **API Keys** → **Create Key**
4. Name it something like "nasdaq sim" and click **Create Key**
5. **Copy the key immediately** — Anthropic only shows it once. It starts with `sk-ant-`.
6. Add at least $5 of credit at **Settings → Billing** so the API works.

You'll paste this as `ANTHROPIC_API_KEY` in Step 7.

---

## Step 7 — Configure environment variables

Environment variables are how the app reads secret keys without putting them in the code.

### 7a. Create your `.env.local` file

In your terminal (still inside the project folder), run:

```bash
cp .env.local.example .env.local
```

This makes a copy of the template. The new file is called `.env.local` and is automatically gitignored.

### 7b. Open and fill it in

Open `.env.local` in any text editor. You'll see something like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xspttvvxycodvvjxvgfu.supabase.co/rest/v1/
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcHR0dnZ4eWNvZHZ2anh2Z2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjUzMDcsImV4cCI6MjA5NTUwMTMwN30.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcHR0dnZ4eWNvZHZ2anh2Z2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyNTMwNywiZXhwIjoyMDk1NTAxMzA3fQ.xi8vQhxlc-9wpa6GMsrakXmNr-VS61TFtDxlaqio9z8
FINNHUB_API_KEY=d8bpkphr01qkc5gcume0d8bpkphr01qkc5gcumeg
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=replace_with_a_long_random_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace each value with what you copied:

- `NEXT_PUBLIC_SUPABASE_URL` → your Supabase **Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase **anon public** key
- `SUPABASE_SERVICE_ROLE_KEY` → your Supabase **service_role** key
- `FINNHUB_API_KEY` → your Finnhub key
- `ANTHROPIC_API_KEY` → your Anthropic key (leave blank if you skipped Step 6)
- `CRON_SECRET` → any long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Paste the output as the value.
- `NEXT_PUBLIC_APP_URL` → leave as `http://localhost:3000` for now

Save the file.

> ⚠️ Make sure there are **no spaces around the `=` sign** and **no quotes** around the values.

**Bad:** `FINNHUB_API_KEY = "abc123"`
**Good:** `FINNHUB_API_KEY=abc123`

---

## Step 8 — Run the app

In your terminal, run:

```bash
npm run dev
```

You should see something like:

```
   ▲ Next.js 14.2.13
   - Local:        http://localhost:3000

 ✓ Ready in 2.3s
```

Now open <http://localhost:3000> in your browser. You should see the landing page.

### First-time tour

1. Click **Sign up free** and create an account
2. You'll be redirected to the dashboard — your portfolio shows $100,000 cash
3. Click **Trade** in the sidebar — you should see all 10 NASDAQ stocks with live prices
4. Click any stock → you'll see a candlestick chart, news feed, AI insight, and a Buy/Sell panel
5. Buy a couple of shares — your portfolio updates, your cash decreases, and a transaction appears
6. Check **Achievements** — you just unlocked "First Trade" 🎉

### Stopping the app

In the terminal, press **Ctrl + C**. To start it again later, just run `npm run dev` from the project folder.

---

## Step 9 — Test the daily refresh cron job

The cron job is the background task that refreshes stock prices once a day. In production, Vercel runs it automatically — but you can test it locally first.

**Open a second terminal window** (keep `npm run dev` running in the first) and run:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/refresh-stocks
```

Replace `YOUR_CRON_SECRET` with the value you put in `.env.local`.

You should get a JSON response like:

```json
{
  "ok": true,
  "startedAt": "...",
  "finishedAt": "...",
  "pricesUpdated": 10,
  "historyAppended": 10,
  "snapshotsWritten": 1,
  "errors": []
}
```

What just happened:
1. The job fetched fresh quotes for all 10 stocks from Finnhub
2. Upserted them into the `stock_prices` table
3. Appended a row to `stock_history` (one per symbol per day)
4. Wrote a snapshot of each user's total portfolio value to `portfolio_snapshots`

You can verify by going to Supabase → **Table Editor** → `stock_prices` and seeing the 10 rows.

---

## Step 10 — Deploy to Vercel

Vercel hosts the live site for free and automatically runs the cron job for you.

### 10a. Push the code to GitHub

If you don't already have a GitHub account, sign up at <https://github.com>.

In your terminal:

```bash
# Initialise git in the project folder
git init
git add .
git commit -m "Initial commit"

# Create a new private repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/nasdaq-trader-sim.git
git branch -M main
git push -u origin main
```

> 💡 If you're unfamiliar with git, follow GitHub's "Create a new repository" wizard — it gives you the exact commands.

### 10b. Connect to Vercel

1. Go to <https://vercel.com> and sign in with GitHub
2. Click **Add New → Project**
3. Find your `nasdaq-trader-sim` repo and click **Import**
4. **Important:** before clicking Deploy, expand the **Environment Variables** section
5. Add every variable from your `.env.local` file. For each one:
   - Name: e.g. `NEXT_PUBLIC_SUPABASE_URL`
   - Value: paste the value from `.env.local`
   - Make sure all three environments (Production, Preview, Development) are checked
6. Click **Deploy**

After ~2 minutes you'll get a URL like `https://nasdaq-trader-sim.vercel.app`.

### 10c. Update the auth redirect URL

Supabase needs to know where to send users after they confirm their email:

1. Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://nasdaq-trader-sim.vercel.app`)
3. Click **Save**

Also update `NEXT_PUBLIC_APP_URL` in Vercel's env variables to your production URL.

### 10d. Verify the cron job is scheduled

1. In Vercel, go to your project → **Settings** → **Cron Jobs**
2. You should see one entry: `/api/cron/refresh-stocks` running on `30 13 * * 1-5`
3. Click **Run** next to it to trigger it once manually — this seeds the `stock_prices` table for the first time

That's it — the site is live and the cron will fire automatically every weekday at **13:30 UTC** (which is **9:30 AM New York time**, aka US market open).

---

## How the app works

### The trading engine

Every buy or sell goes through `src/lib/services/trading.ts`, which:

- Validates the request with Zod (no negative quantities, only tracked symbols)
- Refuses buys if you don't have enough cash (`INSUFFICIENT_CASH` error)
- Refuses sells of shares you don't own (`INSUFFICIENT_SHARES` error)
- Recomputes your **volume-weighted average cost** on every buy
- Records **realized P&L** = `(sell_price - avg_cost) × quantity` on every sell
- Writes to three tables: `transactions` (the ledger), `holdings` (your positions), `portfolios` (cash)
- Re-evaluates all achievements after each trade

The database also has a `CHECK (cash_balance >= 0)` constraint as a final safety net.

### How the cron schedule works

The file `vercel.json` registers one cron:

```json
{
  "crons": [
    { "path": "/api/cron/refresh-stocks", "schedule": "30 13 * * 1-5" }
  ]
}
```

This is **standard Unix cron syntax**:

| Field | Value | Meaning |
|---|---|---|
| minute | `30` | At minute 30 |
| hour | `13` | Hour 13 (UTC) |
| day of month | `*` | Any day |
| month | `*` | Any month |
| day of week | `1-5` | Monday through Friday |

So: **13:30 UTC, every weekday**. That's 9:30 AM US Eastern in winter (US market open) and 9:30 AM UK / 10:30 NY in summer. You can change it — see <https://crontab.guru> for an interactive cron builder.

Vercel automatically picks this up. It sends an HTTP GET to your `/api/cron/refresh-stocks` route with an `Authorization: Bearer <CRON_SECRET>` header. The route checks that header and refuses anything else, so nobody else can trigger it.

### Mock data fallback

The Finnhub client (`src/lib/services/finnhub.ts`) gracefully falls back to **deterministic mock data** if:

- No API key is configured
- The API returns an error
- You hit the rate limit

This means the app works even before you've set up Finnhub. Mock quotes are flagged with `isMock: true` and the UI shows a "Mock data" pill so you can tell.

### Market hours

The market-status badge in the top bar reads `src/lib/market.ts`, which correctly handles America/New_York time (so it works no matter what time zone you're in). The simulator allows trades 24/7 by default — see the `ENFORCE_MARKET_HOURS` flag in `src/lib/services/trading.ts` if you want to restrict it.

---

## Folder structure

```
nasdaq-trader-simulator/
├── README.md                       ← this file
├── package.json                    ← npm dependencies
├── tsconfig.json                   ← TypeScript config
├── next.config.js                  ← Next.js config
├── tailwind.config.ts              ← styling theme
├── vercel.json                     ← cron schedule
├── .env.local.example              ← template for your secrets
├── supabase/
│   └── schema.sql                  ← run once in Supabase
└── src/
    ├── middleware.ts               ← session refresh + auth gating
    ├── app/
    │   ├── layout.tsx              ← global shell
    │   ├── page.tsx                ← landing page
    │   ├── auth/                   ← login / signup / callback
    │   ├── dashboard/              ← protected pages
    │   │   ├── page.tsx                  Overview
    │   │   ├── portfolio/page.tsx        Holdings + stats
    │   │   ├── trade/page.tsx            Market list
    │   │   ├── stock/[symbol]/page.tsx   Candle chart + trade + news + AI
    │   │   ├── watchlist/page.tsx        Starred stocks
    │   │   ├── leaderboard/page.tsx      Public ranking
    │   │   ├── achievements/page.tsx     Unlocks + progress
    │   │   └── what-if/page.tsx          Historical "what if I'd bought…"
    │   └── api/
    │       ├── stocks/                   Live quotes, candles, news
    │       ├── trade/                    POST a buy/sell
    │       ├── portfolio/                Summary + stats
    │       ├── watchlist/                CRUD watchlist
    │       ├── leaderboard/              Aggregated ranking
    │       ├── achievements/             User progress
    │       ├── insights/[symbol]/        Claude-generated commentary
    │       └── cron/refresh-stocks/      Scheduled job
    ├── components/
    │   ├── ui/                     Card, Stat, Pill primitives
    │   ├── dashboard/              Sidebar, Header, TradeForm, etc.
    │   └── charts/                 CandleChart, AllocationPie, etc.
    ├── lib/
    │   ├── supabase/               Three Supabase clients (browser/server/service)
    │   ├── services/               Business logic
    │   │   ├── finnhub.ts                Quotes / candles / news + mock fallback
    │   │   ├── trading.ts                Buy / sell engine
    │   │   ├── portfolio.ts              Summary, risk score, win rate
    │   │   ├── achievements.ts           Evaluator (called after every trade)
    │   │   └── anthropic.ts              AI insight generator
    │   ├── market.ts               Market-open/close logic (NYC time)
    │   └── utils.ts                Formatters (USD, %, compact)
    ├── constants/
    │   └── stocks.ts               The 10 tracked symbols
    └── types/
        ├── database.ts             Row types matching the schema
        └── stocks.ts               Quote, Candle, NewsItem, TradeResult
```

---

## API reference

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/stocks` | none | All 10 quotes |
| GET | `/api/stocks/[symbol]` | none | One quote |
| GET | `/api/stocks/[symbol]/candles?resolution=D&range=180` | none | OHLCV array |
| GET | `/api/stocks/[symbol]/news` | none | Recent company news |
| GET | `/api/insights/[symbol]` | none | Claude-generated commentary |
| POST | `/api/trade` | user | Body: `{ symbol, side: "buy"\|"sell", quantity }` |
| GET | `/api/portfolio` | user | Holdings + totals + stats |
| GET/POST/DELETE | `/api/watchlist` | user | CRUD watchlist |
| GET | `/api/leaderboard` | public | All users ranked by total return |
| GET | `/api/achievements` | user | Master list + which are unlocked |
| GET | `/api/cron/refresh-stocks` | bearer token | Scheduled refresh |

### Example: place a trade from the command line

(You need to be logged in via the browser first, then copy your auth cookie from DevTools.)

```bash
curl -X POST http://localhost:3000/api/trade \
  -H "Cookie: <copy from browser DevTools>" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"NVDA","side":"buy","quantity":2}'
```

Response:

```json
{
  "ok": true,
  "executedPrice": 138.42,
  "total": 276.84,
  "realizedPnl": null,
  "newCashBalance": 99723.16,
  "newQuantity": 2,
  "newlyUnlocked": ["first_trade"]
}
```

---

## Troubleshooting

### `npm: command not found`

You didn't install Node.js, or you didn't open a fresh terminal after installing. Go back to [Step 1](#step-1--install-nodejs).

### `npm install` shows red ERR! messages

Try clearing the cache and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### `Error: Invalid API key` from Supabase

Double-check `.env.local`:
- No spaces around `=`
- No quotes around values
- You copied the **anon** key (not the **service_role** key) into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- You copied the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`
- After editing `.env.local`, stop the dev server (Ctrl+C) and restart with `npm run dev`

### "Email not confirmed" error on login

Either:
- Go check your inbox and click the confirmation link, OR
- In Supabase → Authentication → Providers → Email → toggle off "Confirm email"

### Stocks show "Mock data" badge

This means Finnhub isn't reachable. Check:
- `FINNHUB_API_KEY` is set correctly in `.env.local`
- You didn't accidentally exceed 60 calls/minute (wait a minute and refresh)
- The dev server was restarted after editing `.env.local`

### The candlestick chart is empty

The `lightweight-charts` library needs the page to be fully loaded. If you see an empty box:
- Refresh the page (Cmd/Ctrl + Shift + R for a hard refresh)
- Check the browser console (F12 → Console) for any red errors

### "Unauthorized" when calling the cron route

The `CRON_SECRET` in your request header doesn't match the one in `.env.local`. Make sure:
- You're using the exact same string
- The header format is `Authorization: Bearer YOUR_SECRET` (note the word "Bearer" and the space)

### TypeScript errors when running `npm run typecheck`

Most likely a dependency version drift. Try:

```bash
rm -rf node_modules package-lock.json
npm install
npm run typecheck
```

### Cron job not running on Vercel

- Check the Vercel dashboard → your project → **Cron Jobs** tab. The job should be listed.
- Cron jobs only run on the **production** deployment — preview deployments don't trigger them.
- Free Vercel accounts are limited to **2 cron jobs per project** and they run at most **once a day**. This app uses exactly 1, so you're fine.
- Check **Logs** under the cron job to see what happened.

---

## Bonus features and what's next

### Already included
- ✅ **AI insights** — Claude analyzes each stock's recent action
- ✅ **News feed** — Recent headlines per company

### Easy additions
The codebase is structured so these are short additions:

- **Candlestick playback mode** — `CandleChart.tsx` already takes an arbitrary array of candles. Add a slider that slices `candles[0:n]` and re-renders.
- **Multiplayer competitions** — Add a `groups` table (`group_id`, `user_id`) and filter the leaderboard query to a specific group.
- **Daily investing quiz** — Add a `quizzes` table + a client component. The Claude helper in `lib/services/anthropic.ts` can generate questions.
- **Morning email summary** — Add a new cron route `/api/cron/morning-email` and use Resend (<https://resend.com>) to send each user their portfolio P&L.

### Customising the tracked stocks

Open `src/constants/stocks.ts` and edit the `TRACKED_STOCKS` array. Add or remove symbols. The whole app picks up the change — the trade list, the cron job, the leaderboard, everything.

### Switching to a different price provider

The price logic is isolated in `src/lib/services/finnhub.ts`. Swap out the three exported functions (`getQuote`, `getCandles`, `getCompanyNews`) with calls to Polygon, Alpha Vantage, Yahoo Finance, or any other provider — nothing else changes.

---

## License

MIT — do what you want with it. Not financial advice.
