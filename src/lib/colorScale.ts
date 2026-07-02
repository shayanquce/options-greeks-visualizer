/**
 * Color scales for the Greek surface heatmap, tuned for the paper-light
 * theme: values ramp from the page ground into saturated print inks.
 */

type Rgb = [number, number, number];

/** Sequential: paper -> gold -> sienna -> dark umber. */
const SEQ: Rgb[] = [
  [242, 239, 230],
  [235, 220, 184],
  [224, 190, 130],
  [204, 148, 80],
  [168, 99, 48],
  [122, 64, 30],
  [72, 39, 20],
];

/** Diverging negative side: paper -> deep slate blue. */
const DIV_NEG: Rgb[] = [
  [242, 239, 230],
  [209, 216, 216],
  [156, 180, 193],
  [99, 136, 163],
  [47, 87, 120],
];

/** Diverging positive side: paper -> brick red. */
const DIV_POS: Rgb[] = [
  [242, 239, 230],
  [233, 208, 186],
  [216, 162, 129],
  [187, 111, 79],
  [146, 61, 44],
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

export function divColor(t: number): string {
  return t < 0 ? lerpRamp(DIV_NEG, -t) : lerpRamp(DIV_POS, t);
}

export function legendGradient(diverging: boolean): string {
  const stops: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    stops.push(diverging ? divColor(t * 2 - 1) : seqColor(t));
  }
  return `linear-gradient(to right, ${stops.join(",")})`;
}
