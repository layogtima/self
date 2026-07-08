// Deterministic hashing + value noise. Everything world-shaped derives from one seed.

export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);

/**
 * Create a seeded generator namespace.
 * @param {number} seed integer seed
 */
export function makeRng(seed) {
  /** integer-lattice hash → [0,1) */
  function hash2(x, y) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 974634);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  /** 2D value noise → [0,1) */
  function noise2(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const a = hash2(ix, iy), b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  /** sequential stream for gen-time decisions (site placement etc.) */
  let streamI = 0;
  function next() { return hash2(1e6 + (streamI++), 8888); }

  /** weighted pick from [{item, w}] using the stream */
  function pickWeighted(entries) {
    const total = entries.reduce((s, e) => s + e.w, 0);
    if (total <= 0) return null;
    let r = next() * total;
    for (const e of entries) { r -= e.w; if (r <= 0) return e.item; }
    return entries[entries.length - 1].item;
  }

  return { seed, hash2, noise2, next, pickWeighted };
}
