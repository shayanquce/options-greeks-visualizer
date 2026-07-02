import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intrinsic, price } from "../lib/blackScholes";
import { fmt, fmtTick } from "../lib/format";
import type { AppInputs } from "./InputsPanel";
import { CHART, ChartTip } from "./chartTheme";

const TONE: Record<string, string> = { accent: "text-accent", txt: "text-txt", down: "text-down", up: "text-up" };

function Stat({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE }) {
  return (
    <div className="flex items-baseline gap-1.5 border border-edge bg-panel2 px-2 py-0.5">
      <span className="text-[10px] text-faint">{label}</span>
      <span className={`tnum text-[11px] font-medium ${TONE[tone]}`}>{value}</span>
    </div>
  );
}

/**
 * P&L diagram for a long position in one contract, netted against the
 * current theoretical premium:
 *
 *   P&L at expiry  = payoff(S_T) - premium
 *   P&L today      = V(S, T) - premium   (the smooth "time value" curve)
 *
 * Profit/loss zones are shaded via a gradient split exactly at P&L = 0.
 */
export function PayoffChart({ inputs }: { inputs: AppInputs }) {
  const T = inputs.days / 365;

  const { data, premium, breakeven, yMin, yMax } = useMemo(() => {
    const env = { K: inputs.K, T, r: inputs.r, sigma: inputs.sigma, q: inputs.q };
    const premium = price(inputs.type, { ...env, S: inputs.S });
    const lo = Math.max(0.4 * Math.min(inputs.S, inputs.K), 0.01);
    const hi = 1.6 * Math.max(inputs.S, inputs.K);
    const n = 140;
    const data = [];
    let yMin = 0;
    let yMax = 0;
    for (let i = 0; i <= n; i++) {
      const S = lo + ((hi - lo) * i) / n;
      const expiry = intrinsic(inputs.type, S, inputs.K) - premium;
      const today = price(inputs.type, { ...env, S }) - premium;
      data.push({ S, expiry, today });
      yMin = Math.min(yMin, expiry, today);
      yMax = Math.max(yMax, expiry, today);
    }
    const breakeven = inputs.type === "call" ? inputs.K + premium : inputs.K - premium;
    return { data, premium, breakeven, yMin, yMax };
  }, [inputs.S, inputs.K, T, inputs.r, inputs.sigma, inputs.q, inputs.type]);

  // Gradient offset where P&L crosses zero on the y-axis (top = yMax).
  const zeroOffset = yMax <= 0 ? 0 : yMin >= 0 ? 1 : yMax / (yMax - yMin);

  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-edge px-3 py-2.5">
        <span className="lbl mr-1">
          P&amp;L · Long 1 <span className={inputs.type === "call" ? "text-up" : "text-down"}>{inputs.type}</span>
        </span>
        <div className="flex items-center gap-2">
          <Stat label="Premium" value={fmt(premium, 4)} tone="accent" />
          <Stat label="Breakeven" value={fmt(breakeven, 2)} tone="txt" />
          <Stat label="Max Loss" value={fmt(-premium, 4)} tone="down" />
        </div>
        <span className="ml-auto flex items-center gap-3 text-[10px] text-dim">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 rounded-full bg-accent" /> at expiry
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-[2px] w-4"
              style={{ background: `repeating-linear-gradient(90deg, ${CHART.info} 0 4px, transparent 4px 7px)` }}
            />
            today · {inputs.days}d
          </span>
        </span>
      </div>
      <div className="h-[420px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={CHART.up} stopOpacity={0.28} />
                <stop offset={zeroOffset} stopColor={CHART.up} stopOpacity={0.03} />
                <stop offset={zeroOffset} stopColor={CHART.down} stopOpacity={0.03} />
                <stop offset={1} stopColor={CHART.down} stopOpacity={0.28} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="S"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={CHART.tick}
              tickFormatter={fmtTick}
              stroke={CHART.axis}
              tickLine={false}
              tickCount={10}
              label={{
                value: "spot at expiry",
                position: "insideBottomRight",
                offset: -2,
                fill: CHART.faint,
                fontSize: 10,
              }}
            />
            <YAxis
              tick={CHART.tick}
              tickFormatter={fmtTick}
              stroke={CHART.axis}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<ChartTip dp={4} />}
              cursor={{ stroke: CHART.faint, strokeDasharray: "3 3" }}
              isAnimationActive={false}
            />
            <ReferenceLine y={0} stroke={CHART.axis} />
            <ReferenceLine
              x={inputs.K}
              stroke={CHART.faint}
              strokeDasharray="4 3"
              label={{ value: `K ${fmt(inputs.K, 0)}`, fill: CHART.dim, fontSize: 10, position: "insideTopLeft" }}
            />
            <ReferenceLine
              x={breakeven}
              stroke={CHART.dim}
              strokeDasharray="2 3"
              label={{ value: `BE ${fmt(breakeven, 1)}`, fill: CHART.dim, fontSize: 10, position: "insideTopRight" }}
            />
            <Area
              type="monotone"
              dataKey="expiry"
              name="P&L at expiry"
              stroke="none"
              fill="url(#pnlFill)"
              baseValue={0}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="expiry"
              name="P&L at expiry"
              stroke={CHART.accent}
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="today"
              name="P&L today"
              stroke={CHART.info}
              strokeWidth={1.4}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceLine x={inputs.S} stroke={CHART.faint} strokeDasharray="4 3" />
            <ReferenceDot x={inputs.S} y={0} r={3} fill={CHART.info} stroke={CHART.grid} strokeWidth={1} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
