import { useEffect, useRef, useState } from "react";
import { formatPrice } from "../format";

interface Props {
  price: number;
}

export function PriceTicker({ price }: Props) {
  const prev = useRef(price);
  const [dir, setDir] = useState<"up" | "down" | "flat">("flat");

  useEffect(() => {
    if (price > prev.current) setDir("up");
    else if (price < prev.current) setDir("down");
    prev.current = price;
  }, [price]);

  const color =
    dir === "up"
      ? "text-jay-up"
      : dir === "down"
        ? "text-jay-down"
        : "text-slate-200";

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-4">
      <div className="text-xs uppercase tracking-wider text-slate-400">
        Live price
      </div>
      <div className={`mt-1 font-mono text-3xl font-bold ${color}`}>
        {formatPrice(price)}
      </div>
    </div>
  );
}
