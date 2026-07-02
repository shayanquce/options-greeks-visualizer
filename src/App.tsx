import { useMemo, useState } from "react";
import { greeks, type OptionType } from "./lib/blackScholes";
import { fmt, fmtPct } from "./lib/format";
import { GreeksCard } from "./components/GreeksCard";
import { InputsPanel, type AppInputs } from "./components/InputsPanel";
import { GreekCurves } from "./components/GreekCurves";
import { PayoffChart } from "./components/PayoffChart";
import { GreekSurface } from "./components/GreekSurface";
import { TimeDecay } from "./components/TimeDecay";
import { StrategyBuilder } from "./components/StrategyBuilder";
import { IconLinkedIn } from "./components/icons";
import { GreeksGlossary } from "./components/GreeksGlossary";
import { HelpModal } from "./components/HelpModal";
import { Logo } from "./components/Logo";

const TABS: Tab[] = ["Greek Curves", "Payoff", "Surface", "Time Decay", "Strategy"];
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

/**
 * Moneyness depends on the option type: a call is ITM when S > K, a put when
 * S < K. Within +/-2% of the strike we call it ATM.
 */
function MoneynessBadge({ m, type }: { m: number; type: OptionType }) {
  const near = m > 0.98 && m < 1.02;
  const itm = type === "call" ? m >= 1.02 : m <= 0.98;
  const [label, cls, title] = near
    ? ["ATM", "text-accent", "At the money: spot is near the strike"]
    : itm
      ? ["ITM", "text-up", "In the money: the option has intrinsic value"]
      : ["OTM", "text-down", "Out of the money: no intrinsic value yet"];
  return (
    <span className={`text-[10px] font-semibold ${cls}`} title={title}>
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
      <header className="flex items-center gap-3.5 border-b border-txt/80 bg-panel px-5 py-3">
        <Logo className="shrink-0 text-txt" />
        <div className="leading-tight">
          <h1 className="font-serif text-[19px] font-semibold tracking-tight text-txt">
            The Greeks
          </h1>
          <div className="text-[11px] text-dim">
            Option prices and risk under Black-Scholes-Merton
          </div>
          <div className="mt-0.5 text-[10px] text-faint">Made by Shayan Mardaneh</div>
        </div>

        <button
          onClick={() => setHelpOpen(true)}
          className="ml-5 border-b border-dotted border-faint pb-px text-[11px] text-dim hover:border-txt hover:text-txt"
        >
          How it works
        </button>

        <div className="tnum ml-auto hidden items-center gap-3 text-[11px] lg:flex">
          <span className="text-dim">
            {inputs.type === "call" ? (
              <span className="font-medium text-up">CALL</span>
            ) : (
              <span className="font-medium text-down">PUT</span>
            )}{" "}
            <span className="text-txt">{fmt(inputs.K, 0)}</span>
          </span>
          <span className="h-3 w-px bg-edge2" />
          <span className="text-dim">
            {inputs.days}<span className="text-faint">d</span>
          </span>
          <span className="h-3 w-px bg-edge2" />
          <span className="flex items-center gap-1.5 text-dim">
            S/K <span className="text-txt">{fmt(moneyness, 3)}</span>
            <MoneynessBadge m={moneyness} type={inputs.type} />
          </span>
          <span className="h-3 w-px bg-edge2" />
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
          <nav className="flex items-center gap-1 border-b border-edge bg-panel px-2">
            {TABS.map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative px-3 py-2.5 text-[12px] ${
                  tab === id
                    ? "font-semibold text-txt"
                    : "text-dim hover:text-txt"
                }`}
              >
                {id}
                {tab === id && (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] bg-accent" />
                )}
              </button>
            ))}
          </nav>

          <div className="border-b border-edge bg-panel2 px-4 py-1.5 text-[11px] italic leading-[1.5] text-dim">
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

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge bg-panel px-5 py-2.5 text-[11px] text-faint">
        <span className="italic">Educational tool, not investment advice.</span>
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
