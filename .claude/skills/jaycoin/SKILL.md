---
name: jaycoin
description: Knowledge base for the JayCoin mobile crypto-trading simulator. Use when working on the JayCoin repo to recall architecture, conventions, ports/adapters layout, the deterministic price model, and any feature-level details the maintainer has confirmed. Update this file when you learn anything new about the codebase or the user's preferences.
---

# JayCoin

Mobile web app simulating a JayCoin (JAY) crypto market. Auto-authenticates a user on first visit, lets them buy/sell at a deterministic time-keyed price, and supports stop-loss / take-profit orders that catch up on reload.

## Tech stack
- **React 18 + TypeScript (strict)** with Vite 5.
- **Tailwind CSS** for styling. Custom palette tokens: `jay-bg`, `jay-panel`, `jay-border`, `jay-accent`, `jay-up`, `jay-down`.
- **Vitest** for unit tests.
- **GitHub Pages** deploy via `.github/workflows/deploy.yml`. Vite `base` is `/JayCoin/` to match the repo URL.

## Repository
- GitHub: `Jayptrp/JayCoin`. Local default branch is `main`.
- Live site: `https://jayptrp.github.io/JayCoin/`.

## Architecture — clean / hexagonal

Strict layering, enforced by convention:

```
src/
  domain/              Pure entities + business rules. No framework imports.
    entities.ts          User, Wallet, OpenOrders, Trade.
                         OpenOrders has lastEvaluatedAt: number | null.
    pricing.ts           applyBuy, applySell, unrealizedPnL.
    errors.ts            Typed domain errors (DomainError base class).
    timeframes.ts        TIMEFRAMES list + findTimeframe lookup.
  application/         Use cases + port interfaces.
    ports.ts             UserRepository, WalletRepository, OrderRepository,
                         TradeRepository, PriceFeed, PriceOracle,
                         Clock, IdGenerator, PricePoint.
    usecases/            AuthenticateOrCreateUser, BuyJayCoin, SellJayCoin
                         (accepts optional executedAt for historical SL/TP),
                         SetOrders, EvaluateOrders, CatchUpOrders.
  infrastructure/      Adapters that implement ports.
    storage/             LocalStorage-backed repositories.
    price/               deterministicPrice.ts — pure priceAt(ts) + sampleRange.
                         deterministicPriceFeed.ts — implements both PriceFeed
                         and PriceOracle.
    clock.ts, id.ts      SystemClock + crypto.randomUUID.
  presentation/        React UI.
    di.ts                Composition root (the ONLY place that `new`s adapters).
    AppContext.tsx       Provides the container.
    hooks/               usePriceData(timeframe), useSession, useOrderEvaluation.
    components/          AuthSplash, Header, PriceTicker, PriceChart,
                         TimeframePicker, TradeForm, PositionPanel,
                         HistoryPanel.
    format.ts            formatMoney, formatCoins, formatPrice, formatPercent.
```

**Layering rules:**
- Domain depends on nothing.
- Application depends only on domain + its own ports.
- Infrastructure implements ports; never imported by domain or use cases.
- Presentation wires real adapters in `di.ts`; no other file in `presentation/` should `new` an adapter.

## Deterministic price model
- `priceAt(t) = max(0.01, 100 * exp(VOLATILITY * (fractalNoise(secondsSinceGenesis) - anchor)))`.
- `fractalNoise` is 16 octaves of hashed value noise with 1.5× amp growth per lower-frequency octave.
- `anchor = fractalNoise(0)` so the price hits exactly $100 at genesis.
- Genesis: `2026-01-01 00:00:00 UTC` at $100.
- Pure function — same `t` returns the same price on every device, every refresh.
- Hand-checked: price stays in $67–$149 over 70 days of 1-minute samples.

## Order catch-up
- On reload, `CatchUpOrders` scans in 60-second buckets from `OpenOrders.lastEvaluatedAt` to now (max 7 days back).
- If price ever crossed SL or TP in that window, fires the trade at the historical price + timestamp.
- `SellJayCoin` accepts an optional `executedAt` so catch-up trades land at the right historical time.
- `SetOrders` and `EvaluateOrders` maintain `OpenOrders.lastEvaluatedAt` as the watermark.

## Chart
- 150 sample points per window, downsampled via `PriceOracle.sampleRange`.
- Timeframes: `1m`, `5m`, `15m`, `1h`, `1d`, `ALL`.
- SVG line chart in `PriceChart.tsx`; viewport 320×120, scales with width.
- Height: `h-32` on mobile, `lg:h-80` on desktop.

## Responsive layout
- Single column on mobile (default) inside `max-w-6xl mx-auto`.
- At `lg` (1024px+): two-column grid via `App.tsx`.
  - Left (2/3): PriceTicker, TimeframePicker, PriceChart, HistoryPanel.
  - Right (1/3, `aside`): TradeForm, PositionPanel.
  - HistoryPanel renders twice — `hidden lg:block` in the left column, `lg:hidden` for mobile flow. (Only one is visible at any breakpoint; same data.)
- Buttons should have both `hover:` (desktop) and `active:` (touch) styles. Use `hover:brightness-110` for solid accent buttons.

## Commands
- `npm install` — install deps.
- `npm run lint` — runs `tsc --noEmit` (strict TS).
- `npm test` — vitest (currently 18 tests across pricing math, EvaluateOrders, CatchUpOrders, deterministicPrice).
- `npm run build` — `tsc && vite build`. Output to `dist/`. Currently ~52 KB gzipped JS.
- `npm run dev` — Vite dev server.

## Coding conventions
- Strict TypeScript, no implicit any.
- Functional components, hooks for state.
- Prefer pure functions in domain; side-effects live in infrastructure adapters.
- Tailwind utility classes; no CSS-in-JS.
- Test files colocated with source (`foo.test.ts` next to `foo.ts`).

## Git workflow
- **Default branch:** edit directly on `main`. Jay explicitly opted in to this — no per-task feature branch.
- Commit with clear messages. Don't amend; create new commits when fixes are needed.
- Push with `git push -u origin main`; retry network failures with exponential backoff (2s, 4s, 8s, 16s).
- Do NOT open a pull request unless the user explicitly asks.
- Use the GitHub MCP tools (`mcp__github__*`) for any GitHub interaction — there is no `gh` CLI in this environment.

## Confirmed user preferences
- Wants a **Close Position** action in the position panel (not just via the trade form). The MVP added a "Close Position" button that sells the full holding at the current price.
- SL/TP should be **read-only until a pen icon is clicked**. No popup/modal; in-place edit with Save/Cancel.
- Wants **mouse-hover on the chart to show the price + time at that point** within the selected timeframe. Implemented as a vertical dashed crosshair + price/time in the header (no dot, which distorts on desktop due to stretching).
- Wants layout **responsive for desktop**: single column on mobile, two-column grid at lg+ (1024px+) with chart/ticker/history on left, trade form/position panel as sidebar on right.
- Wants this skill file kept up to date as new facts are learned.

## How to update this file
When you learn something new — a confirmed preference, a non-obvious convention, a gotcha — add it under the relevant section. Keep entries short and verified. Remove stale ones rather than leaving contradictions.
