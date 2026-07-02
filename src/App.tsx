import { useMemo, useState } from "react";
import { greeks } from "./lib/blackScholes";
import { fmt, fmtPct } from "./lib/format";
import { GreeksCard } from "./components/GreeksCard";
import { InputsPanel, type AppInputs } from "./components/InputsPanel";
import { GreekCurves } from "./components/GreekCurves";
import { PayoffChart } from "./components/PayoffChart";
import { GreekSurface } from "./components/GreekSurface";
import { TimeDecay } from "./components/TimeDecay";
import { StrategyBuilder } from "./components/StrategyBuilder";
import { IconClock, IconCurves, IconGrid, IconLayers, IconPayoff } from "./components/icons";
import { GreeksGlossary } from "./components/GreeksGlossary";
import type { JSX } from "react";

const TABS: { id: Tab; icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: "Greek Curves", icon: IconCurves },
  { id: "Payoff", icon: IconPayoff },
  { id: "Surface", icon: IconGrid },
  { id: "Time Decay", icon: IconClock },
  { id: "Strategy", icon: IconLayers },
];
type Tab = "Greek Curves" | "Payoff" | "Surface" | "Time Decay" | "Strategy";

function Logo() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-br from-accent to-[#c8901a] shadow-[0_1px_3px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]">
      <span className="font-mono text-[15px] font-bold leading-none text-[#0a0b0f]">Δ</span>
    </div>
  );
}

function MoneynessBadge({ m }: { m: number }) {
  const [label, cls] =
    m > 1.02
      ? ["ITM", "text-up bg-up/10 border-up/25"]
      : m < 0.98
        ? ["OTM", "text-down bg-down/10 border-down/25"]
        : ["ATM", "text-accent bg-accent/10 border-accent/25"];
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${cls}`}
    >
      {label}
    </span>
  );
}

export default function App() {
  const [inputs, setInputs] = useState<AppInputs>({
    S: 100,
    K: 100,
    days: 90,
    r: 0.045,
    sigma: 0.25,
    q: 0.01,
    type: "call",
  });
  const [tab, setTab] = useState<Tab>("Greek Curves");

  const patch = (p: Partial<AppInputs>) => setInputs((cur) => ({ ...cur, ...p }));

  const g = useMemo(
    () =>
      greeks(inputs.type, {
        S: inputs.S,
        K: inputs.K,
        T: inputs.days / 365,
        r: inputs.r,
        sigma: inputs.sigma,
        q: inputs.q,
      }),
    [inputs],
  );

  const moneyness = inputs.S / inputs.K;

  return (
    <div className="flex min-h-screen flex-col">
      {/* masthead */}
      <header className="flex items-center gap-3 border-b border-edge bg-panel/70 px-4 py-2.5 backdrop-blur-sm">
        <Logo />
        <div className="leading-tight">
          <h1 className="text-[13px] font-semibold tracking-tight text-txt">
            Greeks<span className="text-accent">Terminal</span>
          </h1>
          <div className="text-[9.5px] uppercase tracking-[0.13em] text-faint">
            Black-Scholes-Merton · European
          </div>
        </div>

        {/* live contract ticker */}
        <div className="tnum ml-6 hidden items-center gap-4 rounded-md border border-edge bg-panel2/60 px-3 py-1.5 text-[11px] lg:flex">
          <span className="text-dim">
            {inputs.type === "call" ? (
              <span className="text-up">CALL</span>
            ) : (
              <span className="text-down">PUT</span>
            )}{" "}
            <span className="text-txt">{fmt(inputs.K, 0)}</span>
          </span>
          <span className="h-3 w-px bg-edge2" />
          <span className="text-dim">
            {inputs.days}<span className="text-faint">DTE</span>
          </span>
          <span className="h-3 w-px bg-edge2" />
          <span className="flex items-center gap-1.5 text-dim">
            S/K <span className="text-txt">{fmt(moneyness, 3)}</span>
            <MoneynessBadge m={moneyness} />
          </span>
          <span className="h-3 w-px bg-edge2" />
          <span className="text-dim">
            σ <span className="text-accent">{fmtPct(inputs.sigma, 1)}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-dim">
          <span className="livedot h-1.5 w-1.5 rounded-full bg-up" />
          Live
        </div>
      </header>

      {/* greeks summary strip */}
      <GreeksCard greeks={g} />

      <div className="flex min-h-0 flex-1">
        {/* inputs */}
        <aside className="w-[288px] shrink-0 border-r border-edge bg-panel/40">
          <InputsPanel inputs={inputs} onChange={patch} />
        </aside>

        {/* main area */}
        <main className="flex min-w-0 flex-1 flex-col">
          <nav className="flex items-center gap-1 border-b border-edge px-3">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`group relative flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold tracking-tight transition-colors ${
                  tab === id ? "text-accent" : "text-dim hover:text-txt"
                }`}
              >
                <Icon className={tab === id ? "text-accent" : "text-faint group-hover:text-dim"} />
                {id}
                {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
              </button>
            ))}
          </nav>

          <div key={tab} className="fadein min-h-0 flex-1 overflow-y-auto p-3">
            {tab === "Greek Curves" && <GreekCurves inputs={inputs} />}
            {tab === "Payoff" && <PayoffChart inputs={inputs} />}
            {tab === "Surface" && <GreekSurface inputs={inputs} />}
            {tab === "Time Decay" && <TimeDecay inputs={inputs} />}
            {tab === "Strategy" && <StrategyBuilder inputs={inputs} />}
          </div>
        </main>
      </div>

      <footer className="flex items-center gap-2 border-t border-edge px-4 py-1.5 text-[10px] text-faint">
        <span>Constant σ, r, q · no transaction costs · θ per calendar day, ν &amp; ρ per 1%.</span>
        <span className="ml-auto">Educational tool, not investment advice.</span>
      </footer>

      <GreeksGlossary />
    </div>
  );
}
