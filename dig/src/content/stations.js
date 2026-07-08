// Lab stations - pure data. Each bone fragment travels:
//   dirty → cleaned → identified → stabilized → mounted
// Real fossil-prep order: mechanical prep, comparative ID, consolidation, mount.
// `minigame` keys map to game/minigames.js kinds. Add a step by adding a state
// to SPECIMEN_STATES and a station that brackets it.

/** ordered specimen states; index = pipeline progress */
export const SPECIMEN_STATES = ['dirty', 'cleaned', 'identified', 'stabilized', 'mounted'];

/**
 * @typedef {Object} StationSpec
 * @property {string} id
 * @property {string} name
 * @property {string} verb        gerund shown while working
 * @property {string} input       required fragment state
 * @property {string} output      resulting fragment state
 * @property {string} minigame    minigame kind (game/minigames.js)
 * @property {string} sprite      assets/sprites/stations/<sprite>.png (else glyph)
 * @property {string} icon        fallback glyph
 * @property {string} tint        fallback chip colour
 */

/** @type {StationSpec[]} left → right along the surface camp */
export const STATIONS = [
  { id: 'clean',    name: 'Prep Bench',       verb: 'Preparing',    input: 'dirty',      output: 'cleaned',    minigame: 'prep',      sprite: 'station-clean',    icon: 'brush', tint: '#C7A98A' },
  { id: 'identify', name: 'Comparison Desk',  verb: 'Comparing',    input: 'cleaned',    output: 'identified', minigame: 'identify',  sprite: 'station-analyze',  icon: 'lens',  tint: '#B39BC0' },
  { id: 'stabilize',name: 'Consolidant Rig',  verb: 'Stabilizing',  input: 'identified', output: 'stabilized', minigame: 'stabilize', sprite: 'station-prep',     icon: 'drop',  tint: '#9FBE9A' },
  { id: 'mount',    name: 'Mount',            verb: 'Mounting',     input: 'stabilized', output: 'mounted',    minigame: 'mount',     sprite: 'station-showcase', icon: 'stand', tint: '#D8B25E' },
];

export const STATIONS_BY_ID = Object.fromEntries(STATIONS.map(s => [s.id, s]));

export function nextState(state) {
  const i = SPECIMEN_STATES.indexOf(state);
  return i >= 0 && i < SPECIMEN_STATES.length - 1 ? SPECIMEN_STATES[i + 1] : state;
}
