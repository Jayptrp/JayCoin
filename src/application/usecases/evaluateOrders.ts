import type { Trade, UserId } from "../../domain/entities";
import type { OrderRepository, WalletRepository } from "../ports";
import { SellJayCoin } from "./sell";

interface Deps {
  wallets: WalletRepository;
  orders: OrderRepository;
  sell: SellJayCoin;
}

export interface EvaluateInput {
  userId: UserId;
  price: number;
}

export class EvaluateOrders {
  constructor(private readonly deps: Deps) {}

  execute({ userId, price }: EvaluateInput): Trade | null {
    const wallet = this.deps.wallets.get(userId);
    if (wallet.coins <= 0) return null;

    const orders = this.deps.orders.get(userId);

    if (orders.takeProfit != null && price >= orders.takeProfit) {
      return this.deps.sell.execute({
        userId,
        coinAmount: wallet.coins,
        price,
        reason: "TAKE_PROFIT",
      });
    }

    if (orders.stopLoss != null && price <= orders.stopLoss) {
      return this.deps.sell.execute({
        userId,
        coinAmount: wallet.coins,
        price,
        reason: "STOP_LOSS",
      });
    }

    return null;
  }
}
