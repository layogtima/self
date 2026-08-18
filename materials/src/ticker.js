// The live counter. One monotonic clock, read on demand — no setInterval accumulator.

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
