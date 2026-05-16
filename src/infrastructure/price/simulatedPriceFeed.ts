import type {
  Clock,
  PriceFeed,
  PriceListener,
  PricePoint,
} from "../../application/ports";

export interface SimulatedPriceFeedConfig {
  initialPrice?: number;
  driftPerTick?: number;
  volatilityPerTick?: number;
  tickIntervalMs?: number;
  historySize?: number;
}

export class SimulatedPriceFeed implements PriceFeed {
  private price: number;
  private readonly drift: number;
  private readonly vol: number;
  private readonly tickMs: number;
  private readonly maxHistory: number;
  private readonly points: PricePoint[] = [];
  private readonly listeners = new Set<PriceListener>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly clock: Clock,
    config: SimulatedPriceFeedConfig = {},
  ) {
    this.price = config.initialPrice ?? 100;
    this.drift = config.driftPerTick ?? 0;
    this.vol = config.volatilityPerTick ?? 0.01;
    this.tickMs = config.tickIntervalMs ?? 1000;
    this.maxHistory = config.historySize ?? 120;
    this.push(this.price);
  }

  current(): PricePoint {
    return this.points[this.points.length - 1]!;
  }

  history(): readonly PricePoint[] {
    return this.points;
  }

  subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.timer != null) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const shock = this.sampleNormal() * this.vol;
    this.price = Math.max(0.01, this.price * Math.exp(this.drift + shock));
    const point = this.push(this.price);
    this.listeners.forEach((listener) => listener(point));
  }

  private push(price: number): PricePoint {
    const point: PricePoint = {
      price: round2(price),
      timestamp: this.clock.now(),
    };
    this.points.push(point);
    if (this.points.length > this.maxHistory) this.points.shift();
    return point;
  }

  private sampleNormal(): number {
    const u1 = Math.random() || 1e-9;
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
