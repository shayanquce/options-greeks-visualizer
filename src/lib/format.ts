/** Number formatting helpers for trading-terminal conventions. */

/** Fixed-decimal with thousands separators; "--" for non-finite. */
export function fmt(x: number, dp = 4): string {
  if (!Number.isFinite(x)) return "--";
  return x.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Signed variant: always shows +/-. */
export function fmtSigned(x: number, dp = 4): string {
  if (!Number.isFinite(x)) return "--";
  return (x >= 0 ? "+" : "") + fmt(x, dp);
}

/** Decimal rate to percent string, e.g. 0.0525 -> "5.25%". */
export function fmtPct(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return "--";
  return fmt(x * 100, dp) + "%";
}

/** Compact tick formatter for chart axes. */
export function fmtTick(x: number): string {
  if (!Number.isFinite(x)) return "";
  const a = Math.abs(x);
  if (a >= 1000) return (x / 1000).toFixed(1) + "k";
  if (a >= 100) return x.toFixed(0);
  if (a >= 1) return x.toFixed(1);
  if (a === 0) return "0";
  if (a >= 0.01) return x.toFixed(2);
  return x.toExponential(1);
}
