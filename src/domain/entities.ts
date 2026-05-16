export type UserId = string;

export interface User {
  readonly id: UserId;
  readonly nickname: string;
  readonly createdAt: number;
}

export interface Wallet {
  readonly userId: UserId;
  readonly cash: number;
  readonly coins: number;
  readonly avgEntryPrice: number;
}

export interface OpenOrders {
  readonly userId: UserId;
  readonly stopLoss: number | null;
  readonly takeProfit: number | null;
}

export type TradeSide = "BUY" | "SELL";

export type TradeReason = "MANUAL" | "STOP_LOSS" | "TAKE_PROFIT";

export interface Trade {
  readonly id: string;
  readonly userId: UserId;
  readonly side: TradeSide;
  readonly reason: TradeReason;
  readonly price: number;
  readonly coins: number;
  readonly cashDelta: number;
  readonly timestamp: number;
}

export const STARTING_CASH = 10_000;

export function createUser(id: UserId, nickname: string, now: number): User {
  return { id, nickname: nickname.trim(), createdAt: now };
}

export function emptyWallet(userId: UserId): Wallet {
  return { userId, cash: STARTING_CASH, coins: 0, avgEntryPrice: 0 };
}

export function emptyOrders(userId: UserId): OpenOrders {
  return { userId, stopLoss: null, takeProfit: null };
}
