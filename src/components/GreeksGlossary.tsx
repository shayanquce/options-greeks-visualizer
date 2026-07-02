import { useState, type ReactNode } from "react";
import { GK } from "./chartTheme";
import { IconChevron } from "./icons";

interface Entry {
  symbol: string;
  name: string;
  formula: string;
  order: "Primary" | "Higher";
  color: string;
  summary: string;
  detail: ReactNode;
  example: string;
}

/** e^x with a real superscript exponent, for inline use in prose. */
function ExpOf({ children }: { children: ReactNode }) {
  return (
    <>
      e<sup>{children}</sup>
    </>
  );
}

const ENTRIES: Entry[] = [
  {
    symbol: "Δ",
    name: "Delta",
    formula: "∂V/∂S",
    order: "Primary",
    color: GK.delta,
    summary: "How much the option price moves when the stock moves $1.",
    detail: (
      <>
        Delta is the first derivative of option value with respect to spot. For a call it ranges
        from 0 (far out of the money) to 1 (deep in the money); for a put, from 0 to −1. Traders
        use delta as a hedge ratio: since one listed contract covers 100 shares, a call with
        delta 0.40 has the same first-order exposure as 40 shares of stock. Delta is often quoted
        as a rough proxy for the chance of expiring in the money, but the exact risk-neutral
        exercise probability is N(d₂); delta itself is <ExpOf>−qT</ExpOf>·N(d₁), which sits
        slightly above it. That is also why an at-the-money call's delta is a little over 0.50,
        not exactly 0.50.
      </>
    ),
    example:
      "You own a call with delta 0.55. The stock rises $2. The option price should increase by about 0.55 × $2 = $1.10 (before other effects). To stay delta-neutral, you would short 55 shares against the contract.",
  },
  {
    symbol: "Γ",
    name: "Gamma",
    formula: "∂²V/∂S²",
    order: "Primary",
    color: GK.gamma,
    summary: "How much delta changes when the stock moves $1.",
    detail:
      "Gamma measures the curvature of the option price against spot. It is highest for at-the-money options near expiry, when delta swings rapidly from near 0 to near 1 (for calls) as the stock crosses the strike. Long options have positive gamma: your delta becomes more favorable as the stock moves your way. Short options have negative gamma: adverse moves hurt increasingly fast. Market makers who sell options are often short gamma and must buy stock as it rises and sell as it falls to rebalance.",
    example:
      "Gamma is 0.05 and delta is currently 0.50. If the stock rises $1, delta becomes about 0.55. If it falls $1, delta becomes about 0.45. Near expiry at the money, gamma can be large, meaning delta changes quickly and hedging must be frequent.",
  },
  {
    symbol: "Θ",
    name: "Theta",
    formula: "∂V/∂t",
    order: "Primary",
    color: GK.theta,
    summary: "How much value the option loses each day from time passing.",
    detail:
      "Theta is time decay: the option's value change per day with spot, volatility, and rates held fixed. Long options usually have negative theta because you are paying for time value that erodes toward zero at expiry. The decay is not linear; it accelerates in the last weeks for at-the-money options. Short option positions have positive theta: you earn as time passes. Theta and gamma are closely linked; both peak near at-the-money near expiry.",
    example:
      "Theta is −0.04 per day. Holding everything else equal, the option loses about 4 cents per calendar day. Over a weekend with no trading, charm (delta decay) also matters, but theta is the headline daily bleed for long premium.",
  },
  {
    symbol: "ν",
    name: "Vega",
    formula: "∂V/∂σ",
    order: "Primary",
    color: GK.vega,
    summary: "How much the option price moves when implied volatility rises 1%.",
    detail:
      "Vega measures sensitivity to the volatility input σ. Long options have positive vega: you benefit when implied vol rises because the option is worth more uncertainty. Vega is largest for at-the-money options with more time left. It declines as expiry approaches because there is less time for volatility to matter. Vega is not a Greek letter; traders borrowed ν (nu) by convention.",
    example:
      "Vega is 0.18 per 1% vol. If implied vol rises from 25% to 26%, the option gains about $0.18. An earnings announcement that spikes vol can lift option prices even if the stock barely moves.",
  },
  {
    symbol: "ρ",
    name: "Rho",
    formula: "∂V/∂r",
    order: "Primary",
    color: GK.rho,
    summary: "How much the option price moves when interest rates rise 1%.",
    detail:
      "Rho is sensitivity to the risk-free rate r. Calls tend to have positive rho (higher rates increase call value in BSM) and puts negative rho. For short-dated equity options rho is often small compared to delta, gamma, theta, and vega. It matters more for long-dated LEAPS and rate-sensitive portfolios.",
    example:
      "Rho is 0.12 per 1% rate. A 1 percentage point rise in rates adds about $0.12 to the call value. For a 30-day option this is usually a footnote; for a 2-year LEAPS it can be meaningful.",
  },
  {
    symbol: "",
    name: "Vanna",
    formula: "∂²V/∂S∂σ",
    order: "Higher",
    color: GK.vanna,
    summary: "How delta changes when volatility moves, or how vega changes when spot moves.",
    detail:
      "Vanna is a cross-Greek: the rate of change of delta with respect to volatility, equivalently the rate of change of vega with respect to spot. It matters for vol-skew trading and for understanding how your delta hedge drifts when vol moves. After a vol spike, vanna helps explain why dealers may need to adjust stock hedges even if spot is unchanged.",
    example:
      "Positive vanna means a vol increase also pushes delta up. If you are long a call and vol rises, your effective share exposure (delta) may increase, so a delta-neutral book needs more hedging.",
  },
  {
    symbol: "",
    name: "Charm",
    formula: "∂Δ/∂t",
    order: "Higher",
    color: GK.charm,
    summary: "How much delta drifts each day even if the stock price stays flat.",
    detail:
      "Charm is delta decay: how delta changes purely from time passing. Overnight, an at-the-money option's delta can drift toward 0 or 1 as expiry nears. Traders who rebalance delta hedges once a day use charm to estimate how much delta will shift before the open without a stock move.",
    example:
      "Charm is −0.02 per day. With spot unchanged, delta falls by about 0.02 tomorrow. For a market maker running a delta-neutral book, that means buying or selling a small amount of stock at the open.",
  },
  {
    symbol: "",
    name: "Vomma",
    formula: "∂²V/∂σ²",
    order: "Higher",
    color: GK.vomma,
    summary: "How much vega itself changes when volatility moves.",
    detail:
      "Also called volga. Vomma is the convexity of option value in volatility: if vega is how fast price changes with vol, vomma is how fast vega changes with vol. Long straddles are long vomma; when vol rises, vega increases and the position becomes even more sensitive to further vol moves. Important for vol-of-vol risk in long-dated and OTM structures.",
    example:
      "You are long a straddle with high vega. Vol rises 2 points; vomma means your vega is now even higher, so a further vol move has an amplified effect on P&L.",
  },
];

export function GreeksGlossary() {
  const primary = ENTRIES.filter((e) => e.order === "Primary");
  const higher = ENTRIES.filter((e) => e.order === "Higher");

  return (
    <section className="border-t border-edge bg-panel px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h2 className="font-serif text-[17px] font-semibold tracking-tight text-txt">
            Greeks reference
          </h2>
          <p className="mt-1 text-[12px] leading-[1.5] text-dim">
            Plain summaries below. Click any Greek for a fuller explanation and a worked example.
          </p>
        </div>

        <GreekGroup
          title="The primary Greeks"
          subtitle="the five standard sensitivities every options desk quotes"
          entries={primary}
        />
        <div className="mt-5">
          <GreekGroup
            title="Higher-order Greeks"
            subtitle="cross and second derivatives: how the Greeks themselves drift"
            entries={higher}
          />
        </div>
      </div>
    </section>
  );
}

function GreekGroup({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: Entry[];
}) {
  return (
    <div>
      <div className="mb-2">
        <span className="lbl">{title}</span>
        <span className="ml-2 text-[10px] text-faint">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {entries.map((e) => (
          <GreekCard key={e.name} entry={e} />
        ))}
      </div>
    </div>
  );
}

function GreekCard({ entry: e }: { entry: Entry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-edge bg-panel2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-panel3"
      >
        <span className="mt-0.5 h-3 w-0.5 shrink-0" style={{ background: e.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {e.symbol && (
              <span className="font-serif text-[13px] italic text-faint">{e.symbol}</span>
            )}
            <span className="text-[11px] font-medium text-txt">{e.name}</span>
            <span className="ml-auto font-serif text-[11px] italic text-faint">{e.formula}</span>
          </div>
          <p className="mt-1 text-[11px] leading-[1.5] text-dim">{e.summary}</p>
        </div>
        <IconChevron
          className={`mt-1 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-edge px-3 py-2.5 text-[11px] leading-[1.6] text-dim">
          <p>{e.detail}</p>
          <p className="mt-2 border-l-2 border-edge2 pl-2 text-[10px] text-faint">
            <span className="font-medium text-dim">Example: </span>
            {e.example}
          </p>
        </div>
      )}
    </div>
  );
}
