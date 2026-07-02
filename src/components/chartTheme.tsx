/** Shared Recharts styling + one canonical color per Greek, used everywhere. */
import { fmt } from "../lib/format";

export const CHART = {
  grid: "#171b23",
  axis: "#29303c",
  tick: { fill: "#6b7688", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" },
  accent: "#f0b429",
  info: "#4d9fec",
  up: "#2ebd85",
  down: "#f6465d",
  dim: "#838d9e",
  faint: "#515a69",
};

/**
 * Canonical identity color for each quantity. Reused by the Greek curves,
 * the surface selector, and every legend so the color coding is a single
 * consistent system rather than ad-hoc per chart.
 */
export const GK: Record<string, string> = {
  price: "#f0b429",
  delta: "#4d9fec",
  gamma: "#2ebd85",
  theta: "#f6465d",
  vega: "#a78bfa",
  rho: "#e0823d",
  vanna: "#38bdf8",
  charm: "#f472b6",
  vomma: "#eab308",
};

interface TipProps {
  active?: boolean;
  label?: number | string;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  labelPrefix?: string;
  dp?: number;
}

/** Dark tooltip panel used by every chart. */
export function ChartTip({ active, label, payload, labelPrefix = "S", dp = 4 }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-edge2 bg-panel/95 px-2.5 py-1.5 shadow-xl shadow-black/60 backdrop-blur-sm">
      <div className="tnum mb-1 text-[10px] text-faint">
        {labelPrefix} {typeof label === "number" ? fmt(label, 2) : label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="tnum flex items-center gap-2 text-[11px] leading-4">
          <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: p.color }} />
          <span className="text-dim">{p.name}</span>
          <span className="ml-auto pl-4 text-txt">
            {typeof p.value === "number" ? fmt(p.value, dp) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
