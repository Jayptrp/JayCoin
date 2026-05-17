import { useMemo, useRef, useState } from "react";
import type { PricePoint } from "../../application/ports";
import { formatPercent, formatPrice } from "../format";

interface Props {
  points: PricePoint[];
  label: string;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 120;

export function PriceChart({ points, label }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, min, max, change, fromLabel, toLabel, coords } = useMemo(() => {
    if (points.length < 2) {
      return {
        path: "",
        min: 0,
        max: 0,
        change: 0,
        fromLabel: "",
        toLabel: "",
        coords: [] as { x: number; y: number }[],
      };
    }
    const prices = points.map((p) => p.price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const range = Math.max(maxVal - minVal, 1e-6);
    const stepX = VIEW_WIDTH / (points.length - 1);

    const pts = points.map((p, index) => ({
      x: index * stepX,
      y: VIEW_HEIGHT - ((p.price - minVal) / range) * VIEW_HEIGHT,
    }));

    const d = pts
      .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
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
      coords: pts,
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

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const idx = Math.round(relativeX * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
  }

  function handleLeave() {
    setHoverIndex(null);
  }

  const hoverPoint = hoverIndex != null ? points[hoverIndex] : null;
  const hoverCoord = hoverIndex != null ? coords[hoverIndex] : null;

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>JAY/USD · {label}</span>
        {hoverPoint ? (
          <span
            className="font-mono text-slate-200"
            aria-label="hovered price"
          >
            {formatPrice(hoverPoint.price)} · {formatHoverTime(hoverPoint.timestamp)}
          </span>
        ) : (
          <span
            className={positive ? "text-jay-up" : "text-jay-down"}
            aria-label="window change"
          >
            {formatPercent(change)}
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-32 w-full touch-none"
        role="img"
        aria-label="JayCoin price chart"
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={handleLeave}
        onPointerCancel={handleLeave}
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hoverCoord && (
          <>
            <line
              x1={hoverCoord.x}
              x2={hoverCoord.x}
              y1={0}
              y2={VIEW_HEIGHT}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hoverCoord.x}
              cy={hoverCoord.y}
              r={3}
              fill={stroke}
              stroke="#0f172a"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
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

function formatHoverTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
