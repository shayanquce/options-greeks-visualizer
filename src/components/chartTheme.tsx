/** Shared Recharts styling + one canonical color per Greek. */
import { fmt } from "../lib/format";

export const CHART = {
  grid: "#1e1e1e",
  axis: "#2a2a2a",
  tick: { fill: "#6a6a6a", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" },
  accent: "#e07b20",
  info: "#6b8cae",
  up: "#3d9970",
  down: "#c94a4a",
  dim: "#8a8a8a",
  faint: "#5c5c5c",
};

/** Restrained palette: no rainbow. Each Greek gets a distinct but muted hue. */
export const GK: Record<string, string> = {
  price: "#e07b20",
  delta: "#6b8cae",
  gamma: "#7a9e7e",
  theta: "#c94a4a",
  vega: "#7a8eb0",
  rho: "#a08060",
  vanna: "#8a9ab0",
  charm: "#6a8a6e",
  vomma: "#b8956a",
};

interface TipProps {
  active?: boolean;
  label?: number | string;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  labelPrefix?: string;
  dp?: number;
}

export function ChartTip({ active, label, payload, labelPrefix = "S", dp = 4 }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-edge2 bg-panel px-2.5 py-1.5">
      <div className="tnum mb-1 text-[10px] text-faint">
        {labelPrefix} {typeof label === "number" ? fmt(label, 2) : label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="tnum flex items-center gap-2 text-[11px] leading-4">
          <span className="inline-block h-[6px] w-[6px]" style={{ background: p.color }} />
          <span className="text-dim">{p.name}</span>
          <span className="ml-auto pl-4 text-txt">
            {typeof p.value === "number" ? fmt(p.value, dp) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
