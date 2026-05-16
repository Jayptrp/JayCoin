import { useEffect, useState } from "react";
import type { PricePoint } from "../../application/ports";
import { useContainer } from "../AppContext";

export interface PriceState {
  current: PricePoint;
  history: PricePoint[];
}

export function usePrice(): PriceState {
  const { priceFeed } = useContainer();
  const [state, setState] = useState<PriceState>(() => ({
    current: priceFeed.current(),
    history: [...priceFeed.history()],
  }));

  useEffect(() => {
    priceFeed.start();
    const unsubscribe = priceFeed.subscribe(() => {
      setState({
        current: priceFeed.current(),
        history: [...priceFeed.history()],
      });
    });
    return () => {
      unsubscribe();
      priceFeed.stop();
    };
  }, [priceFeed]);

  return state;
}
