import type { Trade, UserId } from "../../domain/entities";
import type { TradeRepository } from "../../application/ports";
import { type KeyValueStore, STORAGE_KEYS } from "./storage";

const MAX_TRADES = 200;

export class LocalStorageTradeRepository implements TradeRepository {
  constructor(private readonly store: KeyValueStore) {}

  list(userId: UserId): Trade[] {
    return this.store.read<Trade[]>(STORAGE_KEYS.trades(userId)) ?? [];
  }

  append(trade: Trade): void {
    const next = [trade, ...this.list(trade.userId)].slice(0, MAX_TRADES);
    this.store.write(STORAGE_KEYS.trades(trade.userId), next);
  }
}
