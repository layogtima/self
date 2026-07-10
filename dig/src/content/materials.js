// Materials & garbage - pure data. Materials are what the inventory counts and
// buildables cost; garbage is the raw anthropocene junk the Reclaimer (M2)
// refines into them. The harvestables (mushroom/crystal, M0) share the same
// inventory namespace.

/** @typedef {{id:string, name:string, color:string, glyph:'cube'|'shard'|'cap'|'clod'}} Material */

/** @type {Material[]} */
export const MATERIALS = [
  { id: 'regolith', name: 'Regolith', color: '#A99F8F', glyph: 'clod' },   // dig spoil - the M1 bootstrap material
  { id: 'plastic', name: 'Plastics', color: '#7FB2DE', glyph: 'cube' },
  { id: 'metal', name: 'Metals', color: '#9AA4B2', glyph: 'cube' },
  { id: 'silicon', name: 'Silicon', color: '#B39BC0', glyph: 'cube' },
  { id: 'polymer', name: 'Polymers', color: '#9FBE9A', glyph: 'cube' },
  // living harvestables (M0)
  { id: 'mushroom', name: 'Glow Caps', color: '#96DCAA', glyph: 'cap' },
  { id: 'crystal', name: 'Crystals', color: '#C8B4E6', glyph: 'shard' },
];
export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(m => [m.id, m]));

/**
 * Garbage deposit types seeded in the anthropocene band (M2 worldgen).
 * yields: material id -> [min,max] units per deposit once reclaimed.
 * band: tile-depth range it appears in. freq: relative seeding weight.
 */
export const GARBAGE = [
  { id: 'bottle-cluster', name: 'Bottle Cluster', yields: { plastic: [2, 3] }, freq: 1.0, band: [0, 12] },
  { id: 'scrap-metal', name: 'Scrap Bundle', yields: { metal: [2, 3] }, freq: 0.9, band: [0, 12] },
  { id: 'tyre-chunk', name: 'Tyre Chunk', yields: { polymer: [2, 3] }, freq: 0.7, band: [2, 12] },
  { id: 'circuit-board', name: 'E-Waste', yields: { silicon: [1, 2] }, freq: 0.45, band: [4, 12] },
];
export const GARBAGE_BY_ID = Object.fromEntries(GARBAGE.map(g => [g.id, g]));
