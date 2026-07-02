/**
 * Multi-leg strategy positions built on the BSM engine.
 *
 * A position is a list of legs; each leg is an option (or a stock position)
 * with a signed quantity (+1 long, -1 short). Position value and Greeks are
 * linear in the legs, so we just sum leg-by-leg:
 *
 *   V_position = sum_i qty_i * V_i        (same for every Greek)
 *
 * Stock legs contribute delta = qty and zero for every other Greek
 * (a share has no optionality). Cost basis for a stock leg is the entry
 * spot so the payoff diagram nets out the initial outlay.
 */
import { greeks, intrinsic, price, type BsmInputs, type Greeks, type OptionType } from "./blackScholes";

export interface OptionLeg {
  kind: "option";
  type: OptionType;
  strike: number;
  qty: number; // signed: +long, -short
}

export interface StockLeg {
  kind: "stock";
  qty: number; // signed shares (per contract-equivalent)
  entry: number; // cost basis per share
}

export type Leg = OptionLeg | StockLeg;

export interface Strategy {
  name: string;
  description: string;
  legs: Leg[];
}

/** Market environment shared by all legs (spot, T, r, sigma, q). */
export type Market = Omit<BsmInputs, "K">;

export function legPrice(leg: Leg, mkt: Market): number {
  if (leg.kind === "stock") return leg.qty * mkt.S;
  return leg.qty * price(leg.type, { ...mkt, K: leg.strike });
}

/** Theoretical value of the whole position at the given market. */
export function positionValue(legs: Leg[], mkt: Market): number {
  return legs.reduce((sum, leg) => sum + legPrice(leg, mkt), 0);
}

/** Value of the position at expiry (pure intrinsic). */
export function positionPayoff(legs: Leg[], S: number): number {
  return legs.reduce((sum, leg) => {
    if (leg.kind === "stock") return sum + leg.qty * S;
    return sum + leg.qty * intrinsic(leg.type, S, leg.strike);
  }, 0);
}

/**
 * Net entry cost of the position (debit > 0, credit < 0) at the entry market.
 * P&L at expiry = payoff(S_T) - cost; stock legs use their recorded basis.
 */
export function positionCost(legs: Leg[], entryMkt: Market): number {
  return legs.reduce((sum, leg) => {
    if (leg.kind === "stock") return sum + leg.qty * leg.entry;
    return sum + leg.qty * price(leg.type, { ...entryMkt, K: leg.strike });
  }, 0);
}

const ZERO: Greeks = {
  price: 0,
  delta: 0,
  gamma: 0,
  theta: 0,
  vega: 0,
  rho: 0,
  vanna: 0,
  charm: 0,
  vomma: 0,
};

/** Net Greeks: qty-weighted sum across legs (Greeks are additive). */
export function positionGreeks(legs: Leg[], mkt: Market): Greeks {
  return legs.reduce((acc, leg) => {
    if (leg.kind === "stock") {
      return { ...acc, price: acc.price + leg.qty * mkt.S, delta: acc.delta + leg.qty };
    }
    const g = greeks(leg.type, { ...mkt, K: leg.strike });
    return {
      price: acc.price + leg.qty * g.price,
      delta: acc.delta + leg.qty * g.delta,
      gamma: acc.gamma + leg.qty * g.gamma,
      theta: acc.theta + leg.qty * g.theta,
      vega: acc.vega + leg.qty * g.vega,
      rho: acc.rho + leg.qty * g.rho,
      vanna: acc.vanna + leg.qty * g.vanna,
      charm: acc.charm + leg.qty * g.charm,
      vomma: acc.vomma + leg.qty * g.vomma,
    };
  }, ZERO);
}

/**
 * Preset strategies, parameterized by current spot so strikes land on
 * sensible round numbers around the money.
 */
export function presetStrategies(S: number): Strategy[] {
  const atm = roundStrike(S);
  const up = roundStrike(S * 1.05);
  const dn = roundStrike(S * 0.95);
  const up2 = roundStrike(S * 1.1);
  const dn2 = roundStrike(S * 0.9);
  return [
    {
      name: "Long Straddle",
      description: "Long ATM call + long ATM put. Long vol/gamma; profits from a large move either way; bleeds theta.",
      legs: [
        { kind: "option", type: "call", strike: atm, qty: 1 },
        { kind: "option", type: "put", strike: atm, qty: 1 },
      ],
    },
    {
      name: "Bull Call Spread",
      description: "Long lower-strike call, short higher-strike call. Defined-risk bullish view; short leg finances the long.",
      legs: [
        { kind: "option", type: "call", strike: atm, qty: 1 },
        { kind: "option", type: "call", strike: up, qty: -1 },
      ],
    },
    {
      name: "Covered Call",
      description: "Long stock + short OTM call. Harvests premium; caps upside at the short strike.",
      legs: [
        { kind: "stock", qty: 1, entry: S },
        { kind: "option", type: "call", strike: up, qty: -1 },
      ],
    },
    {
      name: "Protective Put",
      description: "Long stock + long OTM put. Insurance: floors downside at the put strike minus premium.",
      legs: [
        { kind: "stock", qty: 1, entry: S },
        { kind: "option", type: "put", strike: dn, qty: 1 },
      ],
    },
    {
      name: "Iron Condor",
      description: "Short OTM put spread + short OTM call spread. Short vol; collects premium if spot stays in the range.",
      legs: [
        { kind: "option", type: "put", strike: dn2, qty: 1 },
        { kind: "option", type: "put", strike: dn, qty: -1 },
        { kind: "option", type: "call", strike: up, qty: -1 },
        { kind: "option", type: "call", strike: up2, qty: 1 },
      ],
    },
  ];
}

/** Round to a "listed-looking" strike: 2.5 increments under 100, 5 above. */
export function roundStrike(x: number): number {
  const step = x < 25 ? 1 : x < 100 ? 2.5 : 5;
  return Math.round(x / step) * step;
}
