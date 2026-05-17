import { useEffect, useMemo, useState } from "react";
import type { PricePoint } from "../../application/ports";
import { findTimeframe, type TimeframeId } from "../../domain/timeframes";
import { GENESIS_TIMESTAMP_MS } from "../../infrastructure/price/deterministicPrice";
import { useContainer } from "../AppContext";

const CHART_POINTS = 150;

export interface PriceData {
  current: PricePoint;
  points: PricePoint[];
}

export function usePriceData(timeframeId: TimeframeId): PriceData {
  const { priceFeed, priceOracle } = useContainer();
  const [current, setCurrent] = useState<PricePoint>(() => priceFeed.current());

  useEffect(() => {
    priceFeed.start();
    const unsubscribe = priceFeed.subscribe(setCurrent);
    return () => {
      unsubscribe();
      priceFeed.stop();
    };
  }, [priceFeed]);

  const points = useMemo(() => {
    const tf = findTimeframe(timeframeId);
    const to = current.timestamp;
    const from =
      tf.windowMs === "all" ? GENESIS_TIMESTAMP_MS : to - tf.windowMs;
    return priceOracle.sampleRange(Math.max(from, GENESIS_TIMESTAMP_MS), to, CHART_POINTS);
  }, [timeframeId, current, priceOracle]);

  return { current, points };
}
