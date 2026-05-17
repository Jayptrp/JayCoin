import type {
  OpenOrders,
  Trade,
  User,
  UserId,
  Wallet,
} from "../domain/entities";

export interface UserRepository {
  getCurrentUserId(): UserId | null;
  setCurrentUserId(id: UserId): void;
  findById(id: UserId): User | null;
  findByNickname(nickname: string): User | null;
  save(user: User): void;
}

export interface WalletRepository {
  get(userId: UserId): Wallet;
  save(wallet: Wallet): void;
}

export interface OrderRepository {
  get(userId: UserId): OpenOrders;
  save(orders: OpenOrders): void;
}

export interface TradeRepository {
  list(userId: UserId): Trade[];
  append(trade: Trade): void;
}

export interface PricePoint {
  readonly price: number;
  readonly timestamp: number;
}

export type PriceListener = (point: PricePoint) => void;

export interface PriceFeed {
  current(): PricePoint;
  subscribe(listener: PriceListener): () => void;
  start(): void;
  stop(): void;
}

export interface PriceOracle {
  priceAt(timestampMs: number): number;
  sampleRange(
    fromMs: number,
    toMs: number,
    points: number,
  ): PricePoint[];
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  next(): string;
}
