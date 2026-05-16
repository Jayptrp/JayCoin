import { beforeEach, describe, expect, it } from "vitest";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  TradeRepository,
  WalletRepository,
} from "../ports";
import type { OpenOrders, Trade, Wallet } from "../../domain/entities";
import { emptyOrders, emptyWallet } from "../../domain/entities";
import { SellJayCoin } from "./sell";
import { EvaluateOrders } from "./evaluateOrders";

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

const fixedClock: Clock = { now: () => 1_000 };
const sequentialIds: IdGenerator = (() => {
  let counter = 0;
  return { next: () => `id-${++counter}` };
})();

describe("EvaluateOrders", () => {
  let wallets: InMemoryWallets;
  let orders: InMemoryOrders;
  let trades: InMemoryTrades;
  let evaluator: EvaluateOrders;

  beforeEach(() => {
    wallets = new InMemoryWallets();
    orders = new InMemoryOrders();
    trades = new InMemoryTrades();
    const sell = new SellJayCoin({
      wallets,
      orders,
      trades,
      clock: fixedClock,
      ids: sequentialIds,
    });
    evaluator = new EvaluateOrders({ wallets, orders, sell });
  });

  it("returns null when user has no coins", () => {
    expect(evaluator.execute({ userId: "u1", price: 100 })).toBeNull();
  });

  it("triggers take-profit when price >= TP", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({ userId: "u1", stopLoss: 40, takeProfit: 80 });
    const trade = evaluator.execute({ userId: "u1", price: 85 });
    expect(trade?.reason).toBe("TAKE_PROFIT");
    expect(wallets.get("u1").coins).toBe(0);
    expect(wallets.get("u1").cash).toBe(425);
  });

  it("triggers stop-loss when price <= SL", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({ userId: "u1", stopLoss: 40, takeProfit: 80 });
    const trade = evaluator.execute({ userId: "u1", price: 35 });
    expect(trade?.reason).toBe("STOP_LOSS");
    expect(wallets.get("u1").coins).toBe(0);
  });

  it("does nothing when price is inside the SL/TP band", () => {
    wallets.save({ userId: "u1", cash: 0, coins: 5, avgEntryPrice: 50 });
    orders.save({ userId: "u1", stopLoss: 40, takeProfit: 80 });
    expect(evaluator.execute({ userId: "u1", price: 60 })).toBeNull();
    expect(wallets.get("u1").coins).toBe(5);
  });
});
