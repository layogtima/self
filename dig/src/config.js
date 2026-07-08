// Central tunables & feature flags. Content lives in src/content/, not here.

export const FLAGS = {
  /** The v2 "unfurl" narrative (see poc/game.js + game/story.js). Off until the core loop is nailed. */
  STORY_MODE: false,
};

// -- canvas / world dimensions ------------------------------------------------
export const TILE = 16;
export const VIEW_W = 960;
export const VIEW_H = 540;
export const WORLD_W = 260;         // tiles
export const WORLD_H = 480;         // tiles
export const SURFACE_BASE = 26;     // mean surface row; depth = row - surface

// camp / homebase no-dig span (columns around spawn; you can't dig here)
export const CAMP_HALF_L = 12;
export const CAMP_HALF_R = 18;
export const CAMP_DEPTH = 10;       // rows below surface protected

// -- tile ids (world structure; strata are looked up by depth, not stored) ----
export const T_AIR = 0;
export const T_ROCK = 1;            // stratum rock - which stratum comes from depth
export const T_PLACED = 2;          // player-placed soil
export const T_BEDROCK = 3;
export const T_WATER = 4;           // flowing water (buoyant)
export const T_LAVA = 5;            // glowing lava (deadly, knocks you back to base)

// -- player physics (proven values from the POC - tuned, don't fiddle) --------
export const GRAVITY = 1600;
export const MAX_FALL = 760;
export const MOVE_SPEED = 132;
export const GROUND_ACCEL = 1700;
export const AIR_ACCEL = 1000;
export const FRICTION = 2000;
export const JUMP_V = 372;          // clears a 2-tile stair step
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.1;
export const PLAYER_W = 12;
export const PLAYER_H = 22;

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
export const SAVE_KEY = 'diggg-save-v1';
export const AUTOSAVE_SECONDS = 10;
