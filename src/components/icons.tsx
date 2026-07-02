/**
 * Minimal functional icon set. Tabs and section headers are text-only by
 * design; icons appear only where a symbol genuinely reads faster than a
 * word (transport controls, close, add). 1.5px stroke, round caps.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 14,
  height: 14,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" stroke="none" />
    <rect x="9.25" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8a5 5 0 1 0 5-5" />
    <path d="M3 5.5V3h2.5" />
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

export const IconChevron = (p: P) => (
  <svg {...base(p)} width={12} height={12}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export const IconLinkedIn = (p: P) => (
  <svg width={13} height={13} viewBox="0 0 16 16" fill="currentColor" {...p}>
    <path d="M3.5 2C2.67 2 2 2.67 2 3.5v9c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5h-9Zm1.25 2.5h1.75v6.5H4.75V4.5Zm.88-2.25c.58 0 1.05.47 1.05 1.05 0 .58-.47 1.05-1.05 1.05-.58 0-1.05-.47-1.05-1.05 0-.58.47-1.05 1.05-1.05ZM7.25 4.5h1.67v.89h.02c.23-.44.8-.9 1.65-.9 1.77 0 2.09 1.16 2.09 2.67v3.84H10.5V8.38c0-.72-.01-1.64-1-1.64-.99 0-1.14.78-1.14 1.58v3.04H7.25V4.5Z" />
  </svg>
);
