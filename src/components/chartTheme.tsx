/** Shared Recharts styling + one canonical color per Greek (print palette). */
import { fmt } from "../lib/format";

export const CHART = {
  grid: "#e4ded0",
  axis: "#c9c1ac",
  tick: { fill: "#7d7460", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" },
  accent: "#a4502a",
  info: "#3d6484",
  up: "#2f7d5a",
  down: "#a83a32",
  dim: "#5f584a",
  faint: "#978e79",
  ink: "#211d12",
};

/** Muted print inks: each Greek gets a distinct hue that holds up on paper. */
export const GK: Record<string, string> = {
  price: "#a4502a",
  delta: "#3d6484",
  gamma: "#2f7d5a",
  theta: "#a83a32",
  vega: "#6b5a96",
  rho: "#8a6a34",
  vanna: "#4c7a8c",
  charm: "#587a52",
  vomma: "#a2703a",
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
    <div className="rounded-[3px] border border-edge2 bg-panel px-2.5 py-1.5 shadow-sm">
      <div className="tnum mb-1 text-[10px] text-faint">
        {labelPrefix} {typeof label === "number" ? fmt(label, 2) : label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="tnum flex items-center gap-2 text-[11px] leading-4">
          <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: p.color }} />
          <span className="text-dim">{p.name}</span>
          <span className="ml-auto pl-4 text-txt">
            {typeof p.value === "number" ? fmt(p.value, dp) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
