/**
 * Black-Scholes-Merton pricing engine for European options on an asset
 * paying a continuous dividend yield q.
 *
 * Model assumptions:
 *  - European exercise (no early exercise)
 *  - Geometric Brownian motion: dS = (r - q) S dt + \sigma S dW  (risk-neutral)
 *  - Constant volatility \sigma, risk-free rate r, dividend yield q
 *  - Frictionless markets: no transaction costs, continuous hedging
 *
 * Notation used throughout:
 *   S     spot price
 *   K     strike price
 *   T     time to expiry in YEARS
 *   r     continuously-compounded risk-free rate (decimal, e.g. 0.05)
 *   sigma annualized volatility (decimal, e.g. 0.20)
 *   q     continuous dividend yield (decimal)
 *
 *   d1 = [ ln(S/K) + (r - q + \sigma^2/2) T ] / (\sigma \sqrt{T})
 *   d2 = d1 - \sigma \sqrt{T}
 *
 * All Greeks below are the analytic (closed-form) expressions, not finite
 * differences. Unit conventions are documented per Greek; the raw values are
 * "per unit" (per 1.00 of vol / rate / year) — UI-friendly rescaling
 * (per 1% vol, per calendar day) is left to the presentation layer.
 */

export type OptionType = "call" | "put";

export interface BsmInputs {
  S: number;
  K: number;
  T: number; // years
  r: number;
  sigma: number;
  q: number;
}

export interface Greeks {
  /** Theoretical option value */
  price: number;
  /** dV/dS */
  delta: number;
  /** d²V/dS² (identical for calls and puts) */
  gamma: number;
  /** dV/dT per YEAR (holding calendar date conventions to the caller) */
  theta: number;
  /** dV/dsigma per 1.00 of vol (divide by 100 for per vol-point) */
  vega: number;
  /** dV/dr per 1.00 of rate (divide by 100 for per 1% rate move) */
  rho: number;
  /** d²V/dS dsigma — sensitivity of delta to vol (per 1.00 vol) */
  vanna: number;
  /** -d²V/dS dT — delta decay per YEAR */
  charm: number;
  /** d²V/dsigma² — vega convexity (per 1.00 vol) */
  vomma: number;
}

/** Standard normal PDF:  \phi(x) = e^{-x^2/2} / \sqrt{2\pi} */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard normal CDF, N(x), using Hart's 1968 rational approximation as
 * presented in West, "Better approximations to cumulative normal functions"
 * (Wilmott, 2005). Accurate to ~1e-14 (near double precision) across the
 * whole real line — the same algorithm used in production pricing libraries.
 * That precision matters here because the unit tests validate the analytic
 * Greeks against finite differences of this function.
 */
export function normCdf(x: number): number {
  const z = Math.abs(x);
  let c: number;
  if (z > 37) {
    c = 0;
  } else {
    const e = Math.exp((-z * z) / 2);
    if (z < 7.07106781186547) {
      // Rational polynomial region (Hart's algorithm 5666)
      let n = 3.52624965998911e-2 * z + 0.700383064443688;
      n = n * z + 6.37396220353165;
      n = n * z + 33.912866078383;
      n = n * z + 112.079291497871;
      n = n * z + 221.213596169931;
      n = n * z + 220.206867912376;
      let d = 8.83883476483184e-2 * z + 1.75566716318264;
      d = d * z + 16.064177579207;
      d = d * z + 86.7807322029461;
      d = d * z + 296.564248779674;
      d = d * z + 637.333633378831;
      d = d * z + 793.826512519948;
      d = d * z + 440.413735824752;
      c = (e * n) / d;
    } else {
      // Continued-fraction tail expansion
      const f = z + 1 / (z + 2 / (z + 3 / (z + 4 / (z + 0.65))));
      c = e / (f * 2.506628274631);
    }
  }
  return x > 0 ? 1 - c : c;
}

/** d1 and d2 of the BSM formula. Assumes T > 0 and sigma > 0. */
export function d1d2({ S, K, T, r, sigma, q }: BsmInputs): {
  d1: number;
  d2: number;
} {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  return { d1, d2: d1 - sigma * sqrtT };
}

/** Intrinsic value — the option's value at expiry (or in the sigma -> 0, T -> 0 limit). */
export function intrinsic(type: OptionType, S: number, K: number): number {
  return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
}

/**
 * BSM theoretical value.
 *
 *   Call: C = S e^{-qT} N(d1) - K e^{-rT} N(d2)
 *   Put:  P = K e^{-rT} N(-d2) - S e^{-qT} N(-d1)
 *
 * Degenerate limits (T = 0 or sigma = 0) collapse to (discounted) intrinsic
 * value so the UI can sweep sliders to the boundary without NaNs.
 */
export function price(type: OptionType, inputs: BsmInputs): number {
  const { S, K, T, r, sigma, q } = inputs;
  if (T <= 0) return intrinsic(type, S, K);
  if (sigma <= 0) {
    // Deterministic forward: value is discounted intrinsic on the forward price
    const fwd = S * Math.exp((r - q) * T);
    return Math.exp(-r * T) * intrinsic(type, fwd, K);
  }
  const { d1, d2 } = d1d2(inputs);
  const dfq = Math.exp(-q * T); // dividend discount factor e^{-qT}
  const dfr = Math.exp(-r * T); // rate discount factor    e^{-rT}
  if (type === "call") {
    return S * dfq * normCdf(d1) - K * dfr * normCdf(d2);
  }
  return K * dfr * normCdf(-d2) - S * dfq * normCdf(-d1);
}

/**
 * All Greeks in one pass (shares d1/d2 and discount factors).
 *
 * First order:
 *   Delta_call = e^{-qT} N(d1)            Delta_put = e^{-qT} (N(d1) - 1)
 *   Gamma      = e^{-qT} \phi(d1) / (S \sigma \sqrt{T})
 *   Vega       = S e^{-qT} \phi(d1) \sqrt{T}
 *   Theta_call = -S e^{-qT} \phi(d1) \sigma / (2\sqrt{T})
 *                - r K e^{-rT} N(d2) + q S e^{-qT} N(d1)
 *   Theta_put  = -S e^{-qT} \phi(d1) \sigma / (2\sqrt{T})
 *                + r K e^{-rT} N(-d2) - q S e^{-qT} N(-d1)
 *   Rho_call   =  K T e^{-rT} N(d2)       Rho_put = -K T e^{-rT} N(-d2)
 *
 * Second order:
 *   Vanna = -e^{-qT} \phi(d1) d2 / \sigma          (dDelta/dsigma = dVega/dS)
 *   Charm_call = q e^{-qT} N(d1)
 *                - e^{-qT} \phi(d1) [ 2(r-q)T - d2 \sigma \sqrt{T} ] / (2 T \sigma \sqrt{T})
 *   Charm_put  = -q e^{-qT} N(-d1)  - (same \phi(d1) term)
 *   Vomma = Vega * d1 d2 / \sigma                  (dVega/dsigma)
 */
export function greeks(type: OptionType, inputs: BsmInputs): Greeks {
  const { S, K, T, r, sigma, q } = inputs;
  if (T <= 0 || sigma <= 0) {
    // At the boundary the option behaves like its intrinsic payoff:
    // delta is a step function, all convexity/vol/time sensitivities vanish.
    const itm =
      type === "call" ? (S > K ? 1 : S === K ? 0.5 : 0) : S < K ? -1 : S === K ? -0.5 : 0;
    return {
      price: price(type, inputs),
      delta: itm,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      vanna: 0,
      charm: 0,
      vomma: 0,
    };
  }

  const { d1, d2 } = d1d2(inputs);
  const sqrtT = Math.sqrt(T);
  const dfq = Math.exp(-q * T);
  const dfr = Math.exp(-r * T);
  const nd1 = normCdf(d1);
  const nd2 = normCdf(d2);
  const pdf1 = normPdf(d1);

  const call = type === "call";

  const delta = call ? dfq * nd1 : dfq * (nd1 - 1);
  const gamma = (dfq * pdf1) / (S * sigma * sqrtT);
  const vega = S * dfq * pdf1 * sqrtT;

  const thetaCommon = (-S * dfq * pdf1 * sigma) / (2 * sqrtT);
  const theta = call
    ? thetaCommon - r * K * dfr * nd2 + q * S * dfq * nd1
    : thetaCommon + r * K * dfr * normCdf(-d2) - q * S * dfq * normCdf(-d1);

  const rho = call ? K * T * dfr * nd2 : -K * T * dfr * normCdf(-d2);

  const vanna = (-dfq * pdf1 * d2) / sigma;

  const charmCommon =
    (-dfq * pdf1 * (2 * (r - q) * T - d2 * sigma * sqrtT)) / (2 * T * sigma * sqrtT);
  const charm = call ? q * dfq * nd1 + charmCommon : -q * dfq * normCdf(-d1) + charmCommon;

  const vomma = (vega * d1 * d2) / sigma;

  return {
    price: price(type, inputs),
    delta,
    gamma,
    theta,
    vega,
    rho,
    vanna,
    charm,
    vomma,
  };
}

/**
 * Implied volatility via Newton-Raphson with a bisection safeguard.
 *
 * Newton step:  \sigma_{n+1} = \sigma_n - (BSM(\sigma_n) - target) / Vega(\sigma_n)
 *
 * Vega of a European option is strictly positive for T > 0, so BSM price is
 * monotone increasing in sigma and the root is unique when it exists. When a
 * Newton step leaves the current bracket (or vega is tiny deep ITM/OTM), we
 * fall back to bisection on the maintained [lo, hi] bracket — this keeps the
 * quadratic convergence of Newton near the root with the global robustness
 * of bisection.
 *
 * Returns null when the target price is outside the no-arbitrage bounds
 * (below discounted intrinsic or above the sigma -> infinity limit).
 */
export function impliedVol(
  type: OptionType,
  target: number,
  inputs: Omit<BsmInputs, "sigma">,
  tol = 1e-8,
  maxIter = 100,
): number | null {
  const { S, K, T, r, q } = inputs;
  if (T <= 0 || target <= 0) return null;

  // No-arbitrage bounds: e^{-rT} E[payoff] in the sigma->0 and sigma->inf limits.
  const lower = price(type, { ...inputs, sigma: 0 });
  const upper = type === "call" ? S * Math.exp(-q * T) : K * Math.exp(-r * T);
  if (target < lower - 1e-12 || target > upper + 1e-12) return null;

  let lo = 1e-6;
  let hi = 5; // 500% vol upper bracket, expanded below if needed
  while (price(type, { ...inputs, sigma: hi }) < target && hi < 100) hi *= 2;

  // Brenner-Subrahmanyam ATM approximation as the initial guess:
  //   sigma ~ sqrt(2*pi / T) * price / S
  let sigma = Math.min(Math.max((Math.sqrt((2 * Math.PI) / T) * target) / S, 0.05), hi);

  for (let i = 0; i < maxIter; i++) {
    const p = price(type, { ...inputs, sigma });
    const diff = p - target;
    if (Math.abs(diff) < tol) return sigma;

    if (diff > 0) hi = sigma;
    else lo = sigma;

    const v = greeks(type, { ...inputs, sigma }).vega;
    const newton = sigma - diff / v;
    // Accept the Newton step only if it stays inside the bracket
    sigma = newton > lo && newton < hi ? newton : 0.5 * (lo + hi);
  }
  return sigma;
}
