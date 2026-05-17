import type {
  Clock,
  PriceFeed,
  PriceListener,
  PriceOracle,
  PricePoint,
} from "../../application/ports";
import { priceAt, sampleRange } from "./deterministicPrice";

export interface DeterministicPriceFeedConfig {
  tickIntervalMs?: number;
}

export class DeterministicPriceFeed implements PriceFeed, PriceOracle {
  private readonly tickMs: number;
  private readonly listeners = new Set<PriceListener>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly clock: Clock,
    config: DeterministicPriceFeedConfig = {},
  ) {
    this.tickMs = config.tickIntervalMs ?? 1000;
  }

  current(): PricePoint {
    const now = this.clock.now();
    return { timestamp: now, price: priceAt(now) };
  }

  priceAt(timestampMs: number): number {
    return priceAt(timestampMs);
  }

  sampleRange(
    fromMs: number,
    toMs: number,
    points: number,
  ): PricePoint[] {
    return sampleRange(fromMs, toMs, points);
  }

  subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.timer != null) return;
    this.timer = setInterval(() => {
      const point = this.current();
      this.listeners.forEach((listener) => listener(point));
    }, this.tickMs);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
