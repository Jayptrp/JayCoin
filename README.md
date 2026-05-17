# JayCoin

A mobile web app that simulates a simplified crypto trading market for **JayCoin (JAY)**. Users
land on the site, get auto-authenticated (created on first visit), and can buy/sell at a live
simulated price with optional stop-loss / take-profit orders.

## Stack

- **React 18 + Vite + TypeScript** — small bundle, fast dev loop.
- **Tailwind CSS** — mobile-first styling.
- **localStorage** — persistent per-device storage, no backend (free GitHub Pages hosting).
- **Geometric Brownian Motion price simulator** — runs in-browser, no external API.
- **Vitest** — unit tests for the pure domain + use cases.

## Architecture

Clean architecture, with strict inward-only dependencies:

```
src/
  domain/          Pure entities + business rules. No framework imports.
    entities.ts      User, Wallet, OpenOrders, Trade.
    pricing.ts       Pure math: applyBuy, applySell, PnL.
    errors.ts        Typed domain errors.
  application/     Use cases + port interfaces.
    ports.ts         UserRepository, WalletRepository, OrderRepository,
                     TradeRepository, PriceFeed, Clock, IdGenerator.
    usecases/        AuthenticateOrCreateUser, BuyJayCoin, SellJayCoin,
                     SetOrders, EvaluateOrders.
  infrastructure/  Adapters that implement ports.
    storage/         LocalStorage-backed repositories.
    price/           SimulatedPriceFeed (GBM, subscribable).
    clock.ts, id.ts  System clock + crypto.randomUUID.
  presentation/    React UI.
    di.ts            Composition root (the only place that wires real
                     adapters into use cases).
    AppContext.tsx   Provides the container to the React tree.
    hooks/           usePrice, useSession, useOrderEvaluation.
    components/      AuthSplash, Header, PriceTicker, PriceChart,
                     TradeForm, PositionPanel, HistoryPanel.
```

### SOLID notes

- **S** — each repository, use case, and component has one reason to change.
- **O** — adding a new price source means writing a new `PriceFeed`
  implementation; no existing code changes.
- **L** — repository implementations are interchangeable (in-memory adapters
  are used in tests).
- **I** — separate `UserRepository` / `WalletRepository` / `OrderRepository` /
  `TradeRepository` so consumers only depend on what they use.
- **D** — use cases depend on port interfaces, not on `localStorage` or React.

## Auth model

Per the brief, each visit goes through an "authenticate or create" flow:

1. On load, `useSession` reads `jaybile:currentUserId` from `localStorage`.
2. If found, the existing user is loaded.
3. If not, the splash screen asks for a nickname (optional). A matching
   nickname re-uses the existing user; otherwise a new user is created with a
   $10,000 starting balance.

Because we have no backend, "user" is device-bound. Swapping
`LocalStorageUserRepository` for a Supabase/Firebase adapter is the only
change needed to make accounts portable across devices.

## Trading model

- Cash balance in USD; trading asset is JayCoin (JAY).
- Buy: spend USD → receive `cash / price` coins; average entry price updates.
- Sell: trade `coins * price` USD; if flat, SL/TP are cleared.
- Stop-loss / take-profit are evaluated every price tick (currently 1s) while
  the tab is open. Triggering one auto-sells the entire position.

## Running

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build into dist/
```

## Deploying to GitHub Pages

**One-time setup:** Repo Settings → Pages → Source: **GitHub Actions**. This
step must be done by hand once — the workflow's default `GITHUB_TOKEN`
cannot create the Pages site itself (GitHub returns "Resource not accessible
by integration" if you try `enablement: true`).

After that, push to `main`. The workflow in `.github/workflows/deploy.yml`
runs tests, builds, and publishes `dist/` to Pages. The site URL will be
`https://<user>.github.io/JayCoin/` — `vite.config.ts` already sets
`base: "/JayCoin/"` to match.

If you rename the repo, update `base` in `vite.config.ts` accordingly.

## Scaling beyond localStorage

When you outgrow the device-bound model (multi-device login, shared
leaderboard, server-evaluated SL/TP), implement the existing ports against
Supabase/Firebase and swap them in `presentation/di.ts`. No domain or use case
code has to change.
