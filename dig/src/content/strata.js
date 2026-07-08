// Geologic strata: vertical = time. Pure data + tiny lookup helpers.
// depth values are tiles below the surface line (1 tile ≈ 1 m of section).
// See docs/CONTENT.md before editing.

/**
 * @typedef {Object} Stratum
 * @property {string} id          unique key; fossils reference this via `period`
 * @property {string} era         display name, upper-cased in banners
 * @property {[number,number]} mya  million-years-ago range (display only)
 * @property {[number,number]} depth  [from,to) tiles below surface; last entry's `to` is Infinity
 * @property {[number,number]} realDepth  real-Earth burial depth in metres (HUD display scale)
 * @property {number} hp          shovel hits per tile (all 1 — digging is exploration, not labour)
 * @property {{base:string,alt:string,band:string,speckle:string}} colors  pastel tokens
 * @property {{banding:number,speckle:number}} texture  0..1 strengths for the tileset generator
 */

/** @type {Stratum[]} ordered shallow → deep */
export const STRATA = [
  {
    id: 'anthropocene', era: 'Anthropocene', mya: [0, 0.1], depth: [0, 12], hp: 1, realDepth: [0, 3],
    colors: { base: '#B5AC9C', alt: '#A99F8F', band: '#9A9080', speckle: '#7E7466' },
    texture: { banding: 0.3, speckle: 0.8 },
  },
  {
    id: 'quaternary', era: 'Quaternary', mya: [0.1, 2.6], depth: [12, 40], hp: 1, realDepth: [3, 50],
    colors: { base: '#D9C49A', alt: '#CFB88A', band: '#C2A97A', speckle: '#A98F5F' },
    texture: { banding: 0.2, speckle: 0.7 },
  },
  {
    id: 'paleogene', era: 'Paleogene', mya: [2.6, 66], depth: [40, 80], hp: 1, realDepth: [50, 300],
    colors: { base: '#E0B586', alt: '#D6A876', band: '#C99966', speckle: '#B0804E' },
    texture: { banding: 0.6, speckle: 0.4 },
  },
  {
    id: 'cretaceous', era: 'Cretaceous', mya: [66, 145], depth: [80, 140], hp: 1, realDepth: [300, 800],
    colors: { base: '#E2DCC0', alt: '#D8D1B1', band: '#CAC29F', speckle: '#B1A882' },
    texture: { banding: 0.5, speckle: 0.3 },
  },
  {
    id: 'jurassic', era: 'Jurassic', mya: [145, 201], depth: [140, 200], hp: 1, realDepth: [800, 1500],
    colors: { base: '#AFC49E', alt: '#A1B88E', band: '#91A97C', speckle: '#758D60' },
    texture: { banding: 0.7, speckle: 0.3 },
  },
  {
    id: 'triassic', era: 'Triassic', mya: [201, 252], depth: [200, 250], hp: 1, realDepth: [1500, 2200],
    colors: { base: '#D49C87', alt: '#CA8D76', band: '#BC7C64', speckle: '#A1614A' },
    texture: { banding: 0.8, speckle: 0.4 },
  },
  {
    id: 'carboniferous', era: 'Carboniferous–Permian', mya: [252, 359], depth: [250, 310], hp: 1, realDepth: [2200, 3200],
    colors: { base: '#A29AB2', alt: '#948BA6', band: '#827A96', speckle: '#68607D' },
    texture: { banding: 0.9, speckle: 0.5 },
  },
  {
    id: 'devonian', era: 'Devonian–Silurian', mya: [359, 444], depth: [310, 370], hp: 1, realDepth: [3200, 4200],
    colors: { base: '#96B0C5', alt: '#86A2BA', band: '#7391AB', speckle: '#59788F' },
    texture: { banding: 0.6, speckle: 0.5 },
  },
  {
    id: 'cambrian', era: 'Cambrian–Ordovician', mya: [444, 539], depth: [370, 435], hp: 1, realDepth: [4200, 5500],
    colors: { base: '#A3A1B6', alt: '#9593AA', band: '#84829A', speckle: '#6B6980' },
    texture: { banding: 0.4, speckle: 0.6 },
  },
  {
    id: 'precambrian', era: 'Precambrian', mya: [539, 4600], depth: [435, Infinity], hp: 1, realDepth: [5500, 8000],
    colors: { base: '#A3859A', alt: '#95778C', band: '#84667B', speckle: '#6A4D60' },
    texture: { banding: 0.3, speckle: 0.8 },
  },
];

export const STRATA_BY_ID = Object.fromEntries(STRATA.map(s => [s.id, s]));

/** index into STRATA for a depth (tiles below surface); clamps to ends */
export function strataIndexAtDepth(depth) {
  if (depth < 0) return 0;
  for (let i = 0; i < STRATA.length; i++) {
    if (depth < STRATA[i].depth[1]) return i;
  }
  return STRATA.length - 1;
}

/** @returns {Stratum} */
export function stratumAtDepth(depth) {
  return STRATA[strataIndexAtDepth(depth)];
}

/** map tile-depth → real-Earth metres (interpolated inside the stratum band) */
export function realDepthAt(depth) {
  if (depth <= 0) return 0;
  const s = stratumAtDepth(depth);
  const from = s.depth[0];
  const to = Number.isFinite(s.depth[1]) ? s.depth[1] : from + 50;
  const f = Math.max(0, Math.min(1, (depth - from) / Math.max(1, to - from)));
  return Math.round(s.realDepth[0] + (s.realDepth[1] - s.realDepth[0]) * f);
}

/** "214 m" / "1.3 km" */
export function formatDepth(m) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** "145–201 million years" — how we ALWAYS phrase age (never era names in HUD) */
export function formatAge(stratum) {
  const [a, b] = stratum.mya;
  const f = v => (v >= 1 ? Math.round(v) : v);
  return `${f(a)}–${f(b)} million years`;
}
