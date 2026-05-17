import { beforeEach, describe, expect, it } from "vitest";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  PriceOracle,
  PricePoint,
  TradeRepository,
  WalletRepository,
} from "../ports";
import type { OpenOrders, Trade, Wallet } from "../../domain/entities";
import { emptyOrders, emptyWallet } from "../../domain/entities";
import { SellJayCoin } from "./sell";
import { CatchUpOrders } from "./catchUpOrders";

class InMemoryWallets implements WalletRepository {
  store = new Map<string, Wallet>();
  get(userId: string): Wallet {
    return this.store.get(userId) ?? emptyWallet(userId);
  }
  save(wallet: Wallet) {
    this.store.set(wallet.userId, wallet);
  }
}

class InMemoryOrders implements OrderRepository {
  store = new Map<string, OpenOrders>();
  get(userId: string): OpenOrders {
    return this.store.get(userId) ?? emptyOrders(userId);
  }
  save(orders: OpenOrders) {
    this.store.set(orders.userId, orders);
  }
}

class InMemoryTrades implements TradeRepository {
  trades: Trade[] = [];
  list(): Trade[] {
    return this.trades;
  }
  append(trade: Trade) {
    this.trades.push(trade);
  }
}

class StubOracle implements PriceOracle {
  constructor(private readonly fn: (ts: number) => number) {}
  priceAt(ts: number): number {
    return this.fn(ts);
  }
  sampleRange(): PricePoint[] {
    return [];
  }
}

const clockAt = (now: number): Clock => ({ now: () => now });
const sequentialIds: IdGenerator = (() => {
  let counter = 0;
  return { next: () => `id-${++counter}` };
})();

describe("CatchUpOrders", () => {
  let wallets: InMemoryWallets;
  let orders: InMemoryOrders;
  let trades: InMemoryTrades;

  beforeEach(() => {
    wallets = new InMemoryWallets();
    orders = new InMemoryOrders();
    trades = new InMemoryTrades();
  });

  function build(oracle: PriceOracle, now: number) {
    const clock = clockAt(now);
    const sell = new SellJayCoin({
      wallets,
      orders,
      trades,
      clock,
      ids: sequentialIds,
    });
    return new CatchUpOrders({
      wallets,
      orders,
      oracle,
      sell,
      clock,
    });
  }

  it("returns null when there is no open position", () => {
    const useCase = build(new StubOracle(() => 50), 10_000);
    expect(useCase.execute({ userId: "u1" })).toBeNull();
  });

  it("triggers stop-loss at the historical bucket", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({
      userId: "u1",
      stopLoss: 40,
      takeProfit: 80,
      lastEvaluatedAt: 1_000,
    });
    const useCase = build(
      new StubOracle((t) => (t < 1_000 + 3 * 60_000 ? 60 : 30)),
      1_000 + 10 * 60_000,
    );
    const trade = useCase.execute({ userId: "u1" });
    expect(trade?.reason).toBe("STOP_LOSS");
    expect(trade?.timestamp).toBeLessThanOrEqual(1_000 + 10 * 60_000);
    expect(wallets.get("u1").coins).toBe(0);
  });

  it("triggers take-profit when price crossed up while away", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({
      userId: "u1",
      stopLoss: 40,
      takeProfit: 80,
      lastEvaluatedAt: 1_000,
    });
    const useCase = build(
      new StubOracle((t) => (t < 1_000 + 2 * 60_000 ? 70 : 95)),
      1_000 + 5 * 60_000,
    );
    const trade = useCase.execute({ userId: "u1" });
    expect(trade?.reason).toBe("TAKE_PROFIT");
  });

  it("advances lastEvaluatedAt when nothing triggered", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({
      userId: "u1",
      stopLoss: 40,
      takeProfit: 80,
      lastEvaluatedAt: 1_000,
    });
    const now = 1_000 + 5 * 60_000;
    const useCase = build(new StubOracle(() => 60), now);
    expect(useCase.execute({ userId: "u1" })).toBeNull();
    expect(orders.get("u1").lastEvaluatedAt).toBe(now);
  });
});
