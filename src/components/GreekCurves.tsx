import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { greeks } from "../lib/blackScholes";
import { fmt, fmtTick } from "../lib/format";
import type { AppInputs } from "./InputsPanel";
import { CHART, ChartTip, GK } from "./chartTheme";

interface Row {
  S: number;
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

const PANELS: { key: keyof Omit<Row, "S">; title: string; symbol: string; unit: string; color: string }[] = [
  { key: "price", title: "Value", symbol: "V", unit: "", color: GK.price },
  { key: "delta", title: "Delta", symbol: "Δ", unit: "", color: GK.delta },
  { key: "gamma", title: "Gamma", symbol: "Γ", unit: "", color: GK.gamma },
  { key: "theta", title: "Theta", symbol: "Θ", unit: "/day", color: GK.theta },
  { key: "vega", title: "Vega", symbol: "ν", unit: "/1%", color: GK.vega },
  { key: "rho", title: "Rho", symbol: "ρ", unit: "/1%", color: GK.rho },
];

export function GreekCurves({ inputs }: { inputs: AppInputs }) {
  const T = inputs.days / 365;

  const { data, current } = useMemo(() => {
    const lo = Math.max(0.4 * Math.min(inputs.S, inputs.K), 0.01);
    const hi = 1.6 * Math.max(inputs.S, inputs.K);
    const n = 120;
    const rows: Row[] = [];
    for (let i = 0; i <= n; i++) {
      const S = lo + ((hi - lo) * i) / n;
      const g = greeks(inputs.type, { S, K: inputs.K, T, r: inputs.r, sigma: inputs.sigma, q: inputs.q });
      rows.push({
        S,
        price: g.price,
        delta: g.delta,
        gamma: g.gamma,
        theta: g.theta / 365,
        vega: g.vega / 100,
        rho: g.rho / 100,
      });
    }
    const gNow = greeks(inputs.type, {
      S: inputs.S,
      K: inputs.K,
      T,
      r: inputs.r,
      sigma: inputs.sigma,
      q: inputs.q,
    });
    const current: Row = {
      S: inputs.S,
      price: gNow.price,
      delta: gNow.delta,
      gamma: gNow.gamma,
      theta: gNow.theta / 365,
      vega: gNow.vega / 100,
      rho: gNow.rho / 100,
    };
    return { data: rows, current };
  }, [inputs.S, inputs.K, T, inputs.r, inputs.sigma, inputs.q, inputs.type]);

  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
      {PANELS.map((p) => (
        <div key={p.key} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-edge px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-0.5" style={{ background: p.color }} />
              <span className="font-serif text-[13px] italic text-faint">{p.symbol}</span>
              <span className="lbl">{p.title}</span>
              {p.unit && <span className="text-[9px] text-faint">{p.unit}</span>}
            </div>
            <span className="tnum text-[11px] font-medium text-txt">{fmt(current[p.key], 4)}</span>
          </div>
          <div className="h-[168px] px-1 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="S"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={CHART.tick}
                  tickFormatter={fmtTick}
                  stroke={CHART.axis}
                  tickLine={false}
                  tickCount={6}
                />
                <YAxis
                  tick={CHART.tick}
                  tickFormatter={fmtTick}
                  stroke={CHART.axis}
                  tickLine={false}
                  width={44}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={<ChartTip dp={4} />}
                  cursor={{ stroke: CHART.faint, strokeDasharray: "3 3" }}
                  isAnimationActive={false}
                />
                <ReferenceLine x={inputs.S} stroke={CHART.faint} strokeDasharray="4 3" />
                <Line
                  type="monotone"
                  dataKey={p.key}
                  name={p.title}
                  stroke={p.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceDot
                  x={current.S}
                  y={current[p.key]}
                  r={3}
                  fill={p.color}
                  stroke={CHART.grid}
                  strokeWidth={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
