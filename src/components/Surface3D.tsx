import { useEffect, useMemo, useRef } from "react";
import { divColor, seqColor } from "../lib/colorScale";
import { parseRgb, quadNormal, rotate, shadeFactor, type Vec3 } from "../lib/surface3d";
import { fmt, fmtTick } from "../lib/format";

interface Props {
  /** value grid, [row][col]; row 0 = highest spot */
  grid: number[][];
  spots: number[];
  dayArr: number[];
  vMin: number;
  vMax: number;
  diverging: boolean;
  label: string;
  unit: string;
  liveS: number;
  liveDays: number;
  strike: number;
}

/** Height of the value axis in world units (box is 2 x 2 in x/y). */
const ZH = 0.85;
const FLOOR = -ZH / 2;
const CANVAS_H = 480;
const INITIAL_VIEW = { yaw: -0.75, pitch: 0.42 };

const COL_EDGE = "#2a2a2a";
const COL_TICK = "#6a6a6a";
const COL_TITLE = "#5c5c5c";
const COL_GUIDE = "rgba(212,212,212,0.35)";
const COL_ACCENT = "#e07b20";
const FONT_TICK = "9px 'IBM Plex Mono', monospace";

interface Quad {
  /** node indices of the four corners */
  a: number;
  b: number;
  c: number;
  d: number;
  rgb: [number, number, number];
  normal: Vec3;
}

/**
 * Rotatable 3D rendering of the Greek surface. Hand-rolled canvas pipeline:
 * project every grid node with the orbit camera, depth-sort the quads
 * (painter's algorithm; a height field has no cycles at viewable pitches),
 * and fill each with its 2D-heatmap color darkened by Lambert shading.
 * Drag to orbit, double-click to reset; auto-rotates gently until touched.
 */
export function Surface3D({
  grid,
  spots,
  dayArr,
  vMin,
  vMax,
  diverging,
  label,
  unit,
  liveS,
  liveDays,
  strike,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef({ ...INITIAL_VIEW });
  const autoRef = useRef(true);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // ----- static world geometry, rebuilt only when the data changes -----
  const scene = useMemo(() => {
    const ROWS = grid.length;
    const COLS = grid[0].length;
    const span = vMax - vMin || 1;
    const m = Math.max(Math.abs(vMin), Math.abs(vMax)) || 1;

    const nodes: Vec3[] = new Array(ROWS * COLS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        nodes[r * COLS + c] = {
          x: -1 + (2 * c) / (COLS - 1), // time axis
          y: 1 - (2 * r) / (ROWS - 1), // spot axis (row 0 = far side)
          z: FLOOR + (ZH * (grid[r][c] - vMin)) / span,
        };
      }
    }

    const quads: Quad[] = [];
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const a = r * COLS + c;
        const b = r * COLS + c + 1;
        const cc = (r + 1) * COLS + c + 1;
        const d = (r + 1) * COLS + c;
        const avg = (grid[r][c] + grid[r][c + 1] + grid[r + 1][c + 1] + grid[r + 1][c]) / 4;
        const css = diverging ? divColor(avg / m) : seqColor((avg - vMin) / span);
        quads.push({ a, b, c: cc, d, rgb: parseRgb(css), normal: quadNormal(nodes[a], nodes[b], nodes[cc], nodes[d]) });
      }
    }

    // world z of the zero plane, only meaningful for diverging data
    const zeroZ = FLOOR + (ZH * (0 - vMin)) / span;
    return { ROWS, COLS, nodes, quads, zeroZ };
  }, [grid, vMin, vMax, diverging]);

  // ----- imperative draw -----
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = CANVAS_H;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { yaw, pitch } = viewRef.current;
    const { ROWS, COLS, nodes, quads, zeroZ } = scene;
    const scale = Math.min(w / 3.1, h / 2.3);
    const cx = w / 2;
    const cy = h / 2 + scale * 0.06;

    // project all nodes once per frame
    const px = new Float64Array(nodes.length);
    const py = new Float64Array(nodes.length);
    const pd = new Float64Array(nodes.length);
    for (let i = 0; i < nodes.length; i++) {
      const p = rotate(nodes[i], yaw, pitch);
      px[i] = cx + p.x * scale;
      py[i] = cy - p.up * scale;
      pd[i] = p.depth;
    }

    const proj = (v: Vec3) => {
      const p = rotate(v, yaw, pitch);
      return { x: cx + p.x * scale, y: cy - p.up * scale, depth: p.depth };
    };

    // ----- floor box + grid lines -----
    const corners = [
      { x: -1, y: -1, z: FLOOR },
      { x: 1, y: -1, z: FLOOR },
      { x: 1, y: 1, z: FLOOR },
      { x: -1, y: 1, z: FLOOR },
    ].map(proj);
    ctx.strokeStyle = COL_EDGE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    // sparse floor grid
    for (let i = 1; i < 4; i++) {
      const t = -1 + i / 2;
      const g1 = proj({ x: t, y: -1, z: FLOOR });
      const g2 = proj({ x: t, y: 1, z: FLOOR });
      const g3 = proj({ x: -1, y: t, z: FLOOR });
      const g4 = proj({ x: 1, y: t, z: FLOOR });
      ctx.moveTo(g1.x, g1.y);
      ctx.lineTo(g2.x, g2.y);
      ctx.moveTo(g3.x, g3.y);
      ctx.lineTo(g4.x, g4.y);
    }
    ctx.stroke();

    // vertical value axis at the farthest floor corner
    const farIdx = corners.reduce((best, c, i) => (c.depth > corners[best].depth ? i : best), 0);
    const farWorld = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ][farIdx];
    const axTop = proj({ ...farWorld, z: FLOOR + ZH });
    ctx.beginPath();
    ctx.moveTo(corners[farIdx].x, corners[farIdx].y);
    ctx.lineTo(axTop.x, axTop.y);
    ctx.stroke();

    // ----- surface: painter's algorithm -----
    const order = quads
      .map((q, i) => ({ i, depth: pd[q.a] + pd[q.b] + pd[q.c] + pd[q.d] }))
      .sort((u, v) => v.depth - u.depth);
    for (const { i } of order) {
      const q = quads[i];
      const f = shadeFactor(q.normal, yaw, pitch);
      const col = `rgb(${Math.round(q.rgb[0] * f)},${Math.round(q.rgb[1] * f)},${Math.round(q.rgb[2] * f)})`;
      ctx.fillStyle = col;
      ctx.strokeStyle = col; // stroke in the fill color seals antialiasing seams
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px[q.a], py[q.a]);
      ctx.lineTo(px[q.b], py[q.b]);
      ctx.lineTo(px[q.c], py[q.c]);
      ctx.lineTo(px[q.d], py[q.d]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // ----- strike guide: polyline along the row nearest K -----
    const sHi = spots[0];
    const sLo = spots[ROWS - 1];
    if (strike >= sLo && strike <= sHi) {
      const rK = Math.round(((sHi - strike) / (sHi - sLo)) * (ROWS - 1));
      ctx.strokeStyle = COL_GUIDE;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let c = 0; c < COLS; c++) {
        const i = rK * COLS + c;
        if (c === 0) ctx.moveTo(px[i], py[i]);
        else ctx.lineTo(px[i], py[i]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      const endI = rK * COLS + (COLS - 1);
      ctx.fillStyle = "#8a8a8a";
      ctx.font = FONT_TICK;
      ctx.textAlign = "left";
      ctx.fillText(`K ${fmt(strike, 0)}`, px[endI] + 5, py[endI] - 3);
    }

    // ----- zero plane outline for signed Greeks -----
    if (diverging && zeroZ > FLOOR + 0.01 && zeroZ < FLOOR + ZH - 0.01) {
      ctx.strokeStyle = "rgba(212,212,212,0.14)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      const zc = [
        proj({ x: -1, y: -1, z: zeroZ }),
        proj({ x: 1, y: -1, z: zeroZ }),
        proj({ x: 1, y: 1, z: zeroZ }),
        proj({ x: -1, y: 1, z: zeroZ }),
      ];
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(zc[i].x, zc[i].y);
        ctx.lineTo(zc[(i + 1) % 4].x, zc[(i + 1) % 4].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ----- live (S, T) marker -----
    const dayLo = dayArr[0];
    const dayHi = dayArr[COLS - 1];
    if (liveS >= sLo && liveS <= sHi && liveDays >= dayLo && liveDays <= dayHi) {
      const xw = -1 + (2 * (liveDays - dayLo)) / (dayHi - dayLo);
      const yw = 1 - (2 * (sHi - liveS)) / (sHi - sLo);
      // bilinear interpolation of the surface height
      const cf = ((liveDays - dayLo) / (dayHi - dayLo)) * (scene.COLS - 1);
      const rf = ((sHi - liveS) / (sHi - sLo)) * (ROWS - 1);
      const c0 = Math.min(Math.floor(cf), COLS - 2);
      const r0 = Math.min(Math.floor(rf), ROWS - 2);
      const fc = cf - c0;
      const fr = rf - r0;
      const v =
        grid[r0][c0] * (1 - fr) * (1 - fc) +
        grid[r0][c0 + 1] * (1 - fr) * fc +
        grid[r0 + 1][c0] * fr * (1 - fc) +
        grid[r0 + 1][c0 + 1] * fr * fc;
      const zw = FLOOR + (ZH * (v - vMin)) / (vMax - vMin || 1);
      const base = proj({ x: xw, y: yw, z: FLOOR });
      const top = proj({ x: xw, y: yw, z: zw });
      ctx.strokeStyle = COL_ACCENT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
      ctx.fillStyle = COL_ACCENT;
      ctx.beginPath();
      ctx.arc(top.x, top.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ----- axis ticks & titles -----
    ctx.font = FONT_TICK;
    ctx.fillStyle = COL_TICK;

    // nearest floor corner picks which two edges carry labels
    const nearIdx = corners.reduce((best, c, i) => (c.depth < corners[best].depth ? i : best), 0);
    const near = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ][nearIdx];

    // time ticks along the x-edge at the near y side
    for (const t of [0, 0.5, 1]) {
      const day = dayLo + t * (dayHi - dayLo);
      const p = proj({ x: -1 + 2 * t, y: near.y * 1.12, z: FLOOR });
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(day)}d`, p.x, p.y + 4);
    }
    // spot ticks along the y-edge at the near x side
    for (const t of [0, 0.5, 1]) {
      const spot = sLo + t * (sHi - sLo);
      const p = proj({ x: near.x * 1.12, y: -1 + 2 * t, z: FLOOR });
      ctx.textAlign = "center";
      ctx.fillText(fmtTick(spot), p.x, p.y + 4);
    }
    // value axis labels on the far vertical axis
    ctx.textAlign = farWorld.x * Math.cos(yaw) - farWorld.y * Math.sin(yaw) > 0 ? "left" : "right";
    const off = ctx.textAlign === "left" ? 6 : -6;
    ctx.fillText(fmt(vMin, Math.abs(vMin) < 1 ? 3 : 1), corners[farIdx].x + off, corners[farIdx].y + 3);
    ctx.fillText(fmt(vMax, Math.abs(vMax) < 1 ? 3 : 1), axTop.x + off, axTop.y + 3);

    // axis titles at edge midpoints
    ctx.fillStyle = COL_TITLE;
    ctx.textAlign = "center";
    const tTime = proj({ x: 0, y: near.y * 1.3, z: FLOOR });
    ctx.fillText("days to expiry", tTime.x, tTime.y + 4);
    const tSpot = proj({ x: near.x * 1.3, y: 0, z: FLOOR });
    ctx.fillText("spot", tSpot.x, tSpot.y + 4);
    const tVal = proj({ ...farWorld, z: FLOOR + ZH + 0.12 });
    ctx.fillText(`${label}${unit ? ` (${unit})` : ""}`, tVal.x, tVal.y);
  };

  // redraw when data changes; keep a gentle auto-orbit until first drag
  useEffect(() => {
    draw();
    let raf = 0;
    const tick = () => {
      if (autoRef.current && !dragRef.current) {
        viewRef.current.yaw += 0.0022;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, liveS, liveDays, strike, label, unit]);

  // ----- pointer orbit -----
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointers: drag still works via move events */
    }
    dragRef.current = { x: e.clientX, y: e.clientY };
    autoRef.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    viewRef.current.yaw += dx * 0.008;
    viewRef.current.pitch = Math.min(1.35, Math.max(0.08, viewRef.current.pitch + dy * 0.006));
    draw();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer was never captured */
    }
    dragRef.current = null;
  };
  const onDoubleClick = () => {
    viewRef.current = { ...INITIAL_VIEW };
    autoRef.current = true;
    draw();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block w-full cursor-grab active:cursor-grabbing"
        style={{ height: CANVAS_H, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
      <div className="pointer-events-none absolute left-3 top-2 text-[10px] text-faint">
        drag to rotate · double-click to reset
      </div>
    </div>
  );
}
