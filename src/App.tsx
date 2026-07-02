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
import { IconClock, IconCurves, IconGrid, IconHelp, IconLayers, IconLinkedIn, IconPayoff } from "./components/icons";
import { GreeksGlossary } from "./components/GreeksGlossary";
import { HelpModal } from "./components/HelpModal";
import { Logo } from "./components/Logo";
import type { JSX } from "react";

const TABS: { id: Tab; icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: "Greek Curves", icon: IconCurves },
  { id: "Payoff", icon: IconPayoff },
  { id: "Surface", icon: IconGrid },
  { id: "Time Decay", icon: IconClock },
  { id: "Strategy", icon: IconLayers },
];
type Tab = "Greek Curves" | "Payoff" | "Surface" | "Time Decay" | "Strategy";

const TAB_HINTS: Record<Tab, string> = {
  "Greek Curves":
    "Each chart shows one Greek vs stock price. Move Spot in the left panel and watch the dot travel along the curve.",
  Payoff:
    "Profit or loss for owning one option. Solid line = at expiry; dashed = today (still has time value).",
  Surface:
    "Heatmap of one Greek across stock price and time. Pick a Greek above the chart, then hover for exact values.",
  "Time Decay":
    "Hit play to watch the option lose time value as expiry approaches. Drag the slider to jump to any day.",
  Strategy:
    "Combine multiple options into one position. Pick a preset or build your own legs and see net Greeks and P&L.",
};

function MoneynessBadge({ m }: { m: number }) {
  const [label, cls, title] =
    m > 1.02
      ? ["ITM", "text-up", "In the money: the option has intrinsic value"]
      : m < 0.98
        ? ["OTM", "text-down", "Out of the money: no intrinsic value yet"]
        : ["ATM", "text-accent", "At the money: spot is near the strike"];
  return (
    <span className={`text-[10px] font-medium ${cls}`} title={title}>
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
  const [helpOpen, setHelpOpen] = useState(false);

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
        <Logo className="shrink-0 text-accent" />
        <div className="leading-tight">
          <h1 className="text-[13px] font-semibold text-txt">Options Greeks</h1>
          <div className="text-[10px] text-faint">Learn how option prices and risk change with the market</div>
        </div>

        <button
          onClick={() => setHelpOpen(true)}
          className="ml-4 flex items-center gap-1.5 border border-edge px-2.5 py-1 text-[10px] text-dim hover:border-edge2 hover:bg-panel2 hover:text-txt"
        >
          <IconHelp className="text-faint" />
          How it works
        </button>

        <div className="tnum ml-auto hidden items-center gap-3 border border-edge bg-panel2 px-3 py-1 text-[11px] lg:flex">
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

          <div className="border-b border-edge bg-panel2 px-3 py-1.5 text-[10px] leading-[1.5] text-dim">
            {TAB_HINTS[tab]}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === "Greek Curves" && <GreekCurves inputs={inputs} />}
            {tab === "Payoff" && <PayoffChart inputs={inputs} />}
            {tab === "Surface" && <GreekSurface inputs={inputs} />}
            {tab === "Time Decay" && <TimeDecay inputs={inputs} />}
            {tab === "Strategy" && <StrategyBuilder inputs={inputs} />}
          </div>
        </main>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge px-4 py-2 text-[10px] text-faint">
        <span>Educational tool, not investment advice.</span>
        <a
          href="https://www.linkedin.com/in/shayanmardaneh"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-dim hover:text-txt"
        >
          Made by Shayan Mardaneh
          <IconLinkedIn className="text-info" />
        </a>
      </footer>

      <GreeksGlossary />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
