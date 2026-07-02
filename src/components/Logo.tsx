/** Payoff-curve mark: flat then rising, like a long call at expiry. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
    >
      <path d="M3 19h7l5-10 8-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M3 22h20" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
