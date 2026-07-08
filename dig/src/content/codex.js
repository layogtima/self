// The Codex - everything the scanner can catalogue: living creatures, flora,
// cave features, fluids, and one rock sample per stratum. Pure data. The scan
// tool (game/scan.js) resolves a target to one of these ids; the journal's
// Codex tab shows discovered entries.

import { STRATA } from './strata.js';

/**
 * @typedef {Object} CodexEntry
 * @property {string} id
 * @property {string} name
 * @property {'creature'|'flora'|'feature'|'fluid'|'rock'} category
 * @property {string} blurb
 * @property {[string,string][]} stats  label/value rows
 */

/** @type {CodexEntry[]} */
export const CODEX = [
  // - creatures - 
  { id: 'grazer', name: 'Steppe Grazer', category: 'creature', blurb: 'A skittish herbivore that crops the surface grass at dawn and dusk. Bolts at the whine of treads.', stats: [['diet', 'grass'], ['active', 'day'], ['temperament', 'timid']] },
  { id: 'hopper', name: 'Marsh Hopper', category: 'creature', blurb: 'A stout amphibian that emerges to feed in the rain. Powerful hind legs carry it in long arcs.', stats: [['diet', 'insects'], ['active', 'rain'], ['locomotion', 'leaping']] },
  { id: 'lizard', name: 'Basking Lizard', category: 'creature', blurb: 'Cold-blooded; suns itself on warm boulders under clear skies and vanishes when the light fades.', stats: [['diet', 'insects'], ['active', 'clear day'], ['behaviour', 'basking']] },
  { id: 'salamander', name: 'Cave Salamander', category: 'creature', blurb: 'Pale and near-blind, it creeps the damp cave floors. Its skin glistens with a protective slime.', stats: [['habitat', 'caves'], ['sight', 'vestigial'], ['skin', 'moist']] },
  { id: 'spider', name: 'Gloom Spider', category: 'creature', blurb: 'Scuttles across cave walls and ceilings on eight legs, ambushing anything that strays into the dark.', stats: [['habitat', 'caves'], ['legs', '8'], ['hunts', 'ambush']] },
  { id: 'glowworm', name: 'Glowworm', category: 'creature', blurb: 'A larva that studs cave ceilings with cold blue light to lure prey - an underground constellation.', stats: [['light', 'bioluminescent'], ['habitat', 'deep caves']] },
  { id: 'firefly', name: 'Firefly', category: 'creature', blurb: 'Drifts over the surface on warm nights, pulsing a soft amber glow to find a mate.', stats: [['light', 'bioluminescent'], ['active', 'night']] },
  { id: 'butterfly', name: 'Sun Moth', category: 'creature', blurb: 'Flits between wildflowers on clear days. Folds its wings and shelters the moment clouds gather.', stats: [['diet', 'nectar'], ['active', 'clear day']] },
  { id: 'bird', name: 'Skein Bird', category: 'creature', blurb: 'Travels in loose flocks across the daytime sky, scattering fast when a storm rolls in.', stats: [['flight', 'flocking'], ['active', 'day']] },
  { id: 'bat', name: 'Cavern Bat', category: 'creature', blurb: 'Roosts deep and erupts in a flutter when light finds it. Navigates the pitch black by echo.', stats: [['habitat', 'caverns'], ['active', 'night'], ['sense', 'echolocation']] },
  // - flora - 
  { id: 'tree-badlands', name: 'Broadleaf', category: 'flora', blurb: 'A hardy round-canopied tree of the badlands, its deep roots pulling water from the dry earth.', stats: [['biome', 'badlands'], ['canopy', 'broad']] },
  { id: 'tree-conifer', name: 'Frost Pine', category: 'flora', blurb: 'A cold-hardy conifer of the tundra, needles waxed against the wind and snow.', stats: [['biome', 'tundra'], ['leaf', 'needle']] },
  { id: 'tree-palm', name: 'Coast Palm', category: 'flora', blurb: 'Leans over the ancient shoreline, fronds spread to the sea breeze.', stats: [['biome', 'coast'], ['leaf', 'frond']] },
  { id: 'mushroom', name: 'Glow Cap', category: 'flora', blurb: 'A fungus that thrives in the dark, its cap emitting a soft warm light to attract spore-spreaders.', stats: [['habitat', 'caves'], ['light', 'faint glow']] },
  // - features & fluids - 
  { id: 'stalactite', name: 'Stalactite', category: 'feature', blurb: 'A mineral icicle, grown one dripping millennium at a time from the cave ceiling.', stats: [['forms', 'ceiling'], ['growth', '~1cm / century']] },
  { id: 'crystal', name: 'Crystal Cluster', category: 'feature', blurb: 'Faceted mineral growth in the oldest rock, catching what little light reaches this depth.', stats: [['habitat', 'deep strata'], ['optical', 'refractive']] },
  { id: 'water', name: 'Groundwater', category: 'fluid', blurb: 'Rain that seeped down through the strata and pooled in the caves. Breach it and it will flow.', stats: [['state', 'liquid'], ['behaviour', 'flows']] },
  { id: 'lava', name: 'Magma', category: 'fluid', blurb: 'Molten rock from the deep, glowing at over a thousand degrees. The probe cannot survive contact.', stats: [['state', 'molten'], ['temp', '>1000°C'], ['hazard', 'lethal']] },
  // - rock samples, one per stratum - 
  ...STRATA.map(s => ({
    id: `rock-${s.id}`, name: `${s.era} Rock`, category: 'rock',
    blurb: `A core sample from the ${s.era} - laid down ${s.mya[0]}–${s.mya[1]} million years ago, ${Math.round(s.realDepth[0])}–${Math.round(s.realDepth[1])} m down.`,
    stats: [['age', `${s.mya[0]}–${s.mya[1]} Mya`], ['depth', `${Math.round(s.realDepth[0])}–${Math.round(s.realDepth[1])} m`]],
  })),
];

export const CODEX_BY_ID = Object.fromEntries(CODEX.map(e => [e.id, e]));
export function codexEntry(id) { return CODEX_BY_ID[id] || null; }
