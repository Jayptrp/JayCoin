import type { PricePoint } from "../../application/ports";

export const GENESIS_TIMESTAMP_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
export const BASE_PRICE = 100;

const OCTAVES = 16;
const AMP_GROWTH = 1.5;
const NOISE_SEED = 1337;
const VOLATILITY = 0.55;

function hash01(n: number, seed: number): number {
  let x =
    (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967295;
}

function valueNoise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i, seed) * 2 - 1;
  const b = hash01(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

function fractalNoise(x: number): number {
  let total = 0;
  let weight = 0;
  let amp = 1;
  let scale = 1;
  for (let k = 0; k < OCTAVES; k++) {
    total += valueNoise(x / scale, NOISE_SEED + k) * amp;
    weight += amp;
    amp *= AMP_GROWTH;
    scale *= 2;
  }
  return total / weight;
}

const ANCHOR = fractalNoise(0);

export function priceAt(timestampMs: number): number {
  if (timestampMs <= GENESIS_TIMESTAMP_MS) return BASE_PRICE;
  const seconds = (timestampMs - GENESIS_TIMESTAMP_MS) / 1000;
  const n = fractalNoise(seconds) - ANCHOR;
  return Math.max(0.01, round2(BASE_PRICE * Math.exp(n * VOLATILITY)));
}

export function sampleRange(
  fromMs: number,
  toMs: number,
  points: number,
): PricePoint[] {
  if (points < 2 || toMs <= fromMs) {
    return [{ timestamp: toMs, price: priceAt(toMs) }];
  }
  const result: PricePoint[] = new Array(points);
  const step = (toMs - fromMs) / (points - 1);
  for (let i = 0; i < points; i++) {
    const t = fromMs + step * i;
    result[i] = { timestamp: t, price: priceAt(t) };
  }
  return result;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
