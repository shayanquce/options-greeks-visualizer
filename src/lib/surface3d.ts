/**
 * Minimal 3D math for the Greek surface view: orbit-camera rotation,
 * orthographic projection, and Lambert shading. Hand-rolled on purpose; a
 * height field only needs a rotate -> depth-sort -> paint pipeline, so this
 * stays dependency-free (no WebGL, no three.js) and unit-testable.
 *
 * World frame: x right, y depth (away from the viewer at yaw = 0), z up.
 *
 * View transform (orbit camera):
 *   1. yaw psi about the vertical z-axis:
 *        x' = x cos(psi) - y sin(psi)
 *        y' = x sin(psi) + y cos(psi)
 *   2. pitch theta about the screen x-axis (camera tilts down):
 *        depth = y' cos(theta) - z sin(theta)
 *        up    = y' sin(theta) + z cos(theta)
 *   3. orthographic screen mapping: (x', -up) scaled; depth sorts quads.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Projected {
  /** screen-space horizontal (before scaling) */
  x: number;
  /** screen-space vertical, positive = up (before scaling/flip) */
  up: number;
  /** distance into the screen; larger = farther, used by the painter's sort */
  depth: number;
}

/** Orbit rotation + orthographic projection of a world-space point. */
export function rotate(p: Vec3, yaw: number, pitch: number): Projected {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x1 = p.x * cy - p.y * sy;
  const y1 = p.x * sy + p.y * cy;
  return {
    x: x1,
    depth: y1 * cp - p.z * sp,
    up: y1 * sp + p.z * cp,
  };
}

/**
 * Unit normal of a quad from its two diagonals (a->c and b->d), oriented to
 * point upward (z >= 0) so a height field always lights from above.
 */
export function quadNormal(a: Vec3, b: Vec3, c: Vec3, d: Vec3): Vec3 {
  const u = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const v = { x: d.x - b.x, y: d.y - b.y, z: d.z - b.z };
  let nx = u.y * v.z - u.z * v.y;
  let ny = u.z * v.x - u.x * v.z;
  let nz = u.x * v.y - u.y * v.x;
  if (nz < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-12) return { x: 0, y: 0, z: 1 };
  return { x: nx / len, y: ny / len, z: nz / len };
}

/**
 * Lambert shade factor for a world-space normal under a camera-fixed light.
 * The normal is rotated into camera space so the lighting stays consistent
 * while the user orbits. Returns ambient..1.
 */
export function shadeFactor(
  n: Vec3,
  yaw: number,
  pitch: number,
  ambient = 0.55,
): number {
  // light from upper-left, slightly toward the viewer (camera frame)
  const LX = -0.34;
  const LY = -0.4; // toward viewer (negative depth)
  const LZ = 0.85;
  const r = rotate(n, yaw, pitch);
  const lambert = Math.max(0, r.x * LX + r.depth * LY + r.up * LZ);
  return Math.min(1, ambient + (1 - ambient) * lambert);
}

/** Parse "rgb(r,g,b)" (as produced by colorScale.ts) into components. */
export function parseRgb(s: string): [number, number, number] {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
  if (!m) return [128, 128, 128];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
