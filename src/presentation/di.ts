import { AuthenticateOrCreateUser } from "../application/usecases/authenticateOrCreate";
import { BuyJayCoin } from "../application/usecases/buy";
import { EvaluateOrders } from "../application/usecases/evaluateOrders";
import { SellJayCoin } from "../application/usecases/sell";
import { SetOrders } from "../application/usecases/setOrders";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  PriceFeed,
  TradeRepository,
  UserRepository,
  WalletRepository,
} from "../application/ports";
import { SystemClock } from "../infrastructure/clock";
import { CryptoIdGenerator } from "../infrastructure/id";
import { SimulatedPriceFeed } from "../infrastructure/price/simulatedPriceFeed";
import { LocalStorageOrderRepository } from "../infrastructure/storage/orderRepo";
import { LocalStorageKeyValueStore } from "../infrastructure/storage/storage";
import { LocalStorageTradeRepository } from "../infrastructure/storage/tradeRepo";
import { LocalStorageUserRepository } from "../infrastructure/storage/userRepo";
import { LocalStorageWalletRepository } from "../infrastructure/storage/walletRepo";

export interface Container {
  clock: Clock;
  ids: IdGenerator;
  users: UserRepository;
  wallets: WalletRepository;
  orders: OrderRepository;
  trades: TradeRepository;
  priceFeed: PriceFeed;
  authenticateOrCreate: AuthenticateOrCreateUser;
  buy: BuyJayCoin;
  sell: SellJayCoin;
  setOrders: SetOrders;
  evaluateOrders: EvaluateOrders;
}

export function createContainer(): Container {
  const clock = new SystemClock();
  const ids = new CryptoIdGenerator();
  const store = new LocalStorageKeyValueStore();

  const users = new LocalStorageUserRepository(store);
  const wallets = new LocalStorageWalletRepository(store);
  const orders = new LocalStorageOrderRepository(store);
  const trades = new LocalStorageTradeRepository(store);

  const priceFeed = new SimulatedPriceFeed(clock, {
    initialPrice: 100,
    driftPerTick: 0,
    volatilityPerTick: 0.015,
    tickIntervalMs: 1000,
    historySize: 120,
  });

  const sell = new SellJayCoin({ wallets, orders, trades, clock, ids });
  return {
    clock,
    ids,
    users,
    wallets,
    orders,
    trades,
    priceFeed,
    authenticateOrCreate: new AuthenticateOrCreateUser({
      users,
      wallets,
      orders,
      clock,
      ids,
    }),
    buy: new BuyJayCoin({ wallets, trades, clock, ids }),
    sell,
    setOrders: new SetOrders({ wallets, orders }),
    evaluateOrders: new EvaluateOrders({ wallets, orders, sell }),
  };
}
