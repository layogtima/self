// JAR · prng — one seeded mulberry32 owned by the world.
// ALL randomness flows through rnd(world). Same seed + same inputs =
// identical world state, forever. Math.random is banned from sim/.

export function rnd(w) {
  let t = (w.rngS = (w.rngS + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// FNV-1a over a byte view — building block for hashWorld
export function fnv(hash, bytes) {
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
