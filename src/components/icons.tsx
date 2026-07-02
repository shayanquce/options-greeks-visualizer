/** Minimal inline icon set — 1.6px stroke, currentColor, 16px grid. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 14,
  height: 14,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3.5" width="2.6" height="9" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="9.4" y="3.5" width="2.6" height="9" rx="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8a5 5 0 1 1 1.6 3.7" />
    <path d="M3 12.5V8.4h4.1" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
);

export const IconCurves = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 13c2.5 0 3.5-8 6-8s3.5 8 6 8" />
  </svg>
);

export const IconPayoff = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 11l4.5-4.5 3 3L14 4" />
    <path d="M2 14h12" opacity="0.5" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
    <path d="M2.5 6.2h11M2.5 9.8h11M6.2 2.5v11M9.8 2.5v11" opacity="0.6" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.4" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.5l5.5 2.8L8 8 2.5 5.3 8 2.5Z" />
    <path d="M2.5 8.2 8 11l5.5-2.8" opacity="0.6" />
    <path d="M2.5 11 8 13.7 13.5 11" opacity="0.35" />
  </svg>
);

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="5.5" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);
