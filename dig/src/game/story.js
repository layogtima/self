// STORY MODE — disabled (FLAGS.STORY_MODE=false in config.js). This carries the
// v2 "unfurl" beat table as data for future re-entry. No systems run while the
// flag is off. Full reference implementation preserved at poc/game.js.
//
// TODO(story): when re-enabled, drive signs / palette inversion / the Other
// Dwarf / the crust-loop from these beats, keyed off dig depth.

/** @typedef {{depth:number, id:string, note:string}} StoryBeat */

/** @type {StoryBeat[]} */
export const STORY_BEATS = [
  { depth: 20,  id: 'soil-remembers', note: 'buried signs begin; a shovel fossil; drone fades in' },
  { depth: 60,  id: 'wrong-things',   note: 'a buried tent like yours; faces in speckles; the Other Dwarf; heartbeat' },
  { depth: 110, id: 'underside-sky',  note: 'a full-width cavern: sky underground, grass grows downward' },
  { depth: 170, id: 'unmaking',       note: 'palette inverts; dither static; text garbles' },
  { depth: 240, id: 'crust',          note: 'diggable crust over a white void; fall through → loop; the hole persists' },
];

export function isStoryEnabled(flags) { return !!flags.STORY_MODE; }
