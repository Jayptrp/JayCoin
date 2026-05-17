import { describe, expect, it } from "vitest";
import {
  BASE_PRICE,
  GENESIS_TIMESTAMP_MS,
  priceAt,
  sampleRange,
} from "./deterministicPrice";

describe("deterministicPrice", () => {
  it("returns base price at and before genesis", () => {
    expect(priceAt(GENESIS_TIMESTAMP_MS)).toBe(BASE_PRICE);
    expect(priceAt(GENESIS_TIMESTAMP_MS - 60_000)).toBe(BASE_PRICE);
  });

  it("is deterministic — same timestamp returns the same price", () => {
    const t = GENESIS_TIMESTAMP_MS + 7 * 60 * 60_000;
    expect(priceAt(t)).toBe(priceAt(t));
  });

  it("produces different prices at different times", () => {
    const a = priceAt(GENESIS_TIMESTAMP_MS + 1_000);
    const b = priceAt(GENESIS_TIMESTAMP_MS + 60 * 60_000);
    expect(a).not.toBe(b);
  });

  it("stays within sane bounds", () => {
    for (let i = 0; i < 100; i++) {
      const t = GENESIS_TIMESTAMP_MS + i * 3_600_000;
      const p = priceAt(t);
      expect(p).toBeGreaterThan(1);
      expect(p).toBeLessThan(10_000);
    }
  });

  it("sampleRange yields the requested number of evenly-spaced points", () => {
    const from = GENESIS_TIMESTAMP_MS + 60_000;
    const to = from + 5 * 60_000;
    const points = sampleRange(from, to, 11);
    expect(points).toHaveLength(11);
    expect(points[0]?.timestamp).toBe(from);
    expect(points[10]?.timestamp).toBe(to);
  });
});
