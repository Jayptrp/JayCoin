import { useMemo } from "react";
import type { PricePoint } from "../../application/ports";
import { formatPercent, formatPrice } from "../format";

interface Props {
  points: PricePoint[];
  label: string;
}

export function PriceChart({ points, label }: Props) {
  const { path, min, max, change, fromLabel, toLabel } = useMemo(() => {
    if (points.length < 2) {
      return {
        path: "",
        min: 0,
        max: 0,
        change: 0,
        fromLabel: "",
        toLabel: "",
      };
    }
    const prices = points.map((p) => p.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const range = Math.max(maxVal - minVal, 1e-6);
    const width = 320;
    const height = 120;
    const stepX = width / (points.length - 1);

    const d = points
      .map((p, index) => {
        const x = index * stepX;
        const y = height - ((p.price - minVal) / range) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const first = points[0]!.price;
    const last = points[points.length - 1]!.price;
    return {
      path: d,
      min: minVal,
      max: maxVal,
      change: (last - first) / first,
      fromLabel: formatEdgeTime(points[0]!.timestamp),
      toLabel: formatEdgeTime(points[points.length - 1]!.timestamp),
    };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-jay-border bg-jay-panel text-sm text-slate-500">
        No data in this window.
      </div>
    );
  }

  const positive = change >= 0;
  const stroke = positive ? "#22c55e" : "#ef4444";

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>JAY/USD · {label}</span>
        <span
          className={positive ? "text-jay-up" : "text-jay-down"}
          aria-label="window change"
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
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{fromLabel}</span>
        <span>
          low {formatPrice(min)} · high {formatPrice(max)}
        </span>
        <span>{toLabel}</span>
      </div>
    </div>
  );
}

function formatEdgeTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}
