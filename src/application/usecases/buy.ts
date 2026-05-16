import type { Trade, UserId } from "../../domain/entities";
import {
  InsufficientCashError,
  InvalidAmountError,
} from "../../domain/errors";
import { applyBuy } from "../../domain/pricing";
import type {
  Clock,
  IdGenerator,
  TradeRepository,
  WalletRepository,
} from "../ports";

interface Deps {
  wallets: WalletRepository;
  trades: TradeRepository;
  clock: Clock;
  ids: IdGenerator;
}

export interface BuyInput {
  userId: UserId;
  cashAmount: number;
  price: number;
}

export class BuyJayCoin {
  constructor(private readonly deps: Deps) {}

  execute({ userId, cashAmount, price }: BuyInput): Trade {
    if (cashAmount <= 0 || price <= 0) throw new InvalidAmountError();

    const wallet = this.deps.wallets.get(userId);
    if (cashAmount > wallet.cash) throw new InsufficientCashError();

    const coinsBought = cashAmount / price;
    const updated = applyBuy(wallet, coinsBought, price);
    this.deps.wallets.save(updated);

    const trade: Trade = {
      id: this.deps.ids.next(),
      userId,
      side: "BUY",
      reason: "MANUAL",
      price,
      coins: coinsBought,
      cashDelta: -cashAmount,
      timestamp: this.deps.clock.now(),
    };
    this.deps.trades.append(trade);
    return trade;
  }
}
