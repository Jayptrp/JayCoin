import type { Trade, TradeReason, UserId } from "../../domain/entities";
import {
  InsufficientCoinsError,
  InvalidAmountError,
} from "../../domain/errors";
import { applySell } from "../../domain/pricing";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  TradeRepository,
  WalletRepository,
} from "../ports";

interface Deps {
  wallets: WalletRepository;
  orders: OrderRepository;
  trades: TradeRepository;
  clock: Clock;
  ids: IdGenerator;
}

export interface SellInput {
  userId: UserId;
  coinAmount: number;
  price: number;
  reason?: TradeReason;
  executedAt?: number;
}

export class SellJayCoin {
  constructor(private readonly deps: Deps) {}

  execute({
    userId,
    coinAmount,
    price,
    reason = "MANUAL",
    executedAt,
  }: SellInput): Trade {
    if (coinAmount <= 0 || price <= 0) throw new InvalidAmountError();

    const wallet = this.deps.wallets.get(userId);
    if (coinAmount > wallet.coins + 1e-9) throw new InsufficientCoinsError();

    const safeAmount = Math.min(coinAmount, wallet.coins);
    const updated = applySell(wallet, safeAmount, price);
    this.deps.wallets.save(updated);

    if (updated.coins === 0) {
      this.deps.orders.save({
        userId,
        stopLoss: null,
        takeProfit: null,
        lastEvaluatedAt: null,
      });
    }

    const trade: Trade = {
      id: this.deps.ids.next(),
      userId,
      side: "SELL",
      reason,
      price,
      coins: safeAmount,
      cashDelta: safeAmount * price,
      timestamp: executedAt ?? this.deps.clock.now(),
    };
    this.deps.trades.append(trade);
    return trade;
  }
}
