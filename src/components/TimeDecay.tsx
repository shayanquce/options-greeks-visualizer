import { useEffect, useMemo, useRef, useState } from "react";
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
import { greeks, intrinsic, price } from "../lib/blackScholes";
import { fmt, fmtTick } from "../lib/format";
import type { AppInputs } from "./InputsPanel";
import { CHART, ChartTip } from "./chartTheme";
import { IconPause, IconPlay, IconReset } from "./icons";

/**
 * Theta decay, animated. Left: the value curve V(S) collapsing onto the
 * intrinsic hockey stick as days remaining -> 0. Right: the decay path
 * V(t) at the current spot, the classic accelerating ATM time-value burn.
 */
export function TimeDecay({ inputs }: { inputs: AppInputs }) {
  const [day, setDay] = useState(inputs.days);
  const [playing, setPlaying] = useState(false);
  const dayRef = useRef(day);
  dayRef.current = day;

  // Re-anchor when the user changes expiry in the panel
  useEffect(() => {
    setDay(inputs.days);
    setPlaying(false);
  }, [inputs.days]);

  // Auto-play: sweep from the panel expiry down to 0 in ~6 seconds
  useEffect(() => {
    if (!playing) return;
    const step = Math.max(inputs.days / 240, 0.05);
    const id = setInterval(() => {
      const next = dayRef.current - step;
      if (next <= 0) {
        setDay(0);
        setPlaying(false);
      } else {
        setDay(next);
      }
    }, 25);
    return () => clearInterval(id);
  }, [playing, inputs.days]);

  const env = { K: inputs.K, r: inputs.r, sigma: inputs.sigma, q: inputs.q };

  const curveData = useMemo(() => {
    const lo = Math.max(0.4 * Math.min(inputs.S, inputs.K), 0.01);
    const hi = 1.6 * Math.max(inputs.S, inputs.K);
    const n = 120;
    const rows = [];
    for (let i = 0; i <= n; i++) {
      const S = lo + ((hi - lo) * i) / n;
      rows.push({
        S,
        value: price(inputs.type, { ...env, S, T: day / 365 }),
        start: price(inputs.type, { ...env, S, T: inputs.days / 365 }),
        intrinsic: intrinsic(inputs.type, S, inputs.K),
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.S, inputs.K, inputs.r, inputs.sigma, inputs.q, inputs.type, inputs.days, day]);

  const decayData = useMemo(() => {
    const n = 160;
    const rows = [];
    for (let i = 0; i <= n; i++) {
      const d = (inputs.days * i) / n;
      rows.push({
        d,
        value: price(inputs.type, { ...env, S: inputs.S, T: d / 365 }),
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.S, inputs.K, inputs.r, inputs.sigma, inputs.q, inputs.type, inputs.days]);

  const nowVal = price(inputs.type, { ...env, S: inputs.S, T: day / 365 });
  const nowIntrinsic = intrinsic(inputs.type, inputs.S, inputs.K);
  const nowTheta = greeks(inputs.type, { ...env, S: inputs.S, T: day / 365 }).theta / 365;

  return (
    <div className="card">
      {/* transport controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-edge px-3 py-2.5">
        <span className="lbl">Time Decay</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (day <= 0) setDay(inputs.days);
              setPlaying((p) => !p);
            }}
            className="flex h-7 w-7 items-center justify-center border border-edge2 text-txt hover:border-edge2 hover:bg-panel2"
            title={playing ? "pause" : "play"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setDay(inputs.days);
            }}
            className="flex h-7 w-7 items-center justify-center border border-edge2 text-dim hover:border-edge2 hover:text-txt hover:bg-panel2"
            title="reset"
          >
            <IconReset />
          </button>
        </div>
        <input
          type="range"
          className="max-w-[220px] flex-1"
          style={{ ["--pct" as string]: `${inputs.days ? (day / inputs.days) * 100 : 0}%` }}
          min={0}
          max={inputs.days}
          step={0.25}
          value={day}
          onChange={(e) => {
            setPlaying(false);
            setDay(parseFloat(e.target.value));
          }}
        />
        <span className="tnum text-[11px] text-dim">
          <span className="text-txt">{fmt(day, 1)}</span> / {inputs.days}d left
        </span>
        <div className="tnum ml-auto flex items-center gap-2 text-[11px]">
          <span className="border border-edge bg-panel2 px-2 py-1 text-faint">
            value <span className="text-txt">{fmt(nowVal, 4)}</span>
          </span>
          <span className="border border-edge bg-panel2 px-2 py-1 text-faint">
            time val <span className="text-info">{fmt(Math.max(nowVal - nowIntrinsic, 0), 4)}</span>
          </span>
          <span className="border border-edge bg-panel2 px-2 py-1 text-faint">
            Θ/d <span className={nowTheta < 0 ? "text-down" : "text-up"}>{fmt(nowTheta, 4)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 p-2 xl:grid-cols-2">
        {/* V(S) collapsing to intrinsic */}
        <div className="h-[340px]">
          <div className="px-2 pb-1 text-[10px] text-faint">
            value vs spot: amber curve collapses onto intrinsic as t approaches expiry
          </div>
          <ResponsiveContainer width="100%" height="92%">
            <LineChart data={curveData} margin={{ top: 4, right: 12, bottom: 0, left: -4 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="S"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={CHART.tick}
                tickFormatter={fmtTick}
                stroke={CHART.axis}
                tickLine={false}
                tickCount={8}
              />
              <YAxis tick={CHART.tick} tickFormatter={fmtTick} stroke={CHART.axis} tickLine={false} width={46} />
              <Tooltip
                content={<ChartTip dp={4} />}
                cursor={{ stroke: CHART.faint, strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="intrinsic"
                name="intrinsic"
                stroke={CHART.faint}
                strokeWidth={1.2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="start"
                name={`t = ${inputs.days}d`}
                stroke={CHART.info}
                strokeWidth={1}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={`t = ${fmt(day, 1)}d`}
                stroke={CHART.accent}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine x={inputs.S} stroke={CHART.faint} strokeDasharray="4 3" />
              <ReferenceDot x={inputs.S} y={nowVal} r={3} fill={CHART.accent} stroke={CHART.grid} strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* V(t) decay path at current spot */}
        <div className="h-[340px]">
          <div className="px-2 pb-1 text-[10px] text-faint">
            value vs days remaining at S = {fmt(inputs.S, 2)}: theta bleed accelerates near expiry
          </div>
          <ResponsiveContainer width="100%" height="92%">
            <LineChart data={decayData} margin={{ top: 4, right: 12, bottom: 0, left: -4 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="d"
                type="number"
                reversed
                domain={[0, inputs.days]}
                tick={CHART.tick}
                tickFormatter={(d: number) => `${Math.round(d)}d`}
                stroke={CHART.axis}
                tickLine={false}
                tickCount={8}
              />
              <YAxis tick={CHART.tick} tickFormatter={fmtTick} stroke={CHART.axis} tickLine={false} width={46} />
              <Tooltip
                content={<ChartTip labelPrefix="t =" dp={4} />}
                cursor={{ stroke: CHART.faint, strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              <ReferenceLine y={nowIntrinsic} stroke={CHART.faint} strokeDasharray="2 4" label={{ value: "intrinsic", fill: CHART.faint, fontSize: 9, position: "insideBottomLeft" }} />
              <Line
                type="monotone"
                dataKey="value"
                name="option value"
                stroke={CHART.accent}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceDot x={day} y={nowVal} r={3} fill={CHART.accent} stroke={CHART.grid} strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
