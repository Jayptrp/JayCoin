import { useMemo, useRef, useState } from "react";
import type { PricePoint } from "../../application/ports";
import { formatPercent, formatPrice } from "../format";

export interface ChartPosition {
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
}

interface Props {
  points: PricePoint[];
  label: string;
  position?: ChartPosition | null;
}

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 120;
const COLOR_UP = "#22c55e";
const COLOR_DOWN = "#ef4444";
const COLOR_ENTRY = "#facc15";

type Coord = { x: number; y: number };

export function PriceChart({ points, label, position = null }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    if (points.length < 2) return null;

    const prices = points.map((p) => p.price);
    const levels: number[] = [];
    if (position) {
      levels.push(position.entryPrice);
      if (position.stopLoss != null) levels.push(position.stopLoss);
      if (position.takeProfit != null) levels.push(position.takeProfit);
    }
    const allValues = [...prices, ...levels];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const pad = Math.max((dataMax - dataMin) * 0.05, 1e-3);
    const minVal = dataMin - pad;
    const maxVal = dataMax + pad;
    const range = Math.max(maxVal - minVal, 1e-6);
    const stepX = VIEW_WIDTH / (points.length - 1);

    const priceToY = (price: number) =>
      VIEW_HEIGHT - ((price - minVal) / range) * VIEW_HEIGHT;

    const coords: Coord[] = points.map((p, i) => ({
      x: i * stepX,
      y: priceToY(p.price),
    }));

    const first = points[0]!.price;
    const last = points[points.length - 1]!.price;
    const change = (last - first) / first;

    let abovePath = "";
    let belowPath = "";
    if (position) {
      const baselineY = priceToY(position.entryPrice);
      const { above, below } = splitOnBaseline(coords, baselineY);
      abovePath = segmentsToPath(above);
      belowPath = segmentsToPath(below);
    }

    const overallPath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");

    return {
      coords,
      overallPath,
      abovePath,
      belowPath,
      min: dataMin,
      max: dataMax,
      change,
      priceToY,
      fromLabel: formatEdgeTime(points[0]!.timestamp),
      toLabel: formatEdgeTime(points[points.length - 1]!.timestamp),
      lastPrice: last,
    };
  }, [points, position]);

  if (!data) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-jay-border bg-jay-panel text-sm text-slate-500 lg:h-80">
        No data in this window.
      </div>
    );
  }

  const positive = position
    ? data.lastPrice >= position.entryPrice
    : data.change >= 0;
  const fallbackStroke = positive ? COLOR_UP : COLOR_DOWN;

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
  const hoverCoord = hoverIndex != null ? data.coords[hoverIndex] : null;

  const levels: { value: number; color: string; label: string; tone: "accent" | "up" | "down" }[] = [];
  if (position) {
    levels.push({
      value: position.entryPrice,
      color: COLOR_ENTRY,
      label: "ENTRY",
      tone: "accent",
    });
    if (position.takeProfit != null) {
      levels.push({
        value: position.takeProfit,
        color: COLOR_UP,
        label: "TP",
        tone: "up",
      });
    }
    if (position.stopLoss != null) {
      levels.push({
        value: position.stopLoss,
        color: COLOR_DOWN,
        label: "SL",
        tone: "down",
      });
    }
  }

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
            {formatPercent(data.change)}
          </span>
        )}
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-32 w-full touch-none lg:h-80"
          role="img"
          aria-label="JayCoin price chart"
          onPointerMove={handleMove}
          onPointerDown={handleMove}
          onPointerLeave={handleLeave}
          onPointerCancel={handleLeave}
        >
          {levels.map((lvl) => {
            const y = data.priceToY(lvl.value);
            return (
              <line
                key={lvl.label}
                x1={0}
                x2={VIEW_WIDTH}
                y1={y}
                y2={y}
                stroke={lvl.color}
                strokeWidth={1}
                strokeDasharray="4 3"
                strokeOpacity={0.8}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {position ? (
            <>
              <path
                d={data.belowPath}
                fill="none"
                stroke={COLOR_DOWN}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={data.abovePath}
                fill="none"
                stroke={COLOR_UP}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : (
            <path
              d={data.overallPath}
              fill="none"
              stroke={fallbackStroke}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {hoverCoord && (
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
          )}
        </svg>

        {levels.length > 0 && (
          <div className="pointer-events-none absolute inset-0">
            {levels.map((lvl) => {
              const yPct = (data.priceToY(lvl.value) / VIEW_HEIGHT) * 100;
              const toneClass =
                lvl.tone === "accent"
                  ? "bg-jay-accent text-jay-bg"
                  : lvl.tone === "up"
                    ? "bg-jay-up text-slate-900"
                    : "bg-jay-down text-white";
              return (
                <span
                  key={lvl.label}
                  className={`absolute right-1 -translate-y-1/2 rounded px-1.5 py-px font-mono text-[10px] font-semibold ${toneClass}`}
                  style={{ top: `${yPct}%` }}
                >
                  {lvl.label} {formatPrice(lvl.value)}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{data.fromLabel}</span>
        <span>
          low {formatPrice(data.min)} · high {formatPrice(data.max)}
        </span>
        <span>{data.toLabel}</span>
      </div>
    </div>
  );
}

function splitOnBaseline(
  coords: Coord[],
  baselineY: number,
): { above: Coord[][]; below: Coord[][] } {
  const above: Coord[][] = [];
  const below: Coord[][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]!;
    const b = coords[i + 1]!;
    const aAbove = a.y <= baselineY;
    const bAbove = b.y <= baselineY;
    if (aAbove === bAbove) {
      (aAbove ? above : below).push([a, b]);
      continue;
    }
    const dy = b.y - a.y;
    const t = dy === 0 ? 0 : (baselineY - a.y) / dy;
    const cross: Coord = { x: a.x + (b.x - a.x) * t, y: baselineY };
    (aAbove ? above : below).push([a, cross]);
    (aAbove ? below : above).push([cross, b]);
  }
  return { above, below };
}

function segmentsToPath(segments: Coord[][]): string {
  return segments
    .map(
      ([a, b]) =>
        `M${a!.x.toFixed(1)},${a!.y.toFixed(1)} L${b!.x.toFixed(1)},${b!.y.toFixed(1)}`,
    )
    .join(" ");
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
