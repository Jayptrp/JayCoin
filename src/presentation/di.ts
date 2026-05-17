import { AuthenticateOrCreateUser } from "../application/usecases/authenticateOrCreate";
import { BuyJayCoin } from "../application/usecases/buy";
import { CatchUpOrders } from "../application/usecases/catchUpOrders";
import { EvaluateOrders } from "../application/usecases/evaluateOrders";
import { SellJayCoin } from "../application/usecases/sell";
import { SetOrders } from "../application/usecases/setOrders";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  PriceFeed,
  PriceOracle,
  TradeRepository,
  UserRepository,
  WalletRepository,
} from "../application/ports";
import { SystemClock } from "../infrastructure/clock";
import { CryptoIdGenerator } from "../infrastructure/id";
import { DeterministicPriceFeed } from "../infrastructure/price/deterministicPriceFeed";
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
  priceOracle: PriceOracle;
  authenticateOrCreate: AuthenticateOrCreateUser;
  buy: BuyJayCoin;
  sell: SellJayCoin;
  setOrders: SetOrders;
  evaluateOrders: EvaluateOrders;
  catchUpOrders: CatchUpOrders;
}

export function createContainer(): Container {
  const clock = new SystemClock();
  const ids = new CryptoIdGenerator();
  const store = new LocalStorageKeyValueStore();

  const users = new LocalStorageUserRepository(store);
  const wallets = new LocalStorageWalletRepository(store);
  const orders = new LocalStorageOrderRepository(store);
  const trades = new LocalStorageTradeRepository(store);

  const feed = new DeterministicPriceFeed(clock, { tickIntervalMs: 1000 });

  const sell = new SellJayCoin({ wallets, orders, trades, clock, ids });
  return {
    clock,
    ids,
    users,
    wallets,
    orders,
    trades,
    priceFeed: feed,
    priceOracle: feed,
    authenticateOrCreate: new AuthenticateOrCreateUser({
      users,
      wallets,
      orders,
      clock,
      ids,
    }),
    buy: new BuyJayCoin({ wallets, trades, clock, ids }),
    sell,
    setOrders: new SetOrders({ wallets, orders, clock }),
    evaluateOrders: new EvaluateOrders({ wallets, orders, sell, clock }),
    catchUpOrders: new CatchUpOrders({
      wallets,
      orders,
      oracle: feed,
      sell,
      clock,
    }),
  };
}
