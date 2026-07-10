// Everything the probe can build - pure data. kind:'tile' writes a tile id via
// world.place; kind:'machine' creates an entity (game/entities.js). `unlock`
// names a quest id: the buildable appears in the build palette once that quest
// is done (null = always available). `station` links a machine to the existing
// lab-station spec (content/stations.js) so its minigame keys through unchanged.

import { T_PLACED, T_ROOF } from '../config.js';

/**
 * @typedef {Object} Buildable
 * @property {string} id
 * @property {string} name
 * @property {'tile'|'machine'} kind
 * @property {number} [tile]        tile id (kind:'tile')
 * @property {[number,number]} [size]  footprint in tiles (kind:'machine')
 * @property {Object<string,number>} cost  material id -> units
 * @property {string|null} unlock   quest id gate (null = always)
 * @property {string} [station]     content/stations.js id (lab machines)
 * @property {string} blurb
 */

/** @type {Buildable[]} */
export const BUILDABLES = [
  // -- M1: shelter, costed in dig spoil (never depends on the Reclaimer) ------
  { id: 'soil', name: 'Soil Block', kind: 'tile', tile: T_PLACED, cost: { regolith: 1 }, unlock: null, blurb: 'Compacted spoil. Stairs, walls, dams.' },
  { id: 'roof', name: 'Roof Panel', kind: 'tile', tile: T_ROOF, cost: { regolith: 2 }, unlock: null, blurb: 'Keeps the rain off your chassis.' },

  // -- M2: the garbage economy ------------------------------------------------
  { id: 'processor', name: 'Reclaimer', kind: 'machine', size: [2, 2], cost: { metal: 4, plastic: 2 }, unlock: 'scavenge', blurb: 'Washes, shreds and extracts raw garbage into pure materials. Runs on sun or wind.' },
  { id: 'solar', name: 'Solar Panel', kind: 'machine', size: [2, 1], cost: { metal: 3, silicon: 2 }, unlock: 'power-up', blurb: 'Trickle-charges you and powers nearby machines by day.' },
  { id: 'wind-vane', name: 'Wind Vane', kind: 'machine', size: [1, 2], cost: { metal: 2, plastic: 1 }, unlock: 'power-up', blurb: 'Spins hardest in the storms that drive you indoors.' },
  { id: 'storage', name: 'Storage Crate', kind: 'machine', size: [2, 1], cost: { metal: 2, plastic: 2 }, unlock: 'processing', blurb: 'Overflow space for materials.' },
  { id: 'beacon', name: 'Home Beacon', kind: 'machine', size: [1, 2], cost: { metal: 1, plastic: 1 }, unlock: 'processing', blurb: 'Marks home for the HUD arrow, anywhere you plant it.' },

  // -- M3: the field laboratory ------------------------------------------------
  { id: 'st-clean', name: 'Prep Bench', kind: 'machine', size: [2, 1], station: 'clean', cost: { metal: 3, plastic: 2 }, unlock: 'field-lab', blurb: 'Brushes and picks - free the bone from its matrix.' },
  { id: 'st-identify', name: 'Comparison Desk', kind: 'machine', size: [2, 1], station: 'identify', cost: { metal: 2, silicon: 2 }, unlock: 'field-lab', blurb: 'Microscope + anatomy charts.' },
  { id: 'st-stabilize', name: 'Consolidant Rig', kind: 'machine', size: [2, 1], station: 'stabilize', cost: { metal: 2, polymer: 2 }, unlock: 'field-lab', blurb: 'Glue for deep time.' },
  { id: 'st-mount', name: 'Mount Armature', kind: 'machine', size: [2, 1], station: 'mount', cost: { metal: 4, plastic: 2 }, unlock: 'field-lab', blurb: 'Where skeletons come back together.' },

  // -- M4: genesis --------------------------------------------------------------
  { id: 'incubator', name: 'Incubator', kind: 'machine', size: [2, 2], cost: { metal: 6, silicon: 4, polymer: 4, plastic: 2 }, unlock: 'genesis', blurb: 'A womb of glass and code. Viable genomes only.' },
];

export const BUILDABLES_BY_ID = Object.fromEntries(BUILDABLES.map(b => [b.id, b]));
