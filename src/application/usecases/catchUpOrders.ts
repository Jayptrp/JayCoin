import type { Trade, UserId } from "../../domain/entities";
import type {
  Clock,
  OrderRepository,
  PriceOracle,
  WalletRepository,
} from "../ports";
import { SellJayCoin } from "./sell";

interface Deps {
  wallets: WalletRepository;
  orders: OrderRepository;
  oracle: PriceOracle;
  sell: SellJayCoin;
  clock: Clock;
}

export interface CatchUpInput {
  userId: UserId;
}

const BUCKET_MS = 60_000;
const MAX_BUCKETS = 24 * 60 * 7;

export class CatchUpOrders {
  constructor(private readonly deps: Deps) {}

  execute({ userId }: CatchUpInput): Trade | null {
    const wallet = this.deps.wallets.get(userId);
    if (wallet.coins <= 0) return null;

    const orders = this.deps.orders.get(userId);
    if (orders.stopLoss == null && orders.takeProfit == null) return null;
    if (orders.lastEvaluatedAt == null) return null;

    const now = this.deps.clock.now();
    const from = orders.lastEvaluatedAt;
    if (from >= now) return null;

    const totalBuckets = Math.min(
      MAX_BUCKETS,
      Math.ceil((now - from) / BUCKET_MS),
    );
    const startFrom = Math.max(from, now - totalBuckets * BUCKET_MS);

    for (let t = startFrom; t <= now; t += BUCKET_MS) {
      const price = this.deps.oracle.priceAt(t);

      if (orders.takeProfit != null && price >= orders.takeProfit) {
        return this.deps.sell.execute({
          userId,
          coinAmount: wallet.coins,
          price,
          reason: "TAKE_PROFIT",
          executedAt: t,
        });
      }
      if (orders.stopLoss != null && price <= orders.stopLoss) {
        return this.deps.sell.execute({
          userId,
          coinAmount: wallet.coins,
          price,
          reason: "STOP_LOSS",
          executedAt: t,
        });
      }
    }

    this.deps.orders.save({ ...orders, lastEvaluatedAt: now });
    return null;
  }
}
