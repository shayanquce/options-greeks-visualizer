import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates a displayed number toward its target so ticking
 * values glide instead of snapping — the "live quote" feel. Ease-out
 * quadratic over ~140ms; cancels cleanly when the target changes mid-flight.
 */
export function useAnimatedNumber(target: number, duration = 140): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  displayRef.current = display;

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    if (from === target || !Number.isFinite(from)) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}
