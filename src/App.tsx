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

function MoneynessBadge({ m }: { m: number }) {
  const [label, cls] =
    m > 1.02
      ? ["ITM", "text-up"]
      : m < 0.98
        ? ["OTM", "text-down"]
        : ["ATM", "text-accent"];
  return <span className={`text-[10px] font-medium ${cls}`}>{label}</span>;
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
      <header className="flex items-center gap-3 border-b border-edge bg-panel px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center border border-accent bg-panel2">
          <span className="font-mono text-[14px] font-semibold leading-none text-accent">Δ</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-[13px] font-semibold text-txt">Options Greeks</h1>
          <div className="text-[10px] text-faint">Black-Scholes-Merton · European</div>
        </div>

        <div className="tnum ml-6 hidden items-center gap-3 border border-edge bg-panel2 px-3 py-1 text-[11px] lg:flex">
          <span className="text-dim">
            {inputs.type === "call" ? (
              <span className="text-up">CALL</span>
            ) : (
              <span className="text-down">PUT</span>
            )}{" "}
            <span className="text-txt">{fmt(inputs.K, 0)}</span>
          </span>
          <span className="h-3 w-px bg-edge" />
          <span className="text-dim">
            {inputs.days}<span className="text-faint">d</span>
          </span>
          <span className="h-3 w-px bg-edge" />
          <span className="flex items-center gap-1.5 text-dim">
            S/K <span className="text-txt">{fmt(moneyness, 3)}</span>
            <MoneynessBadge m={moneyness} />
          </span>
          <span className="h-3 w-px bg-edge" />
          <span className="text-dim">
            σ <span className="text-txt">{fmtPct(inputs.sigma, 1)}</span>
          </span>
        </div>
      </header>

      <GreeksCard greeks={g} />

      <div className="flex min-h-0 flex-1">
        <aside className="w-[272px] shrink-0 border-r border-edge bg-panel">
          <InputsPanel inputs={inputs} onChange={patch} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <nav className="flex items-center border-b border-edge">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 border-r border-edge px-3 py-2 text-[11px] font-medium ${
                  tab === id
                    ? "bg-panel2 text-txt"
                    : "bg-panel text-dim hover:bg-panel2 hover:text-txt"
                }`}
              >
                <Icon className={tab === id ? "text-accent" : "text-faint"} />
                {id}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
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
