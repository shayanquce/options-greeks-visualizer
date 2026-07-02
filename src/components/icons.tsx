/** Terminal-style icons: square grid, 1.25px stroke, no rounded flourishes. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 14,
  height: 14,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  ...p,
});

export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3v10l8-5-8-5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="3" height="10" fill="currentColor" stroke="none" />
    <rect x="9" y="3" width="3" height="10" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8a5 5 0 1 0 5-5" />
    <path d="M3 5V3h2" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconCurves = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12h2l2-6 2 3 2-5 2 4 2-2h0" />
  </svg>
);

export const IconPayoff = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12V4l4 4 3-3 5 7" />
    <path d="M2 14h12" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="2" width="12" height="12" />
    <path d="M2 6h12M2 10h12M6 2v12M10 2v12" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="10" height="10" />
    <path d="M8 5v4h3" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 5l6-3 6 3-6 3-6-3Z" />
    <path d="M2 9l6 3 6-3" />
    <path d="M2 13l6 3 6-3" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="10" height="10" />
    <path d="M8 3v10M3 8h10" />
  </svg>
);
