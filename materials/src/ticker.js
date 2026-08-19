// The live counter. One monotonic clock, read on demand — no setInterval accumulator.

/**
 * How often the counters are allowed to repaint, in milliseconds. The totals are derived
 * from the clock rather than accumulated, so painting less often loses nothing: each paint
 * still shows the true figure, it just stops the low digits from blurring at 60fps.
 * 0 means every frame. Live-tweakable as `__mat.counter.intervalMs` in the console.
 */
export const counter = { intervalMs: 250 };

let origin = performance.now();
let frozenAt = null;
let pausedTotal = 0;

/** Seconds of live (non-calm) time since the page opened. */
export function elapsed() {
  if (frozenAt != null) return (frozenAt - origin - pausedTotal) / 1000;
  return (performance.now() - origin - pausedTotal) / 1000;
}

export function setPaused(paused) {
  if (paused && frozenAt == null) {
    frozenAt = performance.now();
  } else if (!paused && frozenAt != null) {
    pausedTotal += performance.now() - frozenAt;
    frozenAt = null;
  }
}

/** Kilograms accumulated at a constant rate since the page opened. */
export function since(rateKgS) {
  return rateKgS * elapsed();
}

export function reset() {
  origin = performance.now();
  frozenAt = null;
  pausedTotal = 0;
}
