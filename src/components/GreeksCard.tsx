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
    <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
      <div className="flex items-center gap-1 whitespace-nowrap">
        {symbol && <span className="font-serif text-[13px] italic text-faint">{symbol}</span>}
        <span className="lbl text-[10px]">{label}</span>
      </div>
      <div className={`tnum mt-0.5 whitespace-nowrap text-[13px] font-medium leading-none ${color}`}>
        {fmt(v, dp)}
        {unit && <span className="ml-1 text-[9px] font-normal text-faint">{unit}</span>}
      </div>
    </div>
  );
}

function PriceCell({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return (
    <div className="flex w-[116px] shrink-0 flex-col justify-center border-r border-edge px-3 py-2">
      <div className="lbl text-[10px]">Option price</div>
      <div className="tnum mt-0.5 text-[18px] font-semibold leading-none text-txt">{fmt(v, 4)}</div>
      <div className="mt-0.5 text-[9px] text-faint">model value</div>
    </div>
  );
}

export function GreeksCard({ greeks }: { greeks: Greeks }) {
  return (
    <div className="flex items-stretch border-b border-edge bg-panel2">
      <PriceCell value={greeks.price} />

      <div className="flex flex-1 items-stretch divide-x divide-edge">
        <Cell label="Delta" symbol="Δ" value={greeks.delta} signed />
        <Cell label="Gamma" symbol="Γ" value={greeks.gamma} signed />
        <Cell label="Theta" symbol="Θ" value={greeks.theta / 365} unit="/d" signed />
        <Cell label="Vega" symbol="ν" value={greeks.vega / 100} unit="/1%" signed />
        <Cell label="Rho" symbol="ρ" value={greeks.rho / 100} unit="/1%" signed />
      </div>

      <div className="flex items-stretch border-l border-edge">
        <div className="flex items-stretch divide-x divide-edge">
          <Cell label="Vanna" value={greeks.vanna / 100} unit="/1%" signed />
          <Cell label="Charm" value={greeks.charm / 365} unit="/d" signed />
          <Cell label="Vomma" value={greeks.vomma / 100} unit="/1%" signed />
        </div>
      </div>
    </div>
  );
}
