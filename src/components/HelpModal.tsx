import { useEffect } from "react";
import { IconClose } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

type HelpSection =
  | { title: string; body: string }
  | { title: string; steps: string[] };

const SECTIONS: HelpSection[] = [
  {
    title: "What is this?",
    body: "A learning tool for options pricing. You set up a single European call or put, and the app shows how its price and risk measures (the Greeks) respond when spot, time, volatility, or rates change. Everything updates live as you move the sliders.",
  },
  {
    title: "Quick start",
    steps: [
      "Pick call or put in the left panel.",
      "Set spot (S), strike (K), days to expiry, and volatility (σ). These are the inputs that matter most when you are starting out.",
      "Read the numbers in the Greeks bar at the top. Green means the position gains from that move; red means it loses.",
      "Open each tab to see a different view: curves, profit/loss, heatmaps, time decay, or multi-leg strategies.",
      "Scroll to the Greeks reference at the bottom for plain-language explanations.",
    ],
  },
  {
    title: "Left panel",
    body: "Spot (S) is the current stock price. Strike (K) is the price you have the right to buy (call) or sell (put) at. Expiry is how many calendar days remain. Volatility (σ) is how much the market expects the stock to move; higher vol means a more expensive option. Risk-free rate (r) and dividend yield (q) matter less for short-dated options but are included for completeness. The implied-vol solver lets you type a market price and back out what volatility the market is implying.",
  },
  {
    title: "Greeks bar",
    body: "Theo value is the model price of one contract. Delta tells you how much the option price moves per $1 stock move (also your share-equivalent exposure). Gamma is how fast delta changes. Theta is daily time decay. Vega is sensitivity to a 1-point vol move. Rho is sensitivity to rates. Vanna, charm, and vomma are second-order effects that matter more to market makers and advanced hedging.",
  },
  {
    title: "Greek Curves",
    body: "Six small charts plot each Greek against spot price. The dashed vertical line is your current spot; the dot shows where you are on the curve. Try moving spot and watch delta flatten as you go deep in-the-money, or gamma spike near at-the-money close to expiry.",
  },
  {
    title: "Payoff",
    body: "Shows profit and loss for owning one option. The solid line is P&L at expiry (the hockey stick). The dashed line is P&L today, which includes remaining time value. Breakeven is the stock price where you neither make nor lose money at expiry after paying the premium.",
  },
  {
    title: "Surface",
    body: "A heatmap of one Greek across spot (vertical) and time to expiry (horizontal). Useful for seeing where gamma concentrates (often near the strike as expiry approaches). Hover any cell for exact values; the crosshair marks your current inputs.",
  },
  {
    title: "Time Decay",
    body: "Press play to animate the option running down to expiry. Left chart: the value curve collapses onto the intrinsic payoff. Right chart: value vs days remaining at your current spot. Theta accelerates in the final weeks for at-the-money options.",
  },
  {
    title: "Strategy",
    body: "Build multi-leg positions from presets (straddle, spread, etc.) or add your own legs. The table prices each leg; net Greeks and the combined P&L chart show portfolio-level risk. Positive qty = long, negative = short.",
  },
];

export function HelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-12" onClick={onClose}>
      <div
        className="relative w-full max-w-lg border border-edge bg-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="help-title"
      >
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2 id="help-title" className="text-[13px] font-semibold text-txt">
            How to use this app
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-dim hover:bg-panel2 hover:text-txt"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="mb-4 last:mb-0">
              <h3 className="mb-1 text-[12px] font-medium text-txt">{s.title}</h3>
              {"body" in s ? (
                <p className="text-[11px] leading-[1.6] text-dim">{s.body}</p>
              ) : (
                <ol className="list-decimal space-y-1.5 pl-4 text-[11px] leading-[1.6] text-dim">
                  {s.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-edge px-4 py-2.5 text-[10px] text-faint">
          Model assumes European exercise, constant volatility, and no fees. For learning only.
        </div>
      </div>
    </div>
  );
}
