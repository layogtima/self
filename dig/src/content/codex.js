// The Codex - everything the scanner can catalogue: living creatures, flora,
// cave features, fluids, garbage deposits, and one rock sample per stratum.
// STRUCTURE ONLY lives here (ids + categories - art/saves/tests key on them).
// All names, blurbs and stat rows live in content/lore.json (see core/lore.js):
// entries expose them through getters, so `entry.blurb` picks one of several
// flavor variants per opening and translations never touch this file.
// Rock samples keep generated fallback text (derived from strata data).

import { STRATA } from './strata.js';
import { loreName, loreStats, pickBlurb } from '../core/lore.js';

/**
 * @typedef {Object} CodexEntry
 * @property {string} id
 * @property {string} name        from lore.json (getter)
 * @property {'creature'|'flora'|'feature'|'fluid'|'rock'|'salvage'} category
 * @property {string} blurb       one lore variant, stable per opening (getter)
 * @property {[string,string][]} stats  label/value rows (getter)
 */

function entry(id, category, fallback = {}) {
  return {
    id, category,
    get name() { return loreName(id, fallback.name); },
    get blurb() { return pickBlurb(id, fallback.blurb || ''); },
    get stats() { const s = loreStats(id, null); return s ?? (fallback.stats || []); },
  };
}

const CREATURES = ['grazer', 'hopper', 'lizard', 'salamander', 'spider', 'glowworm',
  'firefly', 'butterfly', 'bird', 'bat', 'wader', 'dustmole', 'cindercrab',
  'prismfly', 'gleamback', 'moth', 'ashworm'];
const FLORA = ['tree-badlands', 'tree-conifer', 'tree-palm', 'tree-mangrove',
  'tree-acacia', 'tree-deadsnag', 'mushroom'];
const FEATURES = ['tree-shardspire', 'stalactite', 'stalagmite', 'roots', 'crystal'];
const FLUIDS = ['water', 'brine', 'tar', 'lava'];
const SALVAGE = ['scrap-metal', 'aluminium-can', 'stainless-cutlery', 'rebar-chunk',
  'bottle-cluster', 'lego-brick', 'tyre-chunk', 'fishing-net',
  'circuit-board', 'glass-bottle', 'ceramic-shards', 'smartphone'];

/** @type {CodexEntry[]} */
export const CODEX = [
  ...CREATURES.map(id => entry(id, 'creature')),
  ...FLORA.map(id => entry(id, 'flora')),
  ...FEATURES.map(id => entry(id, 'feature')),
  ...FLUIDS.map(id => entry(id, 'fluid')),
  ...SALVAGE.map(id => entry(id, 'salvage')),
  // rock samples: text generated from strata data (fallback; lore can override)
  ...STRATA.map(s => entry(`rock-${s.id}`, 'rock', {
    name: `${s.era} Rock`,
    blurb: `A core sample from the ${s.era} - laid down ${s.mya[0]}–${s.mya[1]} million years ago, ${Math.round(s.realDepth[0])}–${Math.round(s.realDepth[1])} m down.`,
    stats: [['age', `${s.mya[0]}–${s.mya[1]} Mya`], ['depth', `${Math.round(s.realDepth[0])}–${Math.round(s.realDepth[1])} m`]],
  })),
];

export const CODEX_BY_ID = Object.fromEntries(CODEX.map(e => [e.id, e]));
export function codexEntry(id) { return CODEX_BY_ID[id] || null; }
