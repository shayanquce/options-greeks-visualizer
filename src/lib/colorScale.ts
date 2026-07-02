/**
 * Color scales for the Greek surface heatmap.
 *
 * - Sequential ramp (dark navy -> amber -> pale gold) for one-signed values
 *   (gamma, vega, price ...), loosely modeled on the plasma/inferno family.
 * - Diverging ramp (cyan <- dark -> amber) for signed values (theta, vanna,
 *   charm ...) so zero reads as "dark" and sign is instantly legible.
 */

type Rgb = [number, number, number];

const SEQ: Rgb[] = [
  [10, 13, 22], // #0a0d16
  [23, 34, 66], // #172242
  [44, 62, 118], // #2c3e76
  [95, 74, 152], // #5f4a98
  [163, 80, 137], // #a35089
  [219, 106, 84], // #db6a54
  [245, 166, 35], // #f5a623
  [255, 226, 138], // #ffe28a
];

const DIV_NEG: Rgb[] = [
  [10, 13, 22], // dark center
  [17, 51, 85], // deep blue
  [22, 105, 153], // ocean
  [56, 189, 248], // #38bdf8 cyan
  [186, 240, 255], // pale cyan
];

const DIV_POS: Rgb[] = [
  [10, 13, 22],
  [77, 48, 24],
  [166, 99, 28],
  [245, 166, 35], // amber
  [255, 231, 158], // pale gold
];

function lerpRamp(ramp: Rgb[], t: number): string {
  const x = Math.min(Math.max(t, 0), 1) * (ramp.length - 1);
  const i = Math.min(Math.floor(x), ramp.length - 2);
  const f = x - i;
  const [r1, g1, b1] = ramp[i];
  const [r2, g2, b2] = ramp[i + 1];
  return `rgb(${Math.round(r1 + (r2 - r1) * f)},${Math.round(g1 + (g2 - g1) * f)},${Math.round(
    b1 + (b2 - b1) * f,
  )})`;
}

export function seqColor(t: number): string {
  return lerpRamp(SEQ, t);
}

/** t in [-1, 1]: negative -> cyan side, positive -> amber side. */
export function divColor(t: number): string {
  return t < 0 ? lerpRamp(DIV_NEG, -t) : lerpRamp(DIV_POS, t);
}

/** CSS gradient stops for the legend bar. */
export function legendGradient(diverging: boolean): string {
  const stops: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    stops.push(diverging ? divColor(t * 2 - 1) : seqColor(t));
  }
  return `linear-gradient(to right, ${stops.join(",")})`;
}
