// Horizontal biomes: where you dig shapes what you find - and what grows, who
// lives there, and what colour the grass is. Pure data + lookups. x ranges are
// fractions of WORLD_W so the world can be resized freely.

/**
 * @typedef {Object} Biome
 * @property {string} id
 * @property {string} name
 * @property {[number,number]} range   [from,to) as fraction of world width
 * @property {string} foliage          foliage set key used by the scenery renderer
 * @property {string} surfaceTint      pastel tint blended into surface-adjacent tiles
 * @property {boolean} snow            precipitation falls as snow
 * @property {{cap:string, deep:string, tuft:string}} grass   surface cap + tuft colours
 * @property {{tree:string, treeP:number, dressP:number, tuftP:number, dressings:string[]}} scenery
 *           tree sprite id + hash thresholds (treeP/dressP HIGHER = rarer; shared with
 *           the scanner via game/features.js), tuftP = grass density 0..1, dressing pool
 * @property {Object<string,number>} envWeights  fossil environment multipliers
 */

/** @type {Biome[]} ordered left → right (tundra first, coast last - tests pin the edges) */
export const BIOMES = [
  {
    id: 'tundra', name: 'Tundra', range: [0, 1 / 7],
    foliage: 'tundra', surfaceTint: '#E4EEEC', snow: true,
    grass: { cap: '#9DB8AE', deep: '#5E7A5A', tuft: '#8FB0A2' },
    scenery: { tree: 'tree-conifer', treeP: 0.93, dressP: 0.9, tuftP: 0.7, dressings: ['boulder', 'bush'] },
    envWeights: { terrestrial: 1.25, marine: 0.5, freshwater: 0.8, any: 1 },
  },
  {
    id: 'wetland', name: 'Wetland', range: [1 / 7, 2 / 7],
    foliage: 'wetland', surfaceTint: '#DCE8D2', snow: false,
    grass: { cap: '#7FA86A', deep: '#4E7A4E', tuft: '#6E9A5E' },
    scenery: { tree: 'tree-mangrove', treeP: 0.9, dressP: 0.86, tuftP: 0.85, dressings: ['reeds', 'bush', 'flowers'] },
    envWeights: { terrestrial: 0.9, marine: 0.7, freshwater: 1.6, any: 1 },
  },
  {
    id: 'badlands', name: 'Badlands', range: [2 / 7, 3 / 7],
    foliage: 'badlands', surfaceTint: '#F3E2CE', snow: false,
    grass: { cap: '#A8B26E', deep: '#6E7A45', tuft: '#98A25E' },
    scenery: { tree: 'tree-badlands', treeP: 0.93, dressP: 0.9, tuftP: 0.7, dressings: ['bush', 'boulder', 'flowers'] },
    envWeights: { terrestrial: 1.3, marine: 0.4, freshwater: 1.0, any: 1 },
  },
  {
    id: 'savanna', name: 'Savanna', range: [3 / 7, 4 / 7],
    foliage: 'savanna', surfaceTint: '#F5E8C2', snow: false,
    grass: { cap: '#C9B26E', deep: '#8A7A45', tuft: '#B8A25E' },
    scenery: { tree: 'tree-acacia', treeP: 0.94, dressP: 0.9, tuftP: 0.75, dressings: ['bush', 'boulder'] },
    envWeights: { terrestrial: 1.4, marine: 0.3, freshwater: 0.8, any: 1 },
  },
  {
    id: 'ashflats', name: 'Ash Flats', range: [4 / 7, 5 / 7],
    foliage: 'ashflats', surfaceTint: '#D9D2CC', snow: false,
    grass: { cap: '#A8A29A', deep: '#6E6A62', tuft: '#8A857C' },
    scenery: { tree: 'tree-deadsnag', treeP: 0.95, dressP: 0.92, tuftP: 0.08, dressings: ['boulder'] },
    envWeights: { terrestrial: 0.8, marine: 0.4, freshwater: 0.5, any: 1 },
  },
  {
    id: 'crystal', name: 'Crystal Barrens', range: [5 / 7, 6 / 7],
    foliage: 'crystal', surfaceTint: '#E8E0F0', snow: false,
    grass: { cap: '#B0A2C4', deep: '#77689A', tuft: '#A08FC0' },
    scenery: { tree: 'tree-shardspire', treeP: 0.94, dressP: 0.9, tuftP: 0.25, dressings: ['shard', 'boulder'] },
    envWeights: { terrestrial: 0.9, marine: 0.6, freshwater: 0.6, any: 1 },
  },
  {
    id: 'coast', name: 'Coast', range: [6 / 7, 1],
    foliage: 'coast', surfaceTint: '#E7EDE2', snow: false,
    grass: { cap: '#5E7A5A', deep: '#4E6A4E', tuft: '#6E8A66' },
    scenery: { tree: 'tree-palm', treeP: 0.93, dressP: 0.9, tuftP: 0.7, dressings: ['bush', 'boulder', 'flowers'] },
    envWeights: { terrestrial: 0.5, marine: 1.5, freshwater: 0.9, any: 1 },
  },
];

/** @param {number} tx tile x @param {number} worldW @returns {Biome} */
export function biomeAtX(tx, worldW) {
  const f = Math.max(0, Math.min(0.999, tx / worldW));
  return BIOMES.find(b => f >= b.range[0] && f < b.range[1]) || BIOMES[BIOMES.length - 1];
}

/** environment spawn multiplier at a column */
export function envWeightAt(tx, worldW, environment) {
  const b = biomeAtX(tx, worldW);
  return b.envWeights[environment] ?? 1;
}
