/**
 * Mark: a normal density curve over its baseline, the picture behind every
 * formula in the app. Curve drawn in ink, baseline in the accent sienna.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 23c5.8 0 6.2-15.5 11.5-15.5S20.7 23 26.5 23"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="9"
        x2="15"
        y2="23"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeDasharray="1.5 2.5"
      />
      <path d="M3.5 23h23" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
