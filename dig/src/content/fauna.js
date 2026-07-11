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
 * @property {'surface'|'cave'|'water'} zone  water = lives IN ponds (swims)
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
 * @property {number} [lifespan]       seconds from juvenile to old age (default 150)
 * @property {number} [satiety]        seconds from fed to hungry (default 90; predators run higher)
 * @property {string[]} [prey]         fauna/ambient ids this one hunts
 * @property {boolean} [grazes]        pauses to feed at grass tufts
 * @property {'herd'|'solitary'} [social]  herd = drifts toward its own kind
 * @property {boolean} [basks]         long sun-bathing idles on clear days
 * @property {boolean} [amphibious]    may skim a pond's edge (mudskipper)
 * @property {boolean} [nocturnal]     active at night, roosts by day (moth)
 * @property {boolean} [aerial]        flies (free x/y drift; no ground-snap)
 * @property {boolean} [intimidates]   stands its ground and displays before it flees
 * @property {boolean} [attracted]     diverts toward artificial light at night (moth)
 * @property {'canopy'} [shelters]     what it roosts under/in when resting
 */

/** @type {FaunaSpec[]} */
export const FAUNA = [
  {
    id: 'grazer', zone: 'surface', activity: { day: true },
    depth: [0, 0], speed: { walk: 24, flee: 90 }, size: [16, 13],
    palette: '#8A7358', draw: 'grazer', rarity: 1, lifespan: 200, grazes: true, social: 'herd',
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 2 },
  },
  {
    id: 'hopper', zone: 'surface', activity: { weather: ['rain', 'storm'] },
    depth: [0, 0], speed: { walk: 24, flee: 80 }, size: [10, 9],
    palette: '#7A8A58', draw: 'hopper', rarity: 2, lifespan: 120, hop: true,   // frogs love the rain
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 1 },
  },
  {
    id: 'lizard', zone: 'surface', activity: { day: true, weather: ['clear'] },
    depth: [0, 0], speed: { walk: 24, flee: 110 }, size: [14, 6],
    palette: '#6E8A72', draw: 'lizard', rarity: 1, lifespan: 160, basks: true, intimidates: true,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'warm', space: 1 },
  },
  {
    // luna moth: a REAL night flier. It lives near canopy after dark whether or
    // not a lamp is lit; artificial light merely LURES it (males navigate by the
    // moon and mistake a bright thing for it). Roosts folded on a leaf by day.
    id: 'moth', zone: 'surface', activity: { night: true },
    depth: [0, 0], speed: { walk: 22, flee: 40 }, size: [10, 7],
    palette: '#BEEBB4', draw: 'moth', rarity: 1.4, lifespan: 60,
    nocturnal: true, aerial: true, attracted: true, shelters: 'canopy',
  },
  {
    id: 'salamander', zone: 'cave', activity: {},
    depth: [56, 9999], speed: { walk: 12, flee: 50 }, size: [12, 5],
    palette: '#D8C8CE', draw: 'salamander', rarity: 1, lifespan: 240,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 1 },
  },
  {
    id: 'spider', zone: 'cave', activity: {},
    depth: [40, 9999], speed: { walk: 22, flee: 50 }, size: [11, 8],
    palette: '#2E2836', draw: 'spider', rarity: 1, lifespan: 150, prey: ['firefly', 'prismfly'],
  },

  // -- the seven-biome wave (M3): generic art until bespoke sprites land -------
  {
    id: 'wader', zone: 'surface', activity: { day: true },
    depth: [0, 0], speed: { walk: 30, flee: 95 }, size: [12, 16],
    palette: '#B8C4CE', draw: 'wader', rarity: 1, lifespan: 170, prey: ['butterfly'], intimidates: true,
    biomes: { wetland: 3, coast: 1.2, tundra: 0, badlands: 0, savanna: 0, ashflats: 0, crystal: 0 },
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 2 },
  },
  {
    id: 'dustmole', zone: 'surface', activity: {},
    depth: [0, 0], speed: { walk: 18, flee: 70 }, size: [12, 8],
    palette: '#A8906E', draw: 'generic', rarity: 0.8, lifespan: 140, grazes: true, social: 'herd',
    biomes: { savanna: 3, badlands: 2, tundra: 0, wetland: 0, crystal: 0, coast: 0 },
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'warm', space: 1 },
  },
  {
    id: 'cindercrab', zone: 'surface', activity: {},
    depth: [0, 0], speed: { walk: 10, flee: 28 }, size: [10, 6],
    palette: '#8A6A62', draw: 'cindercrab', rarity: 0.9, lifespan: 220, grazes: true, intimidates: true,
    biomes: { ashflats: 4, tundra: 0, wetland: 0, badlands: 0, savanna: 0, crystal: 0.4, coast: 0.4 },
    capturable: true, diet: ['crystal'], habitatNeeds: { temp: 'warm', space: 1 },
  },
  {
    id: 'prismfly', zone: 'surface', activity: { day: true, weather: ['clear', 'overcast'] },
    depth: [0, 0], speed: { walk: 16, flee: 60 }, size: [8, 7],
    palette: '#C8B4E6', draw: 'generic', rarity: 0.8, lifespan: 90,
    biomes: { crystal: 4, tundra: 0, wetland: 0.5, badlands: 0, savanna: 0, ashflats: 0, coast: 0 },
  },
  {
    id: 'gleamback', zone: 'cave', activity: {},
    depth: [240, 800], speed: { walk: 20, flee: 60 }, size: [11, 7],
    palette: '#4E6E5A', draw: 'generic', rarity: 0.9, lifespan: 130, grazes: true,
    capturable: true, diet: ['mushroom'], habitatNeeds: { temp: 'any', space: 1 },
  },
  // -- pond life (v4.6): surface water bodies -----------------------------------
  {
    id: 'pupfish', zone: 'water', activity: {},
    depth: [0, 10], speed: { walk: 14, flee: 60 }, size: [8, 5],
    palette: '#7FA8D0', draw: 'fish', rarity: 1, lifespan: 90,
  },
  {
    id: 'mudskipper', zone: 'water', activity: { day: true },
    depth: [0, 10], speed: { walk: 16, flee: 55 }, size: [11, 6],
    palette: '#8A9070', draw: 'mudskipper', rarity: 0.9, lifespan: 140, grazes: true, amphibious: true,
    biomes: { wetland: 3, coast: 2, ashflats: 0.2, crystal: 0.2 },
  },

  {
    id: 'ashworm', zone: 'cave', activity: {},
    depth: [800, 9999], speed: { walk: 14, flee: 40 }, size: [16, 5],
    palette: '#7A5A52', draw: 'generic', rarity: 0.8, lifespan: 200,
    biomes: { ashflats: 3 },
  },

  // -- predators (v5.7): scarce hunters that close the food chain. They hunt on
  // HUNGER (not a dice roll), prey flee them, and starvation culls the ones that
  // spawn where prey is thin. Procedural art for now (no sprites yet).
  {
    id: 'stalker', zone: 'surface', activity: {},
    depth: [0, 0], speed: { walk: 26, flee: 120 }, size: [16, 9],
    palette: '#6E5A44', draw: 'stalker', rarity: 0.45, lifespan: 180, satiety: 55,
    prey: ['grazer', 'dustmole', 'hopper'], social: 'solitary', intimidates: true,
    biomes: { savanna: 2, badlands: 1.5, tundra: 0, wetland: 0, crystal: 0, coast: 0, ashflats: 0 },   // scarce vs prey, but hunts often
  },
  {
    id: 'lurker', zone: 'cave', activity: {},
    depth: [60, 9999], speed: { walk: 16, flee: 70 }, size: [14, 7],
    palette: '#3A3040', draw: 'lurker', rarity: 0.8, lifespan: 200, satiety: 55,
    prey: ['salamander', 'gleamback', 'ashworm'], social: 'solitary',
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
