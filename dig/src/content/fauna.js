// The living-creature registry. Pure data: ambient.js spawns/updates from it,
// render/fauna.js draws from it, the scanner sizes its brackets from it. Add a
// creature = add an entry (+ a CODEX entry; art is optional - unknown `draw`
// keys fall back to a generic critter).
//
// Dormant fields for the capture/raise system (M4): capturable, diet,
// habitatNeeds, ancestor (fossil id whose genome studying this creature feeds).

/**
 * @typedef {Object} FaunaSpec
 * @property {string} id            codex id
 * @property {'surface'|'cave'} zone
 * @property {{day?:boolean, night?:boolean, weather?:string[]}} activity  omitted key = any
 * @property {[number,number]} depth   tile-depth band (cave kinds)
 * @property {{walk:number, flee:number}} speed  px/s
 * @property {[number,number]} size    approx body px (scan bracket, pen capacity)
 * @property {string} palette         primary colour (generic art fallback)
 * @property {string} draw            key into render/fauna.js FAUNA_ART
 * @property {number} rarity          spawn weight
 * @property {boolean} [hop]          arcing gait (frogs)
 * @property {Object<string,number>} [biomes]  biome id -> weight multiplier
 * @property {boolean} [capturable]
 * @property {string[]} [diet]        material ids it eats (M4)
 * @property {{temp:'any'|'warm'|'cold', space:number}} [habitatNeeds]
 * @property {string} [ancestor]      fossil id (study grants genome, M4)
 */

/** @type {FaunaSpec[]} */
export const FAUNA = [
  {
    id: 'grazer', zone: 'surface', activity: { day: true },
    depth: [0, 0], speed: { walk: 24, flee: 90 }, size: [16, 13],
    palette: '#8A7358', draw: 'grazer', rarity: 1,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 2 },
  },
  {
    id: 'hopper', zone: 'surface', activity: { weather: ['rain', 'storm'] },
    depth: [0, 0], speed: { walk: 24, flee: 80 }, size: [10, 9],
    palette: '#7A8A58', draw: 'hopper', rarity: 2, hop: true,   // frogs love the rain
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 1 },
  },
  {
    id: 'lizard', zone: 'surface', activity: { day: true, weather: ['clear'] },
    depth: [0, 0], speed: { walk: 24, flee: 110 }, size: [14, 6],
    palette: '#6E8A72', draw: 'lizard', rarity: 1,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'warm', space: 1 },
  },
  {
    id: 'salamander', zone: 'cave', activity: {},
    depth: [20, 9999], speed: { walk: 12, flee: 50 }, size: [12, 5],
    palette: '#D8C8CE', draw: 'salamander', rarity: 1,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 1 },
  },
  {
    id: 'spider', zone: 'cave', activity: {},
    depth: [20, 9999], speed: { walk: 22, flee: 50 }, size: [11, 8],
    palette: '#2E2836', draw: 'spider', rarity: 1,
  },
];

export const FAUNA_BY_ID = Object.fromEntries(FAUNA.map(f => [f.id, f]));

/**
 * Weighted spawn candidates for a zone under current conditions.
 * @param {'surface'|'cave'} zone
 * @param {{isDay:boolean, weather:string, depth:number, biomeId?:string}} ctx
 * @returns {{item: FaunaSpec, w: number}[]}
 */
export function eligibleFauna(zone, ctx) {
  const out = [];
  for (const spec of FAUNA) {
    if (spec.zone !== zone) continue;
    const a = spec.activity || {};
    if (a.day && !ctx.isDay) continue;
    if (a.night && ctx.isDay) continue;
    if (a.weather && !a.weather.includes(ctx.weather)) continue;
    if (zone === 'cave' && (ctx.depth < spec.depth[0] || ctx.depth > spec.depth[1])) continue;
    const mul = spec.biomes?.[ctx.biomeId] ?? 1;
    if (mul <= 0) continue;
    out.push({ item: spec, w: spec.rarity * mul });
  }
  return out;
}

/** plain weighted pick (Math.random) from eligibleFauna output */
export function pickFauna(zone, ctx) {
  const opts = eligibleFauna(zone, ctx);
  const total = opts.reduce((s, o) => s + o.w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const o of opts) { r -= o.w; if (r <= 0) return o.item; }
  return opts[opts.length - 1].item;
}
