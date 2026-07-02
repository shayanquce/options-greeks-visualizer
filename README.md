# The Greeks: an options risk visualizer

An interactive **Black-Scholes-Merton** pricing and Greeks visualizer with a
print-inspired, research-note interface. Built with React + TypeScript, with the
quantitative engine fully separated from the UI and unit-tested against textbook
reference values.

**Features**

- Closed-form BSM pricing for European calls and puts with continuous dividend yield
- Analytic first-order Greeks (Delta, Gamma, Theta, Vega, Rho) **and** second-order
  Greeks (Vanna, Charm, Vomma), with no finite-difference approximations
- Implied volatility solver (Newton-Raphson with bisection safeguard)
- Fully reactive: every chart and readout updates live as inputs move
- **Greek curves**: small-multiples of each Greek vs. spot, live spot marked
- **Payoff diagram**: P&L at expiry vs. today's value curve, profit/loss zones shaded
- **Greek surface**: heatmap of any Greek over spot x time-to-expiry (watch the
  gamma ridge sharpen into expiry)
- **Time decay animation**: plays the value curve collapsing onto intrinsic value
- **Strategy builder**: straddles, spreads, covered calls, protective puts, iron
  condors, with combined payoff and net position Greeks; legs fully editable
- **Greeks reference**: a definitions section at the bottom of the app covering every
  Greek, its formula, and what it means in practice

## Running locally

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run build    # type-check + production build to dist/
```

Deployment: the repo is Vercel-ready (`vercel.json` included). Import the repo in
Vercel or run `npx vercel`. Any static host works; the build output is `dist/`.

## The finance

### Model

European options are priced under the Black-Scholes-Merton model with a continuous
dividend yield `q`. Under the risk-neutral measure the underlying follows

```
dS = (r − q) S dt + σ S dW
```

with

```
d₁ = [ln(S/K) + (r − q + σ²/2)T] / (σ√T)
d₂ = d₁ − σ√T

Call = S·e^(−qT)·N(d₁) − K·e^(−rT)·N(d₂)
Put  = K·e^(−rT)·N(−d₂) − S·e^(−qT)·N(−d₁)
```

`N(·)` is evaluated with Hart's rational approximation (West, 2005), accurate to
~1e-14, the same algorithm used in production pricing libraries.

### Greeks

All Greeks are implemented in closed form (see
[`src/lib/blackScholes.ts`](src/lib/blackScholes.ts): every formula is written out in
the comments). Display conventions follow desk practice: **theta and charm per
calendar day**, **vega, rho, vanna, and vomma per 1 percentage point**.

| Greek | Symbol | Definition | Intuition |
| --- | --- | --- | --- |
| Delta | Δ | ∂V/∂S | equivalent share exposure / hedge ratio |
| Gamma | Γ | ∂²V/∂S² | convexity of delta, peaks ATM near expiry |
| Theta | Θ | ∂V/∂t | time decay, usually negative for long options |
| Vega | ν | ∂V/∂σ | sensitivity to implied volatility |
| Rho | ρ | ∂V/∂r | sensitivity to the risk-free rate |
| Vanna | | ∂²V/∂S∂σ | how delta shifts when vol moves (skew risk) |
| Charm | | −∂²V/∂S∂t | delta decay through time, even if spot is flat |
| Vomma | | ∂²V/∂σ² | vega convexity; how vega itself moves with vol |

The full glossary with plain-language definitions also renders at the bottom of the
live app.

### Implied volatility

The solver inverts the pricing function with Newton-Raphson using analytic vega,
seeded with the Brenner-Subrahmanyam approximation and bracketed by bisection.
Because vega > 0 for T > 0, the BSM price is strictly monotone in σ and the root is
unique; inputs outside no-arbitrage bounds are rejected rather than "solved".

### Assumptions (and what they mean)

- **European exercise**: no early exercise premium; don't use this for deep-ITM
  American puts or calls on high-dividend stocks.
- **Constant σ, r, q**: flat vol surface and yield curve; real markets have skew and
  term structure. The visualizer holds the panel's σ fixed across the whole surface.
- **Frictionless markets**: no transaction costs, continuous hedging, no funding
  spread.
- **Theta convention**: quoted per calendar day (÷365) as on most desks.

## Code layout

```
src/
  lib/
    blackScholes.ts       pricing engine: BSM, all Greeks, IV solver (pure functions)
    strategies.ts         multi-leg positions: payoff, cost, additive net Greeks
    blackScholes.test.ts  unit tests: Hull reference values, put-call parity,
                          analytic-vs-finite-difference Greeks, IV round-trips
    format.ts / colorScale.ts
  components/             UI only, no math lives here (includes GreeksGlossary.tsx)
  hooks/useAnimatedNumber.ts
```

The engine is dependency-free and framework-agnostic: `greeks()` returns everything
in one pass, the UI layers on top. Tests validate the analytic Greeks against central
finite differences of the price function, an independent consistency check that
would catch a sign or factor error in any derivative.

---

*Educational tool, not investment advice.*
