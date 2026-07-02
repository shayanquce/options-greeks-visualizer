import { describe, expect, it } from "vitest";
import { greeks, impliedVol, normCdf, price, type BsmInputs } from "./blackScholes";
import { positionGreeks, positionPayoff, presetStrategies } from "./strategies";

/**
 * Reference values:
 *  - Hull, "Options, Futures, and Other Derivatives" §15 worked example
 *  - Standard ATM benchmark (S=K=100, T=1, r=5%, sigma=20%, q=0) with values
 *    computed to 4+ decimals from the closed-form expressions
 *  - Greeks are additionally cross-checked against central finite differences
 *    of the price function, which is an independent consistency test.
 */

const atm: BsmInputs = { S: 100, K: 100, T: 1, r: 0.05, sigma: 0.2, q: 0 };

describe("normCdf", () => {
  it("matches known values of the standard normal CDF", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 8);
    expect(normCdf(1.96)).toBeCloseTo(0.975002, 5);
    expect(normCdf(-1.96)).toBeCloseTo(0.024998, 5);
    expect(normCdf(0.35)).toBeCloseTo(0.636831, 5);
  });
});

describe("BSM price", () => {
  it("reproduces Hull's textbook example (S=42, K=40, r=10%, sigma=20%, T=0.5)", () => {
    const inputs: BsmInputs = { S: 42, K: 40, T: 0.5, r: 0.1, sigma: 0.2, q: 0 };
    expect(price("call", inputs)).toBeCloseTo(4.76, 2);
    expect(price("put", inputs)).toBeCloseTo(0.81, 2);
  });

  it("prices the ATM benchmark to 4 decimals", () => {
    expect(price("call", atm)).toBeCloseTo(10.4506, 4);
    expect(price("put", atm)).toBeCloseTo(5.5735, 4);
  });

  it("satisfies put-call parity: C - P = S e^{-qT} - K e^{-rT}", () => {
    const cases: BsmInputs[] = [
      atm,
      { S: 87.3, K: 105, T: 0.35, r: 0.03, sigma: 0.45, q: 0.015 },
      { S: 250, K: 180, T: 2.1, r: 0.07, sigma: 0.12, q: 0.04 },
      { S: 12, K: 60, T: 0.05, r: 0.0, sigma: 0.8, q: 0.0 },
    ];
    for (const c of cases) {
      const lhs = price("call", c) - price("put", c);
      const rhs = c.S * Math.exp(-c.q * c.T) - c.K * Math.exp(-c.r * c.T);
      expect(lhs).toBeCloseTo(rhs, 8);
    }
  });

  it("collapses to intrinsic value at expiry", () => {
    expect(price("call", { ...atm, T: 0, S: 112 })).toBe(12);
    expect(price("put", { ...atm, T: 0, S: 91 })).toBe(9);
    expect(price("call", { ...atm, T: 0, S: 91 })).toBe(0);
  });
});

describe("analytic Greeks", () => {
  it("matches hand-computed ATM benchmark values", () => {
    const g = greeks("call", atm);
    expect(g.delta).toBeCloseTo(0.6368, 4);
    expect(g.gamma).toBeCloseTo(0.018762, 5);
    expect(g.vega).toBeCloseTo(37.524, 3); // per 1.00 vol
    expect(g.theta).toBeCloseTo(-6.414, 3); // per year
    expect(g.rho).toBeCloseTo(53.2325, 3); // per 1.00 rate

    const p = greeks("put", atm);
    expect(p.delta).toBeCloseTo(-0.3632, 4);
    expect(p.gamma).toBeCloseTo(g.gamma, 10); // gamma identical call/put
    expect(p.vega).toBeCloseTo(g.vega, 10); // vega identical call/put
  });

  it("agrees with central finite differences of the price function", () => {
    const cases: { type: "call" | "put"; inputs: BsmInputs }[] = [
      { type: "call", inputs: atm },
      { type: "put", inputs: { S: 95, K: 110, T: 0.4, r: 0.04, sigma: 0.35, q: 0.02 } },
      { type: "call", inputs: { S: 150, K: 120, T: 1.7, r: 0.06, sigma: 0.15, q: 0.03 } },
    ];
    for (const { type, inputs } of cases) {
      const g = greeks(type, inputs);
      const h = 1e-4;

      // Delta: [V(S+h) - V(S-h)] / 2h
      const dS = inputs.S * h;
      const deltaFd =
        (price(type, { ...inputs, S: inputs.S + dS }) -
          price(type, { ...inputs, S: inputs.S - dS })) /
        (2 * dS);
      expect(g.delta).toBeCloseTo(deltaFd, 6);

      // Gamma: [V(S+h) - 2V(S) + V(S-h)] / h^2
      const gammaFd =
        (price(type, { ...inputs, S: inputs.S + dS }) -
          2 * price(type, inputs) +
          price(type, { ...inputs, S: inputs.S - dS })) /
        (dS * dS);
      expect(g.gamma).toBeCloseTo(gammaFd, 5);

      // Vega
      const vegaFd =
        (price(type, { ...inputs, sigma: inputs.sigma + h }) -
          price(type, { ...inputs, sigma: inputs.sigma - h })) /
        (2 * h);
      expect(g.vega).toBeCloseTo(vegaFd, 4);

      // Theta: dV/dt = -dV/dT
      const thetaFd =
        -(
          price(type, { ...inputs, T: inputs.T + h }) -
          price(type, { ...inputs, T: inputs.T - h })
        ) /
        (2 * h);
      expect(g.theta).toBeCloseTo(thetaFd, 4);

      // Rho
      const rhoFd =
        (price(type, { ...inputs, r: inputs.r + h }) -
          price(type, { ...inputs, r: inputs.r - h })) /
        (2 * h);
      expect(g.rho).toBeCloseTo(rhoFd, 4);

      // Vanna: d(delta)/d(sigma)
      const vannaFd =
        (greeks(type, { ...inputs, sigma: inputs.sigma + h }).delta -
          greeks(type, { ...inputs, sigma: inputs.sigma - h }).delta) /
        (2 * h);
      expect(g.vanna).toBeCloseTo(vannaFd, 4);

      // Charm: d(delta)/dt = -d(delta)/dT
      const charmFd =
        -(
          greeks(type, { ...inputs, T: inputs.T + h }).delta -
          greeks(type, { ...inputs, T: inputs.T - h }).delta
        ) /
        (2 * h);
      expect(g.charm).toBeCloseTo(charmFd, 4);

      // Vomma: d(vega)/d(sigma)
      const vommaFd =
        (greeks(type, { ...inputs, sigma: inputs.sigma + h }).vega -
          greeks(type, { ...inputs, sigma: inputs.sigma - h }).vega) /
        (2 * h);
      expect(g.vomma).toBeCloseTo(vommaFd, 3);
    }
  });

  it("deep ITM/OTM deltas approach the e^{-qT}-damped step function", () => {
    expect(greeks("call", { ...atm, S: 300 }).delta).toBeCloseTo(1, 4);
    expect(greeks("call", { ...atm, S: 20 }).delta).toBeCloseTo(0, 4);
    expect(greeks("put", { ...atm, S: 20 }).delta).toBeCloseTo(-Math.exp(-atm.q), 4);
  });
});

describe("implied volatility solver", () => {
  it("round-trips: sigma -> price -> impliedVol recovers sigma", () => {
    const sigmas = [0.05, 0.2, 0.55, 1.5];
    for (const sigma of sigmas) {
      for (const type of ["call", "put"] as const) {
        const inputs = { ...atm, sigma };
        const p = price(type, inputs);
        const iv = impliedVol(type, p, atm);
        expect(iv).not.toBeNull();
        expect(iv!).toBeCloseTo(sigma, 6);
      }
    }
  });

  it("handles OTM wings where vega is small", () => {
    const inputs: BsmInputs = { S: 100, K: 160, T: 0.25, r: 0.05, sigma: 0.3, q: 0.01 };
    const p = price("call", inputs);
    expect(impliedVol("call", p, inputs)!).toBeCloseTo(0.3, 5);
  });

  it("rejects prices outside no-arbitrage bounds", () => {
    expect(impliedVol("call", 0.001, atm)).toBeNull(); // below the sigma->0 lower bound (~4.88 here)
    expect(impliedVol("call", 101, atm)).toBeNull(); // above S e^{-qT}
    expect(impliedVol("call", -1, atm)).toBeNull();
  });
});

describe("strategy positions", () => {
  const mkt = { S: 100, T: 0.25, r: 0.05, sigma: 0.25, q: 0 };

  it("straddle payoff is V-shaped around the strike", () => {
    const straddle = presetStrategies(100).find((s) => s.name === "Long Straddle")!;
    expect(positionPayoff(straddle.legs, 100)).toBe(0);
    expect(positionPayoff(straddle.legs, 120)).toBe(20);
    expect(positionPayoff(straddle.legs, 80)).toBe(20);
  });

  it("straddle is near delta-neutral and long gamma/vega, short theta", () => {
    const straddle = presetStrategies(100).find((s) => s.name === "Long Straddle")!;
    const g = positionGreeks(straddle.legs, mkt);
    expect(Math.abs(g.delta)).toBeLessThan(0.15);
    expect(g.gamma).toBeGreaterThan(0);
    expect(g.vega).toBeGreaterThan(0);
    expect(g.theta).toBeLessThan(0);
  });

  it("bull call spread payoff is capped between the strikes", () => {
    const spread = presetStrategies(100).find((s) => s.name === "Bull Call Spread")!;
    expect(positionPayoff(spread.legs, 90)).toBe(0);
    expect(positionPayoff(spread.legs, 200)).toBe(5); // 105 - 100
  });

  it("covered call delta is below 1 (short call offsets stock)", () => {
    const cc = presetStrategies(100).find((s) => s.name === "Covered Call")!;
    const g = positionGreeks(cc.legs, mkt);
    expect(g.delta).toBeLessThan(1);
    expect(g.delta).toBeGreaterThan(0.4);
    expect(g.gamma).toBeLessThan(0); // short optionality
  });
});
