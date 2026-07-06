import { useMemo, useRef, useState } from "react";
import { greeks, type Greeks } from "../lib/blackScholes";
import { divColor, legendGradient, seqColor } from "../lib/colorScale";
import { fmt, fmtTick } from "../lib/format";
import type { AppInputs } from "./InputsPanel";
import { Surface3D } from "./Surface3D";

type GreekKey = keyof Greeks;

const GREEK_OPTS: { key: GreekKey; label: string; scale: (x: number) => number; unit: string }[] = [
  { key: "gamma", label: "Gamma Γ", scale: (x) => x, unit: "" },
  { key: "delta", label: "Delta Δ", scale: (x) => x, unit: "" },
  { key: "theta", label: "Theta Θ", scale: (x) => x / 365, unit: "/day" },
  { key: "vega", label: "Vega ν", scale: (x) => x / 100, unit: "/1%" },
  { key: "rho", label: "Rho ρ", scale: (x) => x / 100, unit: "/1%" },
  { key: "vanna", label: "Vanna", scale: (x) => x / 100, unit: "/1%" },
  { key: "charm", label: "Charm", scale: (x) => x / 365, unit: "/day" },
  { key: "vomma", label: "Vomma", scale: (x) => x / 100, unit: "/1%" },
  { key: "price", label: "Value V", scale: (x) => x, unit: "" },
];

const COLS = 72; // time axis
const ROWS = 48; // spot axis
const CELL_W = 13;
const CELL_H = 9;
const ML = 52; // left margin (spot labels)
const MB = 26; // bottom margin (day labels)
const MT = 8;
const MR = 8;

/**
 * Heatmap of a chosen Greek over (time to expiry) x (spot), the classic
 * "gamma ridge" picture: watch gamma concentrate around the strike as
 * expiry approaches. Rendered as raw SVG rects for full control; a
 * crosshair marks the live (S, T) from the inputs panel.
 */
export function GreekSurface({ inputs }: { inputs: AppInputs }) {
  const [sel, setSel] = useState<GreekKey>("gamma");
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [hover, setHover] = useState<{ c: number; r: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const opt = GREEK_OPTS.find((o) => o.key === sel)!;

  const { grid, vMin, vMax, spots, dayArr, diverging } = useMemo(() => {
    const maxDays = Math.max(inputs.days * 1.5, 90);
    const sLo = 0.55 * inputs.K;
    const sHi = 1.45 * inputs.K;
    const dayArr = Array.from({ length: COLS }, (_, c) => 1 + ((maxDays - 1) * c) / (COLS - 1));
    // row 0 at top = highest spot (price axis increases upward)
    const spots = Array.from({ length: ROWS }, (_, r) => sHi - ((sHi - sLo) * r) / (ROWS - 1));
    const grid: number[][] = [];
    let vMin = Infinity;
    let vMax = -Infinity;
    for (let r = 0; r < ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < COLS; c++) {
        const g = greeks(inputs.type, {
          S: spots[r],
          K: inputs.K,
          T: dayArr[c] / 365,
          r: inputs.r,
          sigma: inputs.sigma,
          q: inputs.q,
        });
        const v = opt.scale(g[sel]);
        row.push(v);
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
      grid.push(row);
    }
    const diverging = vMin < 0 && vMax > 0;
    return { grid, vMin, vMax, spots, dayArr, diverging };
  }, [inputs.K, inputs.days, inputs.r, inputs.sigma, inputs.q, inputs.type, sel, opt]);

  const color = (v: number): string => {
    if (diverging) {
      const m = Math.max(Math.abs(vMin), Math.abs(vMax));
      return divColor(m === 0 ? 0 : v / m);
    }
    return seqColor(vMax === vMin ? 0.5 : (v - vMin) / (vMax - vMin));
  };

  const W = ML + COLS * CELL_W + MR;
  const H = MT + ROWS * CELL_H + MB;

  // live crosshair position
  const maxDay = dayArr[COLS - 1];
  const sHi = spots[0];
  const sLo = spots[ROWS - 1];
  const cx = ML + ((inputs.days - 1) / (maxDay - 1)) * (COLS * CELL_W);
  const cy = MT + ((sHi - inputs.S) / (sHi - sLo)) * (ROWS * CELL_H);
  const inRange = inputs.S >= sLo && inputs.S <= sHi && inputs.days <= maxDay;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    // map screen px -> viewBox coords (SVG scales with container width)
    const x = ((e.clientX - rect.left) / rect.width) * W - ML;
    const y = ((e.clientY - rect.top) / rect.height) * H - MT;
    const c = Math.floor(x / CELL_W);
    const r = Math.floor(y / CELL_H);
    setHover(c >= 0 && c < COLS && r >= 0 && r < ROWS ? { c, r } : null);
  };

  const hv = hover ? grid[hover.r][hover.c] : null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 border-b border-edge px-3 py-2.5">
        <span className="lbl mr-1 shrink-0">Surface · Spot × Time</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {GREEK_OPTS.map((o) => {
            const on = sel === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setSel(o.key)}
                className={`px-2 py-0.5 font-mono text-[10px] ${
                  on ? "bg-panel2 text-txt" : "text-dim hover:bg-panel2 hover:text-txt"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {/* 2D / 3D view toggle: a prominent, labeled segmented control */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-faint">View</span>
          <div
            className="flex overflow-hidden rounded-[3px] border border-edge2"
            role="group"
            aria-label="surface view mode"
          >
            {(["2d", "3d"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                title={m === "3d" ? "Rotatable 3D surface" : "Flat 2D heatmap"}
                className={`px-3 py-1 font-mono text-[11px] font-semibold uppercase ${
                  mode === m ? "bg-accent text-panel" : "bg-panel text-dim hover:bg-panel2 hover:text-txt"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "3d" && (
        <div className="p-2">
          <Surface3D
            grid={grid}
            spots={spots}
            dayArr={dayArr}
            vMin={vMin}
            vMax={vMax}
            diverging={diverging}
            label={opt.label}
            unit={opt.unit}
            liveS={inputs.S}
            liveDays={inputs.days}
            strike={inputs.K}
          />
        </div>
      )}

      {mode === "2d" && (
      <div className="relative p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {grid.map((row, r) =>
            row.map((v, c) => (
              <rect
                key={r * COLS + c}
                x={ML + c * CELL_W}
                y={MT + r * CELL_H}
                width={CELL_W + 0.5}
                height={CELL_H + 0.5}
                fill={color(v)}
                style={{ transition: "fill 220ms ease-out" }}
              />
            )),
          )}

          {/* spot axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const r = Math.round(f * (ROWS - 1));
            return (
              <text
                key={f}
                x={ML - 6}
                y={MT + r * CELL_H + CELL_H / 2 + 3}
                textAnchor="end"
                fontSize={9}
                fontFamily="IBM Plex Mono, monospace"
                fill="#7d7460"
              >
                {fmtTick(spots[r])}
              </text>
            );
          })}
          {/* time axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const c = Math.round(f * (COLS - 1));
            return (
              <text
                key={f}
                x={ML + c * CELL_W + CELL_W / 2}
                y={MT + ROWS * CELL_H + 14}
                textAnchor="middle"
                fontSize={9}
                fontFamily="IBM Plex Mono, monospace"
                fill="#7d7460"
              >
                {Math.round(dayArr[c])}d
              </text>
            );
          })}
          <text
            x={ML + (COLS * CELL_W) / 2}
            y={H - 2}
            textAnchor="middle"
            fontSize={9}
            fill="#978e79"
          >
            time to expiry (calendar days)
          </text>

          {/* strike guide */}
          {(() => {
            const ky = MT + ((sHi - inputs.K) / (sHi - sLo)) * (ROWS * CELL_H);
            return (
              <g>
                <line x1={ML} x2={ML + COLS * CELL_W} y1={ky} y2={ky} stroke="#211d12" strokeOpacity={0.35} strokeDasharray="2 4" />
                <text x={ML + COLS * CELL_W - 4} y={ky - 3} textAnchor="end" fontSize={9} fill="#5f584a" fontFamily="IBM Plex Mono, monospace">
                  K {fmt(inputs.K, 0)}
                </text>
              </g>
            );
          })()}

          {/* live (S, T) crosshair */}
          {inRange && (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={MT} y2={MT + ROWS * CELL_H} stroke="#211d12" strokeOpacity={0.35} strokeWidth={0.75} />
              <line x1={ML} x2={ML + COLS * CELL_W} y1={cy} y2={cy} stroke="#211d12" strokeOpacity={0.35} strokeWidth={0.75} />
              <circle cx={cx} cy={cy} r={3.5} fill="none" stroke="#a4502a" strokeWidth={1.5} />
            </g>
          )}

          {/* hover cell outline */}
          {hover && (
            <rect
              x={ML + hover.c * CELL_W}
              y={MT + hover.r * CELL_H}
              width={CELL_W}
              height={CELL_H}
              fill="none"
              stroke="#211d12"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
        </svg>

        {/* hover readout */}
        <div className="pointer-events-none absolute right-4 top-3 border border-edge2 bg-panel px-2.5 py-1.5">
          {hover && hv !== null ? (
            <div className="tnum text-[11px] leading-5">
              <div className="text-dim">
                S <span className="text-txt">{fmt(spots[hover.r], 2)}</span>
                <span className="mx-1.5 text-faint">·</span>T{" "}
                <span className="text-txt">{Math.round(dayArr[hover.c])}d</span>
              </div>
              <div>
                <span className="text-dim">{opt.label}</span>{" "}
                <span className="text-txt">{fmt(hv, 5)}</span>
                {opt.unit && <span className="ml-1 text-[9px] text-faint">{opt.unit}</span>}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-faint">hover for values · ◯ = live inputs</div>
          )}
        </div>
      </div>
      )}

      {/* legend */}
      <div className="flex items-center gap-3 border-t border-edge px-3 py-2">
        <span className="tnum text-[10px] text-dim">{fmt(diverging ? -Math.max(Math.abs(vMin), Math.abs(vMax)) : vMin, 4)}</span>
        <div className="h-1.5 flex-1" style={{ background: legendGradient(diverging) }} />
        <span className="tnum text-[10px] text-dim">{fmt(diverging ? Math.max(Math.abs(vMin), Math.abs(vMax)) : vMax, 4)}</span>
        <span className="ml-2 text-[10px] text-faint">
          {opt.label}
          {opt.unit && ` (${opt.unit})`} · σ, r, q held at panel values
        </span>
      </div>
    </div>
  );
}
