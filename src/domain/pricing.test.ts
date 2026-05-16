import { describe, expect, it } from "vitest";
import { emptyWallet } from "./entities";
import {
  applyBuy,
  applySell,
  portfolioValue,
  unrealizedPnL,
} from "./pricing";

describe("pricing", () => {
  it("applyBuy updates cash, coins, and avg entry price", () => {
    const wallet = applyBuy(emptyWallet("u1"), 10, 50);
    expect(wallet.cash).toBe(9_500);
    expect(wallet.coins).toBe(10);
    expect(wallet.avgEntryPrice).toBe(50);
  });

  it("applyBuy averages entry price across multiple buys", () => {
    const first = applyBuy(emptyWallet("u1"), 10, 50);
    const second = applyBuy(first, 10, 70);
    expect(second.coins).toBe(20);
    expect(second.avgEntryPrice).toBe(60);
  });

  it("applySell reduces coins and adds cash; resets avg when flat", () => {
    const bought = applyBuy(emptyWallet("u1"), 10, 50);
    const sold = applySell(bought, 10, 80);
    expect(sold.coins).toBe(0);
    expect(sold.cash).toBe(10_300);
    expect(sold.avgEntryPrice).toBe(0);
  });

  it("unrealizedPnL is zero when no coins are held", () => {
    expect(unrealizedPnL(emptyWallet("u1"), 100)).toBe(0);
  });

  it("portfolioValue sums cash and coin value at current price", () => {
    const wallet = applyBuy(emptyWallet("u1"), 5, 40);
    expect(portfolioValue(wallet, 60)).toBe(9_800 + 300);
  });
});
