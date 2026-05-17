import type { OpenOrders, UserId } from "../../domain/entities";
import { InvalidOrderError } from "../../domain/errors";
import type { Clock, OrderRepository, WalletRepository } from "../ports";

interface Deps {
  wallets: WalletRepository;
  orders: OrderRepository;
  clock: Clock;
}

export interface SetOrdersInput {
  userId: UserId;
  stopLoss: number | null;
  takeProfit: number | null;
}

export class SetOrders {
  constructor(private readonly deps: Deps) {}

  execute({ userId, stopLoss, takeProfit }: SetOrdersInput): OpenOrders {
    const wallet = this.deps.wallets.get(userId);
    if (wallet.coins <= 0) {
      throw new InvalidOrderError(
        "You need to hold JayCoin before setting SL/TP.",
      );
    }
    if (stopLoss != null && stopLoss <= 0) {
      throw new InvalidOrderError("Stop-loss must be positive.");
    }
    if (takeProfit != null && takeProfit <= 0) {
      throw new InvalidOrderError("Take-profit must be positive.");
    }
    if (
      stopLoss != null &&
      takeProfit != null &&
      stopLoss >= takeProfit
    ) {
      throw new InvalidOrderError(
        "Stop-loss must be below take-profit.",
      );
    }

    const noOrders = stopLoss == null && takeProfit == null;
    const next: OpenOrders = {
      userId,
      stopLoss,
      takeProfit,
      lastEvaluatedAt: noOrders ? null : this.deps.clock.now(),
    };
    this.deps.orders.save(next);
    return next;
  }
}
