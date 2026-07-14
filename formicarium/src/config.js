// formicarium — shared constants. A cross-section of a Messor barbarus nest behind
// glass: an open OUTWORLD arena on top, diggable SOIL below. Cells are the data unit.

export const COLS = 168, ROWS = 108;
export const SURFACE = Math.round(ROWS * 0.24);   // ground line: rows < SURFACE are open air (outworld)
export const ENTRANCE_X = Math.round(COLS * 0.5); // the nest mouth

export const CELL = 8;   // base px per cell at zoom 1

// substrate cell states
export const S = { AIR: 0, SOIL: 1, ROCK: 2 };   // ROCK = undiggable fleck

// pheromone channels
export const CH = ['TRAIL', 'ALARM', 'RECRUIT', 'BROOD', 'NECRO', 'QUEEN'];

// palette (warm formicarium: amber soil, glass, brood-white, chitin-black)
export const COL = {
  sky1: '#b7d1c4',         // garden daylight: soft top
  sky2: '#e4d3ab',         // → warm haze at the horizon
  grass: '#5f8f43', grassDk: '#416c30', stalk: '#4d7a37', leaf: '#6ba64a', flower: '#e7b85a', seedhead: '#caa250',
  sky: '#171a24',          // (legacy)
  soilTop: '#6b4a2e',      // topsoil
  soilMid: '#7a5636',      // subsoil
  soilDeep: '#5e4028',     // deep
  rock: '#4a4038',
  air: '#241b16',          // excavated void (dark tunnel)
  airLit: '#3a2c22',       // tunnel wall catching lamp
  ant: '#2a1c14',          // dark chitin
  antMajor: '#3a2416',
  callow: '#b98a5a',       // freshly-eclosed (pale)
  seed: '#c9a24a',
  brood: '#f0e6cf',
  pellet: '#8a6a44',
  corpse: '#3a2e26',
  midden: '#8a6a48',
};

export const PH_COL = {   // decode overlay tints
  TRAIL: [255, 190, 70], ALARM: [255, 70, 60], RECRUIT: [70, 210, 255],
  BROOD: [130, 180, 255], NECRO: [190, 110, 255], QUEEN: [200, 120, 255],
};

// task → colour (ONI-style task overlay + analysis UI)
export const TASK_COL = {
  forage: '#ffcf6b', dig: '#d98a4a', nurse: '#7fd6e0', undertake: '#c08ae0', queen: '#e88aa8', idle: '#9a8d78',
};

// ---- DG-3 field-station UI tokens (dark chrome, cyan instrument accents) ---------
export const UI = {
  chrome: 'rgba(15,20,23,0.80)', chromeHi: 'rgba(26,34,38,0.94)',
  edge: 'rgba(122,216,226,0.34)', edgeSoft: 'rgba(122,216,226,0.13)',
  cyan: '#7fe0d0', cyanDim: 'rgba(127,224,208,0.55)',
  amber: '#e9c58a', warn: '#e07a4a',
  ink: '#ecf6f3', inkDim: '#93aaa5', inkFaint: '#607772',
  scan: 'rgba(127,224,208,0.05)',
};
// one-line meaning per channel (shown when armed / in the codex)
export const CH_META = {
  TRAIL: 'recruitment · foragers follow it to food',
  ALARM: 'danger · scatters and rouses nearby ants',
  RECRUIT: 'assembly · draws workers to gather',
  BROOD: 'larval hunger · summons the nurses',
  NECRO: 'death cue · the dead are carried to the midden',
  QUEEN: 'the queen’s field · regulates the colony',
};

