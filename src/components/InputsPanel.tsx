import { useMemo, useState } from "react";
import { impliedVol, type OptionType } from "../lib/blackScholes";
import { fmt, fmtPct } from "../lib/format";
import { IconTarget } from "./icons";

export interface AppInputs {
  S: number;
  K: number;
  days: number; // calendar days to expiry
  r: number; // decimal
  sigma: number; // decimal
  q: number; // decimal
  type: OptionType;
}

interface SliderRowProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  dp: number;
  scale?: number; // display multiplier, e.g. 100 for rates shown in %
  unit?: string;
  onChange: (v: number) => void;
}

function SliderRow({ label, symbol, value, min, max, step, dp, scale = 1, unit, onChange }: SliderRowProps) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? fmt(value * scale, dp);
  const pct = ((value - min) / (max - min)) * 100;

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) onChange(Math.min(Math.max(parsed / scale, min), max));
    setText(null);
  };

  return (
    <div className="group px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-panel2 font-mono text-[10px] text-accent/90">
            {symbol}
          </span>
          <span className="text-[11px] font-medium text-txt">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 rounded border border-edge bg-panel2 px-1.5 py-0.5 transition-colors focus-within:border-accent/50">
          <input
            className="tnum w-[62px] bg-transparent text-right text-[12px] text-accent outline-none"
            type="number"
            value={shown.replace(/,/g, "")}
            step={step * scale}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
          />
          {unit && <span className="w-3 text-[10px] text-faint">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        className="mt-2"
        style={{ ["--pct" as string]: `${pct}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          setText(null);
          onChange(parseFloat(e.target.value));
        }}
      />
    </div>
  );
}

interface Props {
  inputs: AppInputs;
  onChange: (patch: Partial<AppInputs>) => void;
}

export function InputsPanel({ inputs, onChange }: Props) {
  const [mktPrice, setMktPrice] = useState<string>("");

  const iv = useMemo(() => {
    const p = parseFloat(mktPrice);
    if (!Number.isFinite(p) || p <= 0) return null;
    return impliedVol(inputs.type, p, {
      S: inputs.S,
      K: inputs.K,
      T: inputs.days / 365,
      r: inputs.r,
      q: inputs.q,
    });
  }, [mktPrice, inputs.type, inputs.S, inputs.K, inputs.days, inputs.r, inputs.q]);

  return (
    <div className="flex h-full flex-col">
      {/* Call / Put segmented control */}
      <div className="p-3.5 pb-2">
        <div className="lbl mb-2">Contract</div>
        <div className="relative flex rounded-md border border-edge bg-panel2 p-0.5">
          <span
            className={`absolute inset-y-0.5 w-[calc(50%-2px)] rounded-[5px] transition-all duration-200 ease-out ${
              inputs.type === "call"
                ? "left-0.5 bg-up/15 shadow-[inset_0_0_0_1px] shadow-up/40"
                : "left-[calc(50%+0px)] bg-down/15 shadow-[inset_0_0_0_1px] shadow-down/40"
            }`}
          />
          {(["call", "put"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ type: t })}
              className={`relative z-10 flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                inputs.type === t ? (t === "call" ? "text-up" : "text-down") : "text-dim hover:text-txt"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 divide-y divide-edge overflow-y-auto border-y border-edge">
        <SliderRow label="Spot" symbol="S" value={inputs.S} min={1} max={400} step={0.5} dp={2} onChange={(S) => onChange({ S })} />
        <SliderRow label="Strike" symbol="K" value={inputs.K} min={1} max={400} step={0.5} dp={2} onChange={(K) => onChange({ K })} />
        <SliderRow label="Expiry" symbol="T" value={inputs.days} min={1} max={730} step={1} dp={0} unit="d" onChange={(days) => onChange({ days: Math.round(days) })} />
        <SliderRow label="Volatility" symbol="σ" value={inputs.sigma} min={0.01} max={1.5} step={0.005} dp={1} scale={100} unit="%" onChange={(sigma) => onChange({ sigma })} />
        <SliderRow label="Risk-free" symbol="r" value={inputs.r} min={0} max={0.12} step={0.0005} dp={2} scale={100} unit="%" onChange={(r) => onChange({ r })} />
        <SliderRow label="Div Yield" symbol="q" value={inputs.q} min={0} max={0.08} step={0.0005} dp={2} scale={100} unit="%" onChange={(q) => onChange({ q })} />
      </div>

      {/* Implied vol solver */}
      <div className="p-3.5">
        <div className="mb-2 flex items-center gap-1.5">
          <IconTarget className="text-accent/80" width={12} height={12} />
          <span className="lbl">Implied Vol Solver</span>
        </div>
        <div className="flex items-stretch gap-1.5">
          <div className="flex flex-1 items-center gap-1.5 rounded-md border border-edge bg-panel2 px-2 transition-colors focus-within:border-accent/50">
            <span className="text-[11px] text-faint">$</span>
            <input
              className="tnum w-full bg-transparent py-1.5 text-[12px] text-txt outline-none placeholder:text-faint"
              type="number"
              placeholder="market price"
              value={mktPrice}
              onChange={(e) => setMktPrice(e.target.value)}
            />
          </div>
          <button
            disabled={iv === null}
            onClick={() => iv !== null && onChange({ sigma: iv })}
            className="rounded-md border border-edge2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-dim transition-colors enabled:hover:border-accent/60 enabled:hover:text-accent disabled:opacity-30"
          >
            → σ
          </button>
        </div>
        <div className="mt-2 flex h-4 items-center">
          {mktPrice === "" ? (
            <span className="text-[11px] text-faint">Enter a market price to back out σ</span>
          ) : iv === null ? (
            <span className="text-[11px] font-medium text-down">No solution: price outside no-arb bounds</span>
          ) : (
            <span className="tnum text-[12px] text-accent">σ implied = {fmtPct(iv, 2)}</span>
          )}
        </div>
        <p className="mt-2 border-t border-edge pt-2 text-[10px] leading-[1.5] text-faint">
          Newton-Raphson on BSM vega with a bisection safeguard.
        </p>
      </div>
    </div>
  );
}
