// Central tunables & feature flags. Content lives in src/content/, not here.

export const FLAGS = {
  /** The v2 "unfurl" narrative (see poc/game.js + game/story.js). Off until the core loop is nailed. */
  STORY_MODE: false,
};

// -- canvas / world dimensions ------------------------------------------------
export const TILE = 16;
// The stage: height is FIXED (all vertical layout is authored against 540);
// width adapts to the device aspect (v5.0 mobile) - phones get an edge-to-edge
// landscape view. `let` + live ES-module bindings: consumers that read VIEW_W
// at draw time follow resizes automatically. Buffers sized at construction
// (lighting) lazily re-allocate when they notice a mismatch.
export let VIEW_W = 960;
export const VIEW_H = 540;
export const VIEW_W_MIN = 720;      // 4:3 tablets
export const VIEW_W_MAX = 1280;     // ~21:9, wider gets letterboxed
/** resize the stage width (clamped landscape range). Returns the applied width. */
export function setView(w) {
  VIEW_W = Math.max(VIEW_W_MIN, Math.min(VIEW_W_MAX, Math.round(w)));
  return VIEW_W;
}
// v4.7: the world is 4x bigger on BOTH axes - each biome 4x wider, the geologic
// section 4x deeper. Strata bands + worldgen depth literals scale with WORLD_SCALE.
export const WORLD_SCALE = 4;
export const WORLD_W = 1456;        // tiles (364 * 4): the 7 biomes, 4x wider each
export const WORLD_H = 1920;        // tiles (480 * 4): room to reach the deep strata + magma
export const SURFACE_BASE = 104;    // mean surface row (26 * 4); depth = row - surface

// pod no-dig span (columns around spawn; you can't undermine your own pod)
export const CAMP_HALF_L = 2;
export const CAMP_HALF_R = 2;
export const CAMP_DEPTH = 4;        // rows below surface protected

// -- tile ids (world structure; strata are looked up by depth, not stored) ----
export const T_AIR = 0;
export const T_ROCK = 1;            // stratum rock - which stratum comes from depth
export const T_PLACED = 2;          // player-placed soil
export const T_BEDROCK = 3;
export const T_WATER = 4;           // flowing groundwater (buoyant)
export const T_LAVA = 5;            // glowing lava (deadly, knocks you back to base)
export const T_ROOF = 6;            // player-built roof panel (solid; stops rain; counts as cover)
export const T_BRINE = 7;           // hypersaline groundwater (deep aquifers; extra buoyant)
export const T_TAR = 8;             // natural asphalt seep (La Brea-style; barely flows, grips)
export const T_RUBBLE = 9;          // cave-in debris: diggable loose fill (built tiles are NOT -
                                    // T_PLACED/T_ROOF only come down via the Deconstructor)

export const T_OBSIDIAN = 10;       // volcanic glass: lava quenched by water (diggable rock)

// fluid CA active-set ceiling. Scaled for the 4x world - too small and pools
// on a big map get truncated (Set-order eviction) and freeze mid-flow.
export const FLUID_ACTIVE_CAP = 24000;

// per-fluid viscosity: probability a cell advances each CA frame (1 = watery)
export const FLUID_SPECS = {
  [T_WATER]: { visc: 1.0 },
  [T_BRINE]: { visc: 0.8 },
  [T_LAVA]: { visc: 0.3 },
  [T_TAR]: { visc: 0.12 },
};

// -- power (the probe's battery; traversal is always free - never a hard death)
export const POWER_CAP = 100;
export const POWER_DIG = 0.5;       // per laser pulse (one per DIG_COOLDOWN)
export const POWER_SCAN = 2.0;      // per second while the scan beam is locked on
export const SOLAR_RATE = 4.0;      // per second at surface + noon + clear
export const POWER_LOW = 0.20;      // below: tools sluggish, chip blinks
export const POWER_RESERVE = 0.05;  // below: tools offline; charge floors at 2%

// -- player physics (proven values from the POC - tuned, don't fiddle) --------
export const GRAVITY = 1600;
export const MAX_FALL = 760;
export const MOVE_SPEED = 132;
export const GROUND_ACCEL = 1700;
export const AIR_ACCEL = 1000;
export const FRICTION = 2000;
export const JUMP_V = 340;          // apex ~2.26 tiles: clears a 2-tile step, 1-tile hops feel deliberate
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.1;
export const PLAYER_W = 12;
export const PLAYER_H = 15;         // 1 tile tall: dig 1-tall tunnels, hop single steps (15 not 16 - a
                                    // grounded AABB top exactly on a tile boundary would jitter-flip rows)
export const BEAM_Y = 4;            // laser lens / light emitter offset from the probe's top (face height)

// -- digging (always easy - exploration, not labour) ---------------------------
export const DIG_REACH = 3.6 * TILE;
export const DIG_COOLDOWN = 0.15;

// -- the pulley (K = reel home; real pendulum, so you swing) -------------------
export const REEL_SPEED = 78;        // px/s of rope shortening
export const ROPE_MIN_LEN = 12;      // detach when this close to the anchor
export const IDLE_ROPE_TILES = 3;    // how far the idle rope dangles

// -- fossils / lab ------------------------------------------------------------
export const SATCHEL_SIZE = 3;
export const RARITY_WEIGHTS = { common: 1.0, uncommon: 0.45, rare: 0.18, legendary: 0.06 };

// -- save ---------------------------------------------------------------------
export const SAVE_KEY = 'diggg-save-v3';   // v4.7: world 4x bigger, tile indices changed; older saves reset (settings carry)
export const SAVE_KEY_PREV = 'diggg-save-v2';
export const SAVE_KEY_V1 = 'diggg-save-v1';
export const AUTOSAVE_SECONDS = 10;
