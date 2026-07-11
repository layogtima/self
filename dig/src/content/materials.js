// Materials & garbage - pure data. Materials are what the inventory counts and
// buildables cost; garbage is the raw anthropocene junk the machines refine
// into them. HARD RULE: biology is never an ingredient - living things are
// scan targets (their patterns unlock blueprints; DG-3 synthesizes the
// function from processed materials). Minerals are geology, so they stay.

/** @typedef {{id:string, name:string, color:string, glyph:'cube'|'shard'|'clod'}} Material */

/** @type {Material[]} */
export const MATERIALS = [
  { id: 'regolith', name: 'Regolith', color: '#A99F8F', glyph: 'clod', use: 'dig spoil - soil blocks, roofs, machine frames' },
  { id: 'plastic', name: 'Plastics', color: '#7FB2DE', glyph: 'cube', use: 'reclaimed PET - light structures + machine housings' },
  { id: 'metal', name: 'Metals', color: '#9AA4B2', glyph: 'cube', use: 'reclaimed steel - machines, benches, mounts' },
  { id: 'silicon', name: 'Silicon', color: '#B39BC0', glyph: 'cube', use: 'from e-waste - solar cells, instruments, bio-lamps' },
  { id: 'polymer', name: 'Polymers', color: '#9FBE9A', glyph: 'cube', use: 'from tyres - seals, consolidant, insulation' },
  // mineral harvestable (geology, not biology)
  { id: 'crystal', name: 'Selenite', color: '#C8B4E6', glyph: 'shard', use: 'crystalline gypsum - laser focusing + lamp housings' },
];
export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(m => [m.id, m]));

/**
 * Garbage deposit types seeded in the anthropocene band - all real 100k-year
 * survivors, each with a story in its codex entry. yields: material id ->
 * [min,max] units once processed by the machine that `accepts` it (see
 * content/buildables.js). band: tile-depth range. freq: seeding weight.
 */
export const GARBAGE = [
  // -- metals (the Smelter's diet) --------------------------------------------
  { id: 'scrap-metal', name: 'Scrap Bundle', yields: { metal: [2, 3] }, freq: 0.9, band: [0, 12] },
  { id: 'aluminium-can', name: 'Aluminium Can', yields: { metal: [1, 2] }, freq: 0.8, band: [0, 12] },
  { id: 'stainless-cutlery', name: 'Cutlery Cache', yields: { metal: [1, 2] }, freq: 0.4, band: [1, 12] },
  { id: 'rebar-chunk', name: 'Rebar Chunk', yields: { metal: [2, 4] }, freq: 0.5, band: [2, 12] },
  // -- plastics & polymers (the Pyrolysis Vat) ---------------------------------
  { id: 'bottle-cluster', name: 'Bottle Cluster', yields: { plastic: [2, 3] }, freq: 1.0, band: [0, 12] },
  { id: 'lego-brick', name: 'Toy Bricks', yields: { plastic: [1, 2] }, freq: 0.25, band: [0, 10] },
  { id: 'tyre-chunk', name: 'Tyre Chunk', yields: { polymer: [2, 3] }, freq: 0.6, band: [2, 12] },
  { id: 'fishing-net', name: 'Ghost Net', yields: { polymer: [1, 3] }, freq: 0.4, band: [1, 12] },
  // -- silica & ceramics (the Ash Kiln) ----------------------------------------
  { id: 'circuit-board', name: 'E-Waste', yields: { silicon: [1, 2] }, freq: 0.45, band: [4, 12] },
  { id: 'glass-bottle', name: 'Glass Bottles', yields: { silicon: [1, 2] }, freq: 0.7, band: [0, 12] },
  { id: 'ceramic-shards', name: 'Ceramic Shards', yields: { silicon: [1, 1], regolith: [1, 2] }, freq: 0.6, band: [1, 12] },
  { id: 'smartphone', name: 'Pocket Shrine', yields: { silicon: [1, 2], metal: [1, 1] }, freq: 0.3, band: [2, 12] },
];
export const GARBAGE_BY_ID = Object.fromEntries(GARBAGE.map(g => [g.id, g]));
