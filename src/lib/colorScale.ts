/**
 * Color scales for the Greek surface heatmap.
 * Terminal-style ramps: no purple/magenta plasma colormap.
 */

type Rgb = [number, number, number];

const SEQ: Rgb[] = [
  [12, 12, 12],
  [22, 28, 38],
  [38, 52, 72],
  [72, 88, 108],
  [120, 100, 72],
  [180, 120, 48],
  [224, 140, 32],
  [240, 180, 100],
];

const DIV_NEG: Rgb[] = [
  [12, 12, 12],
  [20, 32, 48],
  [40, 68, 96],
  [80, 120, 148],
  [140, 170, 190],
];

const DIV_POS: Rgb[] = [
  [12, 12, 12],
  [48, 32, 20],
  [100, 64, 32],
  [180, 110, 40],
  [230, 170, 90],
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
