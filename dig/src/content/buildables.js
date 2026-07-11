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
 * (flavor blurbs live in content/lore.json under `build.<id>`)
 */

/** @type {Buildable[]} */
export const BUILDABLES = [
  // -- M1: shelter, costed in dig spoil (never depends on the Reclaimer) ------
  { id: 'soil', name: 'Soil Block', kind: 'tile', tile: T_PLACED, cost: { regolith: 1 }, unlock: null },
  { id: 'roof', name: 'Roof Panel', kind: 'tile', tile: T_ROOF, cost: { regolith: 2 }, unlock: null },

  // -- the garbage economy: one machine per material family --------------------
  { id: 'smelter', name: 'Smelter', kind: 'machine', size: [2, 2], cost: { regolith: 8 }, unlock: 'furnace', accepts: ['scrap-metal', 'aluminium-can', 'stainless-cutlery', 'rebar-chunk'] },
  { id: 'pyrolysis', name: 'Pyrolysis Vat', kind: 'machine', size: [2, 2], cost: { metal: 3, regolith: 4 }, unlock: 'pyrolysis', accepts: ['bottle-cluster', 'tyre-chunk', 'fishing-net', 'lego-brick'] },
  { id: 'kiln', name: 'Ash Kiln', kind: 'machine', size: [2, 2], cost: { metal: 4, plastic: 2 }, unlock: 'kiln', accepts: ['circuit-board', 'glass-bottle', 'ceramic-shards', 'smartphone'] },
  { id: 'solar', name: 'Solar Panel', kind: 'machine', size: [2, 1], cost: { metal: 3, silicon: 2 }, unlock: 'power-up' },
  { id: 'wind-vane', name: 'Wind Vane', kind: 'machine', size: [1, 2], cost: { metal: 2, plastic: 1 }, unlock: 'power-up' },
  { id: 'storage', name: 'Storage Crate', kind: 'machine', size: [2, 1], cost: { metal: 2, plastic: 2 }, unlock: 'pyrolysis' },
  { id: 'beacon', name: 'Home Beacon', kind: 'machine', size: [1, 2], cost: { metal: 1, plastic: 1 }, unlock: 'pyrolysis' },

  // -- bio-optics: lights LEARNED from living things (unlocked by SCANNING
  // them) but SYNTHESIZED from processed materials - biology is never a cost
  { id: 'lamp-green', name: 'Mycena Lamp', kind: 'machine', size: [1, 2], cost: { metal: 1, silicon: 1 }, unlock: null, unlockScan: 'mushroom' },
  { id: 'lamp-blue', name: 'Glowworm Lamp', kind: 'machine', size: [1, 2], cost: { metal: 1, crystal: 1 }, unlock: null, unlockScan: 'glowworm' },
  { id: 'lamp-teal', name: 'Motyxia Lamp', kind: 'machine', size: [1, 2], cost: { metal: 1, crystal: 1 }, unlock: null, unlockScan: 'gleamback' },
  { id: 'lamp-amber', name: 'Dark-sky Lamp', kind: 'machine', size: [1, 2], cost: { metal: 1, silicon: 2 }, unlock: 'dark-sky', unlockScan: 'firefly' },

  // -- bio-tech: things you EARN by scanning the living world ------------------
  { id: 'lure', name: 'Lure Beacon', kind: 'machine', size: [1, 2], cost: { metal: 2, silicon: 1 }, unlock: null, unlockScan: 'grazer' },
  { id: 'planter', name: 'Flora Planter', kind: 'machine', size: [2, 1], cost: { regolith: 2, metal: 1 }, unlock: null, unlockScan: 'mushroom' },
  { id: 'terrarium', name: 'Terrarium', kind: 'machine', size: [2, 2], cost: { metal: 3, silicon: 2, plastic: 2 }, unlock: 'entomologist' },

  // -- M3: the field laboratory ------------------------------------------------
  { id: 'st-clean', name: 'Prep Bench', kind: 'machine', size: [2, 1], station: 'clean', cost: { metal: 3, plastic: 2 }, unlock: 'field-lab' },
  { id: 'st-identify', name: 'Comparison Desk', kind: 'machine', size: [2, 1], station: 'identify', cost: { metal: 2, silicon: 2 }, unlock: 'field-lab' },
  { id: 'st-stabilize', name: 'Consolidant Rig', kind: 'machine', size: [2, 1], station: 'stabilize', cost: { metal: 2, polymer: 2 }, unlock: 'field-lab' },
  { id: 'st-mount', name: 'Mount Armature', kind: 'machine', size: [2, 1], station: 'mount', cost: { metal: 4, plastic: 2 }, unlock: 'field-lab' },

  // -- M4: genesis --------------------------------------------------------------
  { id: 'incubator', name: 'Incubator', kind: 'machine', size: [2, 2], cost: { metal: 6, silicon: 4, polymer: 4, plastic: 2 }, unlock: 'genesis' },
];

export const BUILDABLES_BY_ID = Object.fromEntries(BUILDABLES.map(b => [b.id, b]));
