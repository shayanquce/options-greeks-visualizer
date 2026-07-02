import { GK } from "./chartTheme";

interface Entry {
  symbol: string;
  name: string;
  formula: string;
  order: "First" | "Second";
  color: string;
  def: string;
}

const ENTRIES: Entry[] = [
  {
    symbol: "Δ",
    name: "Delta",
    formula: "dV / dS",
    order: "First",
    color: GK.delta,
    def: "Change in option value per $1 move in the underlying. Roughly the equivalent share exposure, and the hedge ratio for a delta-neutral position.",
  },
  {
    symbol: "Γ",
    name: "Gamma",
    formula: "d²V / dS²  =  dΔ / dS",
    order: "First",
    color: GK.gamma,
    def: "Rate of change of delta as spot moves. Peaks for at-the-money options close to expiry; a large gamma position needs frequent rehedging.",
  },
  {
    symbol: "Θ",
    name: "Theta",
    formula: "dV / dt  =  -dV / dT",
    order: "First",
    color: GK.theta,
    def: "Change in option value per day of time decay, holding everything else fixed. Usually negative for long options: time value erodes toward expiry.",
  },
  {
    symbol: "ν",
    name: "Vega",
    formula: "dV / dσ",
    order: "First",
    color: GK.vega,
    def: "Change in option value per 1 percentage point of implied volatility. Long options are long vega; positive vega benefits from rising uncertainty.",
  },
  {
    symbol: "ρ",
    name: "Rho",
    formula: "dV / dr",
    order: "First",
    color: GK.rho,
    def: "Change in option value per 1 percentage point of the risk-free rate. Larger in magnitude for longer-dated options.",
  },
  {
    symbol: "",
    name: "Vanna",
    formula: "d²V / dS dσ  =  dΔ / dσ  =  dν / dS",
    order: "Second",
    color: GK.vanna,
    def: "Sensitivity of delta to a change in volatility (equivalently, of vega to a change in spot). Drives skew-hedging flows and cross-Greek risk.",
  },
  {
    symbol: "",
    name: "Charm",
    formula: "-d²V / dS dt  =  dΔ / dt",
    order: "Second",
    color: GK.charm,
    def: "Delta decay: how much delta drifts purely from the passage of time, even with spot unchanged. Relevant for overnight hedge rebalancing.",
  },
  {
    symbol: "",
    name: "Vomma",
    formula: "d²V / dσ²  =  dν / dσ",
    order: "Second",
    color: GK.vomma,
    def: "Also called volga. Convexity of vega with respect to volatility, describing how vega itself changes as implied vol moves. Amplified in long-dated, OTM options.",
  },
];

/**
 * Reference glossary for every Greek shown in the app, grouped by order.
 * Formulas mirror the closed-form derivatives implemented in
 * src/lib/blackScholes.ts.
 */
export function GreeksGlossary() {
  const firstOrder = ENTRIES.filter((e) => e.order === "First");
  const secondOrder = ENTRIES.filter((e) => e.order === "Second");

  return (
    <section className="border-t border-edge bg-panel/30 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-baseline gap-2">
          <h2 className="text-[13px] font-semibold tracking-tight text-txt">Greeks Reference</h2>
          <span className="text-[10px] text-faint">closed-form derivatives of the BSM value function</span>
        </div>

        <GreekGroup title="First-Order" subtitle="sensitivity of value to a single market input" entries={firstOrder} />
        <div className="mt-5">
          <GreekGroup title="Second-Order" subtitle="sensitivity of a first-order Greek to another input" entries={secondOrder} />
        </div>
      </div>
    </section>
  );
}

function GreekGroup({ title, subtitle, entries }: { title: string; subtitle: string; entries: Entry[] }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="lbl text-[9px]">{title}</span>
        <span className="text-[10px] text-faint">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((e) => (
          <div key={e.name} className="card px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[12px]"
                style={{ color: e.color, background: `${e.color}18` }}
              >
                {e.symbol || e.name.charAt(0)}
              </span>
              <span className="text-[12px] font-medium text-txt">{e.name}</span>
              <span className="tnum ml-auto text-[10px] text-faint">{e.formula}</span>
            </div>
            <p className="mt-2 text-[11px] leading-[1.55] text-dim">{e.def}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
