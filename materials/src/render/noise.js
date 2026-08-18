// A tiny deterministic value noise. No dependency, no tables, same result every load.

function hash(x, y, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export function vnoise(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const fx = smooth(x - X), fy = smooth(y - Y), fz = smooth(z - Z);
  const c000 = hash(X, Y, Z), c100 = hash(X + 1, Y, Z);
  const c010 = hash(X, Y + 1, Z), c110 = hash(X + 1, Y + 1, Z);
  const c001 = hash(X, Y, Z + 1), c101 = hash(X + 1, Y, Z + 1);
  const c011 = hash(X, Y + 1, Z + 1), c111 = hash(X + 1, Y + 1, Z + 1);
  return lerp(
    lerp(lerp(c000, c100, fx), lerp(c010, c110, fx), fy),
    lerp(lerp(c001, c101, fx), lerp(c011, c111, fx), fy),
    fz
  );
}

/** Fractal noise centred on zero, roughly -0.5..0.5. */
export function fbm(x, y, z, octaves = 4) {
  let amp = 0.5, freq = 1, sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (vnoise(x * freq, y * freq, z * freq) - 0.5);
    amp *= 0.5;
    freq *= 2.02;
  }
  return sum;
}

/** Deterministic pseudo-random stream from an integer seed. */
export function rng(seed) {
  let s = (seed | 0) * 1664525 + 1013904223;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return ((s >>> 8) & 0xffffff) / 0x1000000;
  };
}
