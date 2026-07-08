// Horizontal biomes: where you dig shapes what you find. Pure data + lookups.
// x ranges are fractions of WORLD_W so the world can be resized freely.

/**
 * @typedef {Object} Biome
 * @property {string} id
 * @property {string} name
 * @property {[number,number]} range   [from,to) as fraction of world width
 * @property {string} foliage          foliage set key used by the scenery renderer
 * @property {string} surfaceTint      pastel tint blended into surface-adjacent tiles
 * @property {Object<string,number>} envWeights  fossil environment multipliers
 */

/** @type {Biome[]} ordered left → right */
export const BIOMES = [
  {
    id: 'tundra', name: 'Tundra', range: [0, 1 / 3],
    foliage: 'tundra', surfaceTint: '#E4EEEC',
    envWeights: { terrestrial: 1.25, marine: 0.5, freshwater: 0.8, any: 1 },
  },
  {
    id: 'badlands', name: 'Badlands', range: [1 / 3, 2 / 3],
    foliage: 'badlands', surfaceTint: '#F3E2CE',
    envWeights: { terrestrial: 1.3, marine: 0.4, freshwater: 1.0, any: 1 },
  },
  {
    id: 'coast', name: 'Coast', range: [2 / 3, 1],
    foliage: 'coast', surfaceTint: '#E7EDE2',
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
