import { useMemo } from "react";
import type { PricePoint } from "../../application/ports";
import { formatPercent, formatPrice } from "../format";

interface Props {
  history: PricePoint[];
}

export function PriceChart({ history }: Props) {
  const { path, min, max, change } = useMemo(() => {
    if (history.length < 2) {
      return { path: "", min: 0, max: 0, change: 0 };
    }
    const prices = history.map((point) => point.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const range = Math.max(maxVal - minVal, 1e-6);
    const width = 320;
    const height = 120;
    const stepX = width / (history.length - 1);

    const path = history
      .map((point, index) => {
        const x = index * stepX;
        const y = height - ((point.price - minVal) / range) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const first = history[0]!.price;
    const last = history[history.length - 1]!.price;
    return { path, min: minVal, max: maxVal, change: (last - first) / first };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-jay-border bg-jay-panel text-sm text-slate-500">
        Warming up price feed…
      </div>
    );
  }

  const positive = change >= 0;
  const stroke = positive ? "#22c55e" : "#ef4444";

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>JAY/USD · last 2 min</span>
        <span
          className={positive ? "text-jay-up" : "text-jay-down"}
          aria-label="session change"
        >
          {formatPercent(change)}
        </span>
      </div>
      <svg
        viewBox="0 0 320 120"
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label="JayCoin price chart"
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>low {formatPrice(min)}</span>
        <span>high {formatPrice(max)}</span>
      </div>
    </div>
  );
}
