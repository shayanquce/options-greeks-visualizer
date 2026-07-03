import { describe, expect, it } from "vitest";
import { parseRgb, quadNormal, rotate, shadeFactor } from "./surface3d";

describe("rotate (orbit projection)", () => {
  it("is the identity at yaw = 0, pitch = 0", () => {
    const p = rotate({ x: 1, y: 2, z: 3 }, 0, 0);
    expect(p.x).toBeCloseTo(1, 12);
    expect(p.depth).toBeCloseTo(2, 12);
    expect(p.up).toBeCloseTo(3, 12);
  });

  it("yaw of 90 degrees sends +x into the screen", () => {
    const p = rotate({ x: 1, y: 0, z: 0 }, Math.PI / 2, 0);
    expect(p.x).toBeCloseTo(0, 12);
    expect(p.depth).toBeCloseTo(1, 12);
    expect(p.up).toBeCloseTo(0, 12);
  });

  it("pitch of 90 degrees looks straight down: depth becomes -z, up becomes y", () => {
    const p = rotate({ x: 0, y: 1, z: 0 }, 0, Math.PI / 2);
    expect(p.depth).toBeCloseTo(0, 12);
    expect(p.up).toBeCloseTo(1, 12);
    const q = rotate({ x: 0, y: 0, z: 1 }, 0, Math.PI / 2);
    expect(q.depth).toBeCloseTo(-1, 12);
    expect(q.up).toBeCloseTo(0, 12);
  });

  it("preserves vector length (pure rotation, no scaling)", () => {
    const p = { x: 0.3, y: -1.2, z: 0.7 };
    const len = Math.hypot(p.x, p.y, p.z);
    for (const [yaw, pitch] of [
      [0.5, 0.3],
      [-2.1, 1.0],
      [3.0, 0.05],
    ]) {
      const r = rotate(p, yaw, pitch);
      expect(Math.hypot(r.x, r.depth, r.up)).toBeCloseTo(len, 10);
    }
  });

  it("farther points sort behind nearer points at a typical view angle", () => {
    const near = rotate({ x: 0, y: -1, z: 0 }, -0.7, 0.4);
    const far = rotate({ x: 0, y: 1, z: 0 }, -0.7, 0.4);
    expect(far.depth).toBeGreaterThan(near.depth);
  });
});

describe("quadNormal", () => {
  it("returns +z for a flat quad in the xy-plane regardless of winding", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 0, z: 0 };
    const c = { x: 1, y: 1, z: 0 };
    const d = { x: 0, y: 1, z: 0 };
    for (const n of [quadNormal(a, b, c, d), quadNormal(d, c, b, a)]) {
      expect(n.x).toBeCloseTo(0, 12);
      expect(n.y).toBeCloseTo(0, 12);
      expect(n.z).toBeCloseTo(1, 12);
    }
  });

  it("tilts toward -x for a surface rising in +x", () => {
    // z = x plane: normal should be (-1, 0, 1) / sqrt(2)
    const n = quadNormal(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: 0, y: 1, z: 0 },
    );
    expect(n.x).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(n.y).toBeCloseTo(0, 6);
    expect(n.z).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it("degenerate quad falls back to straight up", () => {
    const p = { x: 0.5, y: 0.5, z: 0.5 };
    const n = quadNormal(p, p, p, p);
    expect(n).toEqual({ x: 0, y: 0, z: 1 });
  });
});

describe("shadeFactor", () => {
  it("stays within [ambient, 1]", () => {
    for (const yaw of [-2, 0, 1.3]) {
      for (const pitch of [0.1, 0.7, 1.3]) {
        const f = shadeFactor({ x: 0, y: 0, z: 1 }, yaw, pitch, 0.55);
        expect(f).toBeGreaterThanOrEqual(0.55);
        expect(f).toBeLessThanOrEqual(1);
      }
    }
  });

  it("an upward face is brighter than a steep side face at the default view", () => {
    const up = shadeFactor({ x: 0, y: 0, z: 1 }, -0.7, 0.4);
    const side = shadeFactor({ x: 0.98, y: 0, z: 0.2 }, -0.7, 0.4);
    expect(up).toBeGreaterThan(side);
  });
});

describe("parseRgb", () => {
  it("parses the colorScale output format", () => {
    expect(parseRgb("rgb(12, 34, 56)")).toEqual([12, 34, 56]);
    expect(parseRgb("rgb(240,180,100)")).toEqual([240, 180, 100]);
  });

  it("falls back to grey on malformed input", () => {
    expect(parseRgb("#e07b20")).toEqual([128, 128, 128]);
  });
});
