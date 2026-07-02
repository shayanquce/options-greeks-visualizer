import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  positionCost,
  positionGreeks,
  positionPayoff,
  positionValue,
  presetStrategies,
  roundStrike,
  type Leg,
  type Market,
} from "../lib/strategies";
import { fmt, fmtSigned, fmtTick } from "../lib/format";
import type { AppInputs } from "./InputsPanel";
import { CHART, ChartTip } from "./chartTheme";
import { IconClose, IconPlus } from "./icons";

/**
 * Multi-leg strategy builder. Legs price off the shared market environment
 * (S, T, r, sigma, q from the inputs panel); the entry cost is struck at the
 * current spot, so the P&L curves show payoff net of premium paid/received.
 */
export function StrategyBuilder({ inputs }: { inputs: AppInputs }) {
  const presets = useMemo(() => presetStrategies(inputs.S), [inputs.S]);
  const [presetName, setPresetName] = useState("Long Straddle");
  const [legs, setLegs] = useState<Leg[]>(() => presetStrategies(inputs.S)[0].legs);

  const mkt: Market = {
    S: inputs.S,
    T: inputs.days / 365,
    r: inputs.r,
    sigma: inputs.sigma,
    q: inputs.q,
  };

  const applyPreset = (name: string) => {
    const p = presetStrategies(inputs.S).find((x) => x.name === name)!;
    setPresetName(name);
    setLegs(p.legs.map((l) => ({ ...l })));
  };

  const patchLeg = (i: number, patch: Partial<Leg>) => {
    setLegs((ls) => ls.map((l, j) => (j === i ? ({ ...l, ...patch } as Leg) : l)));
  };

  const cost = positionCost(legs, mkt);
  const net = positionGreeks(legs, mkt);

  const { data, yMin, yMax } = useMemo(() => {
    const strikes = legs.filter((l) => l.kind === "option").map((l) => l.strike);
    const center = strikes.length ? (Math.min(...strikes) + Math.max(...strikes)) / 2 : inputs.S;
    const span = Math.max(inputs.S, center);
    const lo = Math.max(center - span * 0.55, 0.01);
    const hi = center + span * 0.55;
    const n = 160;
    const data = [];
    let yMin = 0;
    let yMax = 0;
    for (let i = 0; i <= n; i++) {
      const S = lo + ((hi - lo) * i) / n;
      const expiry = positionPayoff(legs, S) - cost;
      const today = positionValue(legs, { ...mkt, S }) - cost;
      data.push({ S, expiry, today });
      yMin = Math.min(yMin, expiry, today);
      yMax = Math.max(yMax, expiry, today);
    }
    return { data, yMin, yMax };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs, cost, inputs.S, inputs.days, inputs.r, inputs.sigma, inputs.q]);

  const zeroOffset = yMax <= 0 ? 0 : yMin >= 0 ? 1 : yMax / (yMax - yMin);
  const desc = presets.find((p) => p.name === presetName)?.description;

  return (
    <div className="space-y-2">
      {/* preset picker */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-edge px-3 py-2.5">
          <span className="lbl mr-1.5">Strategy</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.name)}
              className={`px-2.5 py-1 text-[10px] font-medium ${
                presetName === p.name
                  ? "bg-panel2 text-txt"
                  : "text-dim hover:bg-panel2 hover:text-txt"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        {desc && (
          <p className="border-b border-edge px-3 py-2.5 text-[11px] leading-[1.5] text-dim">{desc}</p>
        )}

        {/* legs table */}
        <table className="w-full">
          <thead>
            <tr className="text-left text-[10px] text-faint">
              <th className="px-3 py-1.5 font-semibold">Leg</th>
              <th className="px-2 py-1.5 font-semibold">Type</th>
              <th className="px-2 py-1.5 font-semibold">Strike</th>
              <th className="px-2 py-1.5 font-semibold">Qty</th>
              <th className="px-2 py-1.5 text-right font-semibold">Unit Px</th>
              <th className="px-3 py-1.5 text-right font-semibold" />
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, i) => (
              <tr key={i} className="border-t border-edge text-[11px]">
                <td className="tnum px-3 py-1.5 text-dim">{i + 1}</td>
                <td className="px-2 py-1.5">
                  {leg.kind === "stock" ? (
                    <span className="font-mono text-[10px] uppercase text-info">stock</span>
                  ) : (
                    <select
                      value={leg.type}
                      onChange={(e) => patchLeg(i, { type: e.target.value as "call" | "put" })}
                      className="border border-edge bg-panel2 px-1 py-0.5 font-mono text-[10px] uppercase text-txt outline-none focus:border-edge2"
                    >
                      <option value="call">call</option>
                      <option value="put">put</option>
                    </select>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {leg.kind === "option" ? (
                    <input
                      type="number"
                      value={leg.strike}
                      step={roundStrike(inputs.S) < 100 ? 2.5 : 5}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isFinite(v) && v > 0) patchLeg(i, { strike: v });
                      }}
                      className="tnum w-[72px] border border-edge bg-panel2 px-1.5 py-0.5 text-right text-txt outline-none focus:border-edge2"
                    />
                  ) : (
                    <span className="tnum text-faint">entry {fmt(leg.entry, 2)}</span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={leg.qty}
                    step={1}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v)) patchLeg(i, { qty: v });
                    }}
                    className={`tnum w-[56px] border border-edge bg-panel2 px-1.5 py-0.5 text-right outline-none focus:border-edge2 ${
                      leg.qty >= 0 ? "text-up" : "text-down"
                    }`}
                  />
                </td>
                <td className="tnum px-2 py-1.5 text-right text-dim">
                  {leg.kind === "stock"
                    ? fmt(mkt.S, 2)
                    : fmt(
                        Math.abs(
                          positionValue([{ ...leg, qty: 1 }], mkt),
                        ),
                        4,
                      )}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    onClick={() => setLegs((ls) => ls.filter((_, j) => j !== i))}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-faint transition-colors hover:bg-down/10 hover:text-down"
                    title="remove leg"
                  >
                    <IconClose width={11} height={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 border-t border-edge px-3 py-2">
          <button
            onClick={() =>
              setLegs((ls) => [
                ...ls,
                { kind: "option", type: "call", strike: roundStrike(inputs.S), qty: 1 },
              ])
            }
            className="flex items-center gap-1 border border-edge2 py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-dim hover:border-edge2 hover:text-txt"
          >
            <IconPlus width={11} height={11} /> option
          </button>
          <button
            onClick={() => setLegs((ls) => [...ls, { kind: "stock", qty: 1, entry: inputs.S }])}
            className="flex items-center gap-1 border border-edge2 py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-dim hover:border-edge2 hover:text-txt"
          >
            <IconPlus width={11} height={11} /> stock
          </button>
          <span className="tnum ml-auto text-[11px] text-dim">
            net {cost >= 0 ? "debit" : "credit"}{" "}
            <span className={`font-medium ${cost >= 0 ? "text-down" : "text-up"}`}>{fmt(Math.abs(cost), 4)}</span>
          </span>
        </div>
      </div>

      {/* net greeks */}
      <div className="card flex divide-x divide-edge">
        {(
          [
            ["Net Δ", net.delta, 4],
            ["Net Γ", net.gamma, 4],
            ["Net Θ/day", net.theta / 365, 4],
            ["Net ν/1%", net.vega / 100, 4],
            ["Net ρ/1%", net.rho / 100, 4],
            ["Net Vanna/1%", net.vanna / 100, 4],
            ["Net Vomma/1%", net.vomma / 100, 4],
          ] as const
        ).map(([label, v, dp]) => (
          <div key={label} className="flex-1 px-3 py-2.5">
            <div className="lbl text-[10px]">{label}</div>
            <div
              className={`tnum mt-1 text-[13px] font-medium ${
                v > 1e-12 ? "text-up" : v < -1e-12 ? "text-down" : "text-txt"
              }`}
            >
              {fmtSigned(v, dp)}
            </div>
          </div>
        ))}
      </div>

      {/* combined payoff */}
      <div className="card">
        <div className="flex items-center gap-4 border-b border-edge px-3 py-2.5">
          <span className="lbl">Position P&amp;L</span>
          <span className="flex items-center gap-1.5 text-[10px] text-dim">
            <span className="inline-block h-[2px] w-4 bg-accent" /> at expiry
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-dim">
            <span
              className="inline-block h-[2px] w-4"
              style={{
                background: `repeating-linear-gradient(90deg, ${CHART.info} 0 4px, transparent 4px 7px)`,
              }}
            />
            today (t = {inputs.days}d)
          </span>
        </div>
        <div className="h-[360px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="stratFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={0} stopColor={CHART.up} stopOpacity={0.2} />
                  <stop offset={zeroOffset} stopColor={CHART.up} stopOpacity={0.04} />
                  <stop offset={zeroOffset} stopColor={CHART.down} stopOpacity={0.04} />
                  <stop offset={1} stopColor={CHART.down} stopOpacity={0.2} />
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
              />
              <YAxis tick={CHART.tick} tickFormatter={fmtTick} stroke={CHART.axis} tickLine={false} width={52} />
              <Tooltip
                content={<ChartTip dp={4} />}
                cursor={{ stroke: CHART.faint, strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              <ReferenceLine y={0} stroke={CHART.axis} />
              {legs
                .filter((l): l is Extract<Leg, { kind: "option" }> => l.kind === "option")
                .map((l, i) => (
                  <ReferenceLine
                    key={i}
                    x={l.strike}
                    stroke={CHART.faint}
                    strokeDasharray="4 3"
                    label={{ value: `K${fmt(l.strike, 0)}`, fill: CHART.faint, fontSize: 9, position: "insideTopLeft" }}
                  />
                ))}
              <ReferenceLine x={inputs.S} stroke={CHART.dim} strokeDasharray="2 3" label={{ value: "S", fill: CHART.dim, fontSize: 10, position: "insideTopRight" }} />
              <Area
                type="monotone"
                dataKey="expiry"
                name="P&L at expiry"
                stroke="none"
                fill="url(#stratFill)"
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
