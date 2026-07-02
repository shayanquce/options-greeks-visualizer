import { useMemo, useState } from "react";
import { impliedVol, type OptionType } from "../lib/blackScholes";
import { fmt, fmtPct } from "../lib/format";
import { IconTarget } from "./icons";

export interface AppInputs {
  S: number;
  K: number;
  days: number;
  r: number;
  sigma: number;
  q: number;
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
  scale?: number;
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
    <div className="px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] text-faint">{symbol}</span>
          <span className="text-[11px] text-txt">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 border border-edge bg-term px-1.5 py-0.5 focus-within:border-edge2">
          <input
            className="tnum w-[58px] bg-transparent text-right text-[11px] text-txt outline-none"
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
        className="mt-1.5"
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
      <div className="p-3 pb-2">
        <div className="lbl mb-1.5">Contract</div>
        <div className="flex border border-edge">
          {(["call", "put"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ type: t })}
              className={`flex-1 py-1.5 text-[11px] font-medium ${
                inputs.type === t
                  ? t === "call"
                    ? "bg-up/10 text-up"
                    : "bg-down/10 text-down"
                  : "bg-panel2 text-dim hover:text-txt"
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
        <SliderRow label="Div yield" symbol="q" value={inputs.q} min={0} max={0.08} step={0.0005} dp={2} scale={100} unit="%" onChange={(q) => onChange({ q })} />
      </div>

      <div className="p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <IconTarget className="text-faint" width={12} height={12} />
          <span className="lbl">Implied vol</span>
        </div>
        <div className="flex items-stretch gap-1">
          <div className="flex flex-1 items-center gap-1 border border-edge bg-term px-2 focus-within:border-edge2">
            <span className="text-[11px] text-faint">$</span>
            <input
              className="tnum w-full bg-transparent py-1.5 text-[11px] text-txt outline-none placeholder:text-faint"
              type="number"
              placeholder="market price"
              value={mktPrice}
              onChange={(e) => setMktPrice(e.target.value)}
            />
          </div>
          <button
            disabled={iv === null}
            onClick={() => iv !== null && onChange({ sigma: iv })}
            className="border border-edge px-2 text-[10px] font-medium text-dim enabled:hover:border-edge2 enabled:hover:text-txt disabled:opacity-30"
          >
            → σ
          </button>
        </div>
        <div className="mt-1.5 flex h-4 items-center">
          {mktPrice === "" ? (
            <span className="text-[10px] text-faint">Enter market price to solve for σ</span>
          ) : iv === null ? (
            <span className="text-[10px] text-down">No solution within no-arb bounds</span>
          ) : (
            <span className="tnum text-[11px] text-txt">σ = {fmtPct(iv, 2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
