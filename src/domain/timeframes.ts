export type TimeframeId = "1m" | "5m" | "15m" | "1h" | "1d" | "all";

export interface Timeframe {
  readonly id: TimeframeId;
  readonly label: string;
  readonly windowMs: number | "all";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const TIMEFRAMES: readonly Timeframe[] = [
  { id: "1m", label: "1m", windowMs: MINUTE },
  { id: "5m", label: "5m", windowMs: 5 * MINUTE },
  { id: "15m", label: "15m", windowMs: 15 * MINUTE },
  { id: "1h", label: "1h", windowMs: HOUR },
  { id: "1d", label: "1d", windowMs: DAY },
  { id: "all", label: "ALL", windowMs: "all" },
];

export function findTimeframe(id: TimeframeId): Timeframe {
  const match = TIMEFRAMES.find((tf) => tf.id === id);
  if (!match) throw new Error(`Unknown timeframe: ${id}`);
  return match;
}
