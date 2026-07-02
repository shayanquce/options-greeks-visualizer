import type { Greeks } from "../lib/blackScholes";
import { fmt } from "../lib/format";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

interface CellProps {
  label: string;
  symbol?: string;
  value: number;
  unit?: string;
  dp?: number;
  signed?: boolean;
}

function Cell({ label, symbol, value, unit, dp = 4, signed }: CellProps) {
  const v = useAnimatedNumber(value);
  const color = signed
    ? value > 1e-12
      ? "text-up"
      : value < -1e-12
        ? "text-down"
        : "text-txt"
    : "text-txt";
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-2">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {symbol && <span className="font-mono text-[11px] text-faint">{symbol}</span>}
        <span className="lbl text-[9px]">{label}</span>
      </div>
      <div className={`tnum mt-1 whitespace-nowrap text-[14px] font-medium leading-none ${color}`}>
        {fmt(v, dp)}
        {unit && <span className="ml-1 text-[9px] font-normal text-faint">{unit}</span>}
      </div>
    </div>
  );
}

function PriceCell({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return (
    <div className="relative flex w-[124px] shrink-0 flex-col justify-center px-4 py-2">
      <div className="lbl text-[9px] text-accent/80">Theo Value</div>
      <div className="tnum mt-1 text-[21px] font-semibold leading-none text-accent">{fmt(v, 4)}</div>
      <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-accent/70" />
    </div>
  );
}

/**
 * Always-visible summary strip. Display conventions (standard desk units):
 *   theta -> per calendar day · vega/rho -> per 1 percentage point · charm -> per day
 */
export function GreeksCard({ greeks }: { greeks: Greeks }) {
  return (
    <div className="flex items-stretch border-b border-edge bg-panel/60">
      <PriceCell value={greeks.price} />

      {/* first-order block */}
      <div className="flex flex-1 items-stretch border-l border-edge">
        <div className="flex items-stretch divide-x divide-edge/70">
          <Cell label="Delta" symbol="Δ" value={greeks.delta} signed />
          <Cell label="Gamma" symbol="Γ" value={greeks.gamma} signed />
          <Cell label="Theta" symbol="Θ" value={greeks.theta / 365} unit="/d" signed />
          <Cell label="Vega" symbol="ν" value={greeks.vega / 100} unit="/1%" signed />
          <Cell label="Rho" symbol="ρ" value={greeks.rho / 100} unit="/1%" signed />
        </div>
      </div>

      {/* second-order block, set apart */}
      <div className="flex items-stretch border-l border-edge2 bg-panel2/40">
        <span className="flex items-center px-2 [writing-mode:vertical-rl] text-[8px] font-semibold uppercase tracking-[0.2em] text-faint rotate-180">
          2nd order
        </span>
        <div className="flex items-stretch divide-x divide-edge/70">
          <Cell label="Vanna" value={greeks.vanna} signed />
          <Cell label="Charm" value={greeks.charm / 365} unit="/d" signed />
          <Cell label="Vomma" value={greeks.vomma / 100} unit="/1%" signed />
        </div>
      </div>
    </div>
  );
}
