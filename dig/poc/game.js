// DIG — a game about digging a hole. (it starts that way.)
'use strict';

// ---------------------------------------------------------------- constants
const TILE = 16;
const WORLD_W = 200;
const WORLD_H = 460;          // deep enough for all six bands
const VIEW_W = 960;
const VIEW_H = 540;

const AIR = 0, DIRT = 1, STONE = 2, BEDROCK = 3, GEM = 4, CRUST = 5, PLACED = 6;
const TILE_HP = { [DIRT]: 1, [STONE]: 3, [GEM]: 2, [CRUST]: 10, [PLACED]: 1 };
const isSolid = t => t !== AIR;
const isDiggable = t => t === DIRT || t === STONE || t === GEM || t === CRUST || t === PLACED;

const GRAVITY = 1600;
const MAX_FALL = 760;
const MOVE_SPEED = 132;
const GROUND_ACCEL = 1700;
const AIR_ACCEL = 1000;
const FRICTION = 2000;
const JUMP_V = 372;           // clears a 2-tile stair step
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;

const DIG_REACH = 3.6 * TILE;
const DIG_COOLDOWN = 0.17;
const PLACE_COOLDOWN = 0.12;

const SURFACE_BASE = 60;      // baseline surface row; depth measured from here

// depth-band boundaries (in metres/tiles below surface)
const BAND = { REMEMBER: 20, WRONG: 60, UNDERSIDE: 110, UNMAKING: 170, CRUST: 240 };

// ---------------------------------------------------------------- canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------- rng / noise
let seed = 1337;

function hash2(x, y) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 974634);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- story state
const story = {
  loop: 0,            // how many times you've fallen through the crust
  fired: new Set(),   // one-shot triggers already fired
  inv: 0,             // palette inversion 0..1 (ramps in the unmaking band)
  hintText: '',       // current controls hint (mutates)
  drone: null,        // WebAudio drone node
  heart: 0,           // heartbeat timer
  falling: false,     // in the void-fall between loops
  voidY: 0,           // camera y during the void fall
};

// signs placed into the world at gen: { tx, ty, text }
let signs = [];
// the Other Dwarf entity (spawned in the WRONG band), or null
let other = null;

// ---------------------------------------------------------------- world
let tiles, surface, damage;

function fired(key) {
  if (story.fired.has(key)) return true;
  story.fired.add(key);
  return false;
}

function generateWorld() {
  tiles = new Uint8Array(WORLD_W * WORLD_H);
  surface = new Int16Array(WORLD_W);
  damage = new Map();
  signs = [];
  other = null;

  const spawnCol = WORLD_W >> 1;

  for (let x = 0; x < WORLD_W; x++) {
    surface[x] = Math.round(SURFACE_BASE + (noise2(x * 0.045, 7.3) - 0.5) * 14);
  }

  for (let x = 0; x < WORLD_W; x++) {
    const surf = surface[x];
    for (let y = 0; y < WORLD_H; y++) {
      const i = y * WORLD_W + x;
      if (y < surf) { tiles[i] = AIR; continue; }
      const depth = y - surf;

      // the CRUST band: last diggable layer over the void, only under spawn region
      if (y >= WORLD_H - 4) {
        const nearSpawn = Math.abs(x - spawnCol) < 30;
        tiles[i] = (y === WORLD_H - 4 && nearSpawn) ? CRUST : BEDROCK;
        continue;
      }

      // the UNDERSIDE SKY band: a full-width hollow cavern (white sky underground)
      if (depth >= BAND.UNDERSIDE && depth < BAND.UNMAKING) {
        const bandTop = BAND.UNDERSIDE, bandBot = BAND.UNMAKING;
        const localTop = surf + bandTop + 3 + Math.round(noise2(x * 0.06, 40) * 4);
        const localBot = surf + bandBot - 5 - Math.round(noise2(x * 0.06, 80) * 4);
        if (y > localTop && y < localBot) { tiles[i] = AIR; continue; }
      }

      let t = DIRT;
      const stoneThresh = 0.74 - clamp01(depth / 200) * 0.28;
      if (depth >= 3 && noise2(x * 0.09, y * 0.09) > stoneThresh) t = STONE;

      // caves
      if (depth > 6 && noise2(x * 0.07 + 100, y * 0.07 + 100) > 0.77) t = AIR;

      // gems, richer with depth
      if (depth > 10 && t !== AIR) {
        const gemChance = 0.986 - clamp01((depth - 10) / 220) * 0.02;
        if (noise2(x * 0.5 + 500, y * 0.5 + 500) > gemChance) t = GEM;
      }

      tiles[i] = t;
    }
  }

  carveScenery(spawnCol);
  placeStory(spawnCol);
}

// carve out the buried set-pieces (a sideways tent void in the WRONG band)
function carveScenery(spawnCol) {
  // buried tent: a small hollow shaped like a fallen tent
  const btx = spawnCol - 24, btyDepth = 78;
  const bty = SURFACE_BASE + btyDepth;
  for (let dx = 0; dx < 10; dx++) {
    for (let dy = 0; dy < 6; dy++) {
      if (dy > dx * 0.6 && dy > (9 - dx) * 0.6) continue; // triangle-ish
      const i = (bty + dy) * WORLD_W + (btx + dx);
      if (i >= 0 && i < tiles.length && tiles[i] !== BEDROCK) tiles[i] = AIR;
    }
  }
  story.buriedTent = { tx: btx, ty: bty };

  // the shovel fossil: an air pocket shaped like a shovel, in the REMEMBER band
  const fx = spawnCol + 14, fy = SURFACE_BASE + 38;
  story.fossil = { tx: fx, ty: fy };
  const fossilCells = [
    [2,0],[2,1],[2,2],[2,3],   // shaft
    [0,4],[1,4],[2,4],[3,4],   // blade top
    [1,5],[2,5],               // blade tip
  ];
  for (const [dx, dy] of fossilCells) {
    const i = (fy + dy) * WORLD_W + (fx + dx);
    if (i >= 0 && i < tiles.length && tiles[i] !== BEDROCK) tiles[i] = AIR;
  }
}

function placeStory(spawnCol) {
  const S = (dx, depth, text) => signs.push({ tx: spawnCol + dx, ty: SURFACE_BASE + depth, text });

  // surface sign at the tent — mutates with the loop count
  const spawnSign = story.loop === 0 ? 'DIG.'
    : story.loop === 1 ? 'again?'
    : story.loop === 2 ? 'you again.'
    : 'oh. it’s you.';
  signs.push({ tx: spawnCol + 2, ty: SURFACE_BASE - 1, text: spawnSign, surface: true });

  S(-3, 26, 'nice hole.');
  S(4, 44, 'deeper.');
  S(2, 68, 'this was somebody’s.');
  S(-5, 96, 'you are the fossil.');
  S(3, 150, 'stop reading. keep digging.');
  S(0, 210, 'almost through.');
}

function tileAt(tx, ty) {
  if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return BEDROCK;
  return tiles[ty * WORLD_W + tx];
}
function solidAt(tx, ty) {
  if (ty < 0) return false;
  if (tx < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
  return tiles[ty * WORLD_W + tx] !== AIR;
}
function depthOfPlayer() {
  const col = Math.max(0, Math.min(WORLD_W - 1, Math.floor(playerCX() / TILE)));
  return Math.floor((player.y + player.h) / TILE) - SURFACE_BASE;
}

// ---------------------------------------------------------------- audio
let AC = null;
function audioCtx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
let noiseBuf = null;
function getNoiseBuf(ac) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
function thud(vol, cutoff, dur) {
  if (!AC) return;
  const ac = AC;
  const src = ac.createBufferSource();
  src.buffer = getNoiseBuf(ac);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = cutoff;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(); src.stop(ac.currentTime + dur);
}
function blip(f0, f1, dur, type, vol) {
  if (!AC) return;
  const ac = AC;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(f1, ac.currentTime + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
}
const sfx = {
  digDirt: () => thud(0.22, 650, 0.08),
  digStone: () => { thud(0.15, 900, 0.06); blip(900 + Math.random() * 300, 500, 0.05, 'square', 0.03); },
  break: () => thud(0.3, 420, 0.13),
  gem: () => { blip(880, 1760, 0.12, 'triangle', 0.06); blip(1320, 2640, 0.18, 'sine', 0.04); },
  place: () => thud(0.22, 380, 0.09),
  jump: () => blip(180, 380, 0.09, 'square', 0.05),
  land: () => thud(0.18, 320, 0.07),
  heartbeat: () => { thud(0.14, 120, 0.16); },
  wrong: () => blip(200, 60, 0.5, 'sawtooth', 0.05),
};

// a low drone whose gain rises with depth (starts in the REMEMBER band)
function updateDrone(depth) {
  if (!AC) return;
  const target = clamp01((depth - BAND.REMEMBER) / 200) * 0.06;
  if (!story.drone && target > 0.001) {
    const ac = AC;
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = 42;
    const o2 = ac.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 42 * 1.5;
    const g = ac.createGain();
    g.gain.value = 0;
    o.connect(g); o2.connect(g); g.connect(ac.destination);
    o.start(); o2.start();
    story.drone = { g, o, o2 };
  }
  if (story.drone) {
    story.drone.g.gain.setTargetAtTime(target, AC.currentTime, 0.5);
  }
}

// ---------------------------------------------------------------- input
const keys = {};
const mouse = { x: 0, y: 0, left: false, right: false };

addEventListener('keydown', e => {
  if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
  audioCtx();
  if (!e.repeat) {
    if (e.code === 'Space' || e.code === 'KeyW') player.jumpBuf = JUMP_BUFFER;
    if (e.code === 'KeyR') reset();
  }
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (VIEW_W / r.width);
  mouse.y = (e.clientY - r.top) * (VIEW_H / r.height);
});
canvas.addEventListener('mousedown', e => {
  audioCtx();
  if (e.button === 0) mouse.left = true;
  if (e.button === 2) mouse.right = true;
});
addEventListener('mouseup', e => {
  if (e.button === 0) mouse.left = false;
  if (e.button === 2) mouse.right = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ---------------------------------------------------------------- player
const player = {
  x: 0, y: 0, w: 12, h: 22,
  vx: 0, vy: 0,
  onGround: false, coyote: 0, jumpBuf: 0, jumpHeld: false,
  facing: 1,
  digCd: 0, swingT: 0, swingAim: 0.9,
  placeCd: 0,
  walkT: 0, lastVy: 0,
};
let gems = 0;
let dirt = 5;   // start with a few blocks so climbing-out is discoverable

function spawnPlayer() {
  const col = WORLD_W >> 1;
  player.x = col * TILE + (TILE - player.w) / 2;
  player.y = (surface[col] - 2) * TILE - player.h;
  player.vx = 0; player.vy = 0;
  player.onGround = false; player.coyote = 0; player.jumpBuf = 0;
  player.digCd = 0; player.swingT = 0; player.placeCd = 0;
}
function playerCX() { return player.x + player.w / 2; }
function playerCY() { return player.y + player.h / 2; }
function playerTX() { return Math.floor(playerCX() / TILE); }

// ---------------------------------------------------------------- physics
function moveAndCollide(dt) {
  const p = player;
  p.x += p.vx * dt;
  {
    const y0 = Math.floor(p.y / TILE), y1 = Math.floor((p.y + p.h - 0.001) / TILE);
    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w - 0.001) / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { p.x = tx * TILE - p.w; p.vx = 0; break; }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / TILE);
      for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { p.x = (tx + 1) * TILE; p.vx = 0; break; }
    }
  }
  p.lastVy = p.vy;
  p.y += p.vy * dt;
  const wasGrounded = p.onGround;
  p.onGround = false;
  {
    const x0 = Math.floor(p.x / TILE), x1 = Math.floor((p.x + p.w - 0.001) / TILE);
    if (p.vy > 0) {
      const ty = Math.floor((p.y + p.h - 0.001) / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) {
        p.y = ty * TILE - p.h;
        if (!wasGrounded && p.lastVy > 320) sfx.land();
        p.vy = 0; p.onGround = true; break;
      }
    } else if (p.vy < 0) {
      const ty = Math.floor(p.y / TILE);
      for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { p.y = (ty + 1) * TILE; p.vy = 0; break; }
    }
  }
}

function updatePlayer(dt) {
  const p = player;

  // during the void-fall, physics is suspended (handled in updateVoidFall)
  const dir = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (dir !== 0) {
    p.facing = dir;
    const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
    p.vx += dir * accel * dt;
    p.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, p.vx));
    p.walkT += dt * Math.abs(p.vx) / MOVE_SPEED;
  } else {
    const f = (p.onGround ? FRICTION : FRICTION * 0.25) * dt;
    if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
  }

  p.coyote = p.onGround ? COYOTE_TIME : Math.max(0, p.coyote - dt);
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);
  const jumpKey = keys.Space || keys.KeyW;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -JUMP_V; p.coyote = 0; p.jumpBuf = 0; p.jumpHeld = true; sfx.jump();
  }
  if (p.jumpHeld && !jumpKey && p.vy < 0) { p.vy *= 0.45; p.jumpHeld = false; }
  if (!jumpKey) p.jumpHeld = false;

  p.vy = Math.min(p.vy + GRAVITY * dt, MAX_FALL);
  moveAndCollide(dt);

  p.digCd = Math.max(0, p.digCd - dt);
  p.swingT = Math.max(0, p.swingT - dt);
  p.placeCd = Math.max(0, p.placeCd - dt);
}

// ---------------------------------------------------------------- digging & placing
// keyboard directional target: what's "in the way" of the held direction
function keyboardDigTarget() {
  const cx = playerTX();
  const top = Math.floor(player.y / TILE);
  const mid = Math.floor(playerCY() / TILE);
  const bot = Math.floor((player.y + player.h - 0.001) / TILE);

  if (keys.KeyA || keys.KeyD) {
    const col = cx + (keys.KeyD ? 1 : (keys.KeyA ? -1 : player.facing));
    // upper blocking tile first (so a swing opens head-height), then feet
    for (const ty of [top, mid, bot]) if (isDiggable(tileAt(col, ty))) return { tx: col, ty };
    return { tx: col, ty: mid };
  }
  if (keys.KeyW) return { tx: cx, ty: top - 1 };
  // default / KeyS: straight down
  return { tx: cx, ty: Math.floor((player.y + player.h + 1) / TILE) };
}

function aimedTile() {
  if (mouse.left) {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    return { tx: Math.floor(wx / TILE), ty: Math.floor(wy / TILE) };
  }
  if (keys.KeyJ) return keyboardDigTarget();
  if (keys.KeyS) return { tx: playerTX(), ty: Math.floor((player.y + player.h + 1) / TILE) };
  return null;
}

function tileInReach(tx, ty) {
  const dx = (tx + 0.5) * TILE - playerCX();
  const dy = (ty + 0.5) * TILE - playerCY();
  return dx * dx + dy * dy <= DIG_REACH * DIG_REACH;
}

function updateDigging() {
  if (player.digCd > 0) return;
  const aim = aimedTile();
  if (!aim) return;
  const { tx, ty } = aim;
  const t = tileAt(tx, ty);
  if (!isDiggable(t) || !tileInReach(tx, ty)) return;

  const i = ty * WORLD_W + tx;
  player.digCd = DIG_COOLDOWN;
  player.swingT = 0.16;
  player.swingAim = Math.atan2((ty + 0.5) * TILE - playerCY(), (tx + 0.5) * TILE - playerCX());

  const hits = (damage.get(i) || 0) + 1;
  if (hits >= TILE_HP[t]) {
    tiles[i] = AIR;
    damage.delete(i);
    if (t === GEM) { gems++; burst(tx, ty, GEM, 14); sfx.gem(); addShake(2.5); }
    else if (t === CRUST) { beginVoidFall(); }
    else {
      if (t === DIRT || t === STONE) dirt = Math.min(99, dirt + 1);
      burst(tx, ty, t, 10); sfx.break(); addShake(2.2);
    }
  } else {
    damage.set(i, hits);
    burst(tx, ty, t, 3);
    addShake(1);
    if (t === STONE || t === CRUST) sfx.digStone(); else sfx.digDirt();
  }
}

function placeTarget() {
  if (mouse.right) {
    const wx = mouse.x + cam.x, wy = mouse.y + cam.y;
    return { tx: Math.floor(wx / TILE), ty: Math.floor(wy / TILE) };
  }
  if (keys.KeyK) {
    // place where you're aiming; default is below your feet (tower up).
    // use the row strictly below the AABB so a mid-jump place doesn't hit your own body
    if (keys.KeyA || keys.KeyD || keys.KeyW) return keyboardDigTarget();
    return { tx: playerTX(), ty: Math.floor((player.y + player.h - 0.001) / TILE) + 1 };
  }
  return null;
}

function overlapsPlayer(tx, ty) {
  const px0 = Math.floor(player.x / TILE), px1 = Math.floor((player.x + player.w - 0.001) / TILE);
  const py0 = Math.floor(player.y / TILE), py1 = Math.floor((player.y + player.h - 0.001) / TILE);
  return tx >= px0 && tx <= px1 && py0 <= ty && ty <= py1;
}

function updatePlacing() {
  if (player.placeCd > 0 || dirt <= 0) return;
  const aim = placeTarget();
  if (!aim) return;
  const { tx, ty } = aim;
  if (tileAt(tx, ty) !== AIR) return;
  if (overlapsPlayer(tx, ty)) return;
  if (!tileInReach(tx, ty)) return;
  if (ty < 0 || ty >= WORLD_H || tx < 0 || tx >= WORLD_W) return;

  tiles[ty * WORLD_W + tx] = PLACED;
  dirt--;
  player.placeCd = PLACE_COOLDOWN;
  burst(tx, ty, DIRT, 2);
  sfx.place();
}

// ---------------------------------------------------------------- void fall (loop transition)
function beginVoidFall() {
  story.falling = true;
  story.voidY = 0;          // accumulated fall distance through the void
  player.vy = 120;
  sfx.wrong();
  addShake(6);
}

function updateVoidFall(dt) {
  // player free-falls through white nothing, past giant DIG. text, then re-enters from the sky
  player.vy = Math.min(player.vy + GRAVITY * 0.5 * dt, 900);
  story.voidY += player.vy * dt;

  // after falling ~5 screens, wrap: same world, re-enter from above the tent
  if (story.voidY > VIEW_H * 5) {
    story.loop++;
    story.falling = false;
    story.fired.clear();
    // keep tiles (the hole persists) — only reposition the player above spawn, high in the sky
    const col = WORLD_W >> 1;
    player.x = col * TILE + (TILE - player.w) / 2;
    player.y = (surface[col] - 20) * TILE;   // drop in from the sky
    player.vx = 0; player.vy = 0;
    // re-place signs so the spawn sign reflects the new loop count
    signs = signs.filter(s => !s.surface);
    const spawnSign = story.loop === 1 ? 'again?' : story.loop === 2 ? 'you again.' : 'oh. it’s you.';
    signs.push({ tx: col + 2, ty: SURFACE_BASE - 1, text: spawnSign, surface: true });
    updateCamera(0, true);
  }
}

// ---------------------------------------------------------------- other dwarf
function updateOther(dt) {
  const depth = depthOfPlayer();
  // spawn once when you first enter the WRONG band, in a cave near you
  if (!other && depth > BAND.WRONG + 6 && depth < BAND.UNDERSIDE && !fired('other-spawn')) {
    const tx = playerTX() + (player.facing * 5 || 5);
    const ty = Math.floor(playerCY() / TILE);
    if (tileAt(tx, ty) === AIR) other = { x: tx * TILE, y: ty * TILE, t: 0, digT: 0, alive: true };
    else story.fired.delete('other-spawn'); // retry later if the spot was solid
  }
  if (!other || !other.alive) return;
  other.t += dt;
  other.digT += dt;
  // it digs in place; poof when you get close
  const dx = other.x - playerCX(), dy = other.y - playerCY();
  if (dx * dx + dy * dy < (2.5 * TILE) ** 2) {
    for (let k = 0; k < 20; k++) burst(Math.floor(other.x / TILE), Math.floor(other.y / TILE), STONE, 1);
    other.alive = false;
    sfx.wrong();
    addShake(3);
  }
}

// ---------------------------------------------------------------- particles & shake
const particles = [];
function burst(tx, ty, tileType, n) {
  const l = tileType === STONE ? 0.3 : tileType === GEM ? 0.95 : 0.55;
  for (let k = 0; k < n; k++) {
    particles.push({
      x: (tx + 0.2 + Math.random() * 0.6) * TILE,
      y: (ty + 0.2 + Math.random() * 0.6) * TILE,
      vx: (Math.random() - 0.5) * 160,
      vy: -Math.random() * 160 - 40,
      life: 0.35 + Math.random() * 0.3,
      size: 2 + (Math.random() * 2 | 0),
      l: l * (0.8 + Math.random() * 0.4),
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
let shake = 0;
function addShake(m) { shake = Math.min(8, shake + m); }

// ---------------------------------------------------------------- camera
const cam = { x: 0, y: 0 };
function updateCamera(dt, snap) {
  const freeY = story.falling; // during void-fall the camera follows without clamping
  const tx = Math.max(0, Math.min(WORLD_W * TILE - VIEW_W, playerCX() - VIEW_W / 2));
  let ty = playerCY() - VIEW_H / 2;
  if (!freeY) ty = Math.max(0, Math.min(WORLD_H * TILE - VIEW_H, ty));
  if (snap) { cam.x = tx; cam.y = ty; return; }
  const k = Math.min(1, 10 * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * (freeY ? 1 : k);
}

// ---------------------------------------------------------------- rendering helpers
// palette: grey with story inversion applied
function grey(l) {
  l = clamp01(l);
  if (story.inv > 0) l = lerp(l, 1 - l, story.inv);
  const v = Math.round(l * 255);
  return `rgb(${v},${v},${v})`;
}
const TILE_L = { [DIRT]: 0.62, [STONE]: 0.32, [BEDROCK]: 0.07, [GEM]: 0.28, [CRUST]: 0.5, [PLACED]: 0.58 };

function lightAt(tx, ty) {
  const col = Math.max(0, Math.min(WORLD_W - 1, tx));
  const ambient = 1 - clamp01((ty - surface[col]) / 40) * 0.93;
  const dx = (tx + 0.5) * TILE - playerCX();
  const dy = (ty + 0.5) * TILE - playerCY();
  const lantern = clamp01(1 - Math.sqrt(dx * dx + dy * dy) / (8.5 * TILE));
  return clamp01(Math.max(ambient, lantern * 1.05));
}

// ---------------------------------------------------------------- scenery (surface life)
function drawCloud(px, py, s, lgt) {
  ctx.fillStyle = grey(lgt);
  for (const [ox, oy, r] of [[0, 0, 12], [10, -4, 10], [20, 2, 11], [30, 0, 8]]) {
    ctx.beginPath();
    ctx.arc(px + ox * s, py + oy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTree(px, baseY) {
  ctx.fillStyle = grey(0.05);
  const h = 3 + Math.floor(hash2(px, 3) * 3);
  const trunkH = h * TILE;
  ctx.fillRect(px - 2, baseY - trunkH, 4, trunkH);
  const cy = baseY - trunkH;
  for (const [ox, oy, r] of [[0, -6, 13], [-9, 0, 10], [9, -1, 10], [0, 6, 9]]) {
    ctx.beginPath();
    ctx.arc(px + ox, cy + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTuft(px, baseY, seedx) {
  ctx.strokeStyle = grey(0.12);
  ctx.lineWidth = 1.5;
  const blades = 2 + Math.floor(hash2(seedx, 9) * 2);
  ctx.beginPath();
  for (let b = 0; b < blades; b++) {
    const ox = (b - blades / 2) * 3 + hash2(seedx + b, 1) * 2;
    const bh = 4 + hash2(seedx + b, 5) * 4;
    const bend = (hash2(seedx + b, 7) - 0.5) * 5;
    ctx.moveTo(px + ox, baseY);
    ctx.quadraticCurveTo(px + ox + bend, baseY - bh * 0.6, px + ox + bend, baseY - bh);
  }
  ctx.stroke();
  // occasional flower or mushroom
  const r = hash2(seedx, 21);
  if (r > 0.9) {
    ctx.fillStyle = grey(0.05);
    ctx.beginPath(); ctx.arc(px, baseY - 8, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (r < 0.06) {
    ctx.fillStyle = grey(0.1);
    ctx.fillRect(px - 1, baseY - 5, 2, 5);
    ctx.beginPath(); ctx.arc(px, baseY - 5, 3, Math.PI, 0); ctx.fill();
  }
}

function drawTent(px, baseY, lgt) {
  ctx.fillStyle = grey(lgt);
  ctx.beginPath();
  ctx.moveTo(px, baseY - 20);
  ctx.lineTo(px - 18, baseY);
  ctx.lineTo(px + 18, baseY);
  ctx.closePath();
  ctx.fill();
  // dark entrance notch
  ctx.fillStyle = grey(1);
  ctx.beginPath();
  ctx.moveTo(px, baseY - 9);
  ctx.lineTo(px - 5, baseY);
  ctx.lineTo(px + 5, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawScenery(time, x0, x1) {
  const spawnCol = WORLD_W >> 1;

  // drifting clouds (the one moving thing in the sky)
  for (let c = 0; c < 5; c++) {
    const speed = 6 + c * 2;
    const baseX = (hash2(c * 13, 1) * WORLD_W * TILE);
    let cx = (baseX + time * speed) % (WORLD_W * TILE + 300) - 150;
    const cy = 30 + hash2(c * 7, 2) * 120;
    drawCloud(cx, cy, 1, 0.9 - story.loop * 0.05);
  }

  // trees + tufts on the visible surface columns
  for (let tx = x0; tx <= x1; tx++) {
    if (tx < 0 || tx >= WORLD_W) continue;
    const baseY = surface[tx] * TILE;
    // trees at hashed intervals
    if (hash2(tx, 55) > 0.93 && Math.abs(tx - spawnCol) > 3) {
      drawTree(tx * TILE + TILE / 2, baseY + 2);
    }
    // grass tufts on most columns
    if (hash2(tx, 88) > 0.25) drawTuft(tx * TILE + TILE / 2, baseY + 1, tx);
  }

  // spawn camp: tent + signpost
  const campX = spawnCol * TILE + TILE / 2 + 18;
  drawTent(campX, surface[spawnCol] * TILE + 2, story.loop === 0 ? 0.15 : 0.1);
  // a second, silent dwarf sitting by the tent from loop 2 onward
  if (story.loop >= 2) {
    ctx.fillStyle = grey(0.05);
    const sx = campX + 24, sy = surface[spawnCol] * TILE - 6;
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 3, sy + 3, 6, 6);
  }
}

// underground "underside sky" — draw a white band with downward grass + drifting clouds
function drawUndersideSky(time, x0, x1, y0, y1) {
  const top = SURFACE_BASE + BAND.UNDERSIDE, bot = SURFACE_BASE + BAND.UNMAKING;
  // fill visible air tiles in the band with sky-white so darkness doesn't eat it
  ctx.fillStyle = grey(0.98);
  for (let ty = Math.max(y0, top); ty <= Math.min(y1, bot); ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tileAt(tx, ty) === AIR) ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // clouds drifting through the cavern
  for (let c = 0; c < 4; c++) {
    const speed = 5 + c * 2;
    const cx = ((hash2(c * 5, 9) * WORLD_W * TILE) + time * speed) % (WORLD_W * TILE + 300) - 150;
    const cy = (top + 3 + hash2(c, 3) * (BAND.UNMAKING - BAND.UNDERSIDE - 8)) * TILE;
    drawCloud(cx, cy, 0.8, 0.82);
  }
  // grass growing DOWNWARD from the ceiling
  for (let tx = x0; tx <= x1; tx++) {
    if (tx < 0 || tx >= WORLD_W) continue;
    for (let ty = top; ty <= bot; ty++) {
      if (tileAt(tx, ty) === AIR && isSolid(tileAt(tx, ty - 1))) {
        ctx.save();
        ctx.translate(tx * TILE + TILE / 2, ty * TILE);
        ctx.scale(1, -1);
        drawTuft(0, 0, tx * 3 + 1);
        ctx.restore();
        break;
      }
    }
  }
}

// ---------------------------------------------------------------- tiles
function drawTiles(x0, x1, y0, y1, time) {
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(tx, ty);
      if (t === AIR) continue;
      const px = tx * TILE, py = ty * TILE;
      const base = TILE_L[t] * (0.94 + hash2(tx, ty * 3) * 0.12);
      ctx.fillStyle = grey(base);
      ctx.fillRect(px, py, TILE, TILE);

      ctx.fillStyle = grey(base * 0.8);
      ctx.fillRect(px, py + TILE - 1, TILE, 1);

      // speckles — in the WRONG band these sometimes align into a face
      const faceHere = story.inv < 0.5 && t !== BEDROCK &&
        (ty - surface[Math.max(0, Math.min(WORLD_W - 1, tx))]) > BAND.WRONG &&
        hash2(tx * 3, ty * 7) > 0.985;
      if (faceHere) {
        ctx.fillStyle = grey(base * 0.4);
        ctx.fillRect(px + 4, py + 5, 2, 2);
        ctx.fillRect(px + 10, py + 5, 2, 2);
        ctx.fillRect(px + 5, py + 10, 6, 1);
      } else {
        ctx.fillStyle = grey(base * 0.8);
        ctx.fillRect(px + 2 + hash2(tx * 7, ty) * 11 | 0, py + 3 + hash2(tx, ty * 13) * 9 | 0, 2, 2);
        ctx.fillRect(px + 2 + hash2(tx * 3, ty * 5) * 11 | 0, py + 3 + hash2(tx * 11, ty) * 9 | 0, 2, 2);
      }

      // surface grass cap
      if (ty === surface[tx] && t !== BEDROCK) {
        ctx.fillStyle = grey(0.15);
        ctx.fillRect(px, py, TILE, 3);
      }

      // gem sparkle
      if (t === GEM) {
        const glint = 0.6 + Math.sin(time * 4 + tx * 1.7 + ty) * 0.4;
        ctx.fillStyle = grey(glint);
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 3);
        ctx.lineTo(px + 12, py + 8);
        ctx.lineTo(px + 8, py + 13);
        ctx.lineTo(px + 4, py + 8);
        ctx.closePath();
        ctx.fill();
      }

      // crust glows from beneath
      if (t === CRUST) {
        const glow = 0.7 + Math.sin(time * 3 + tx) * 0.3;
        ctx.fillStyle = grey(glow);
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
      }

      // cracks
      const dmg = damage.get(ty * WORLD_W + tx);
      if (dmg) {
        ctx.strokeStyle = story.inv > 0.5 ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k < dmg; k++) {
          const a = hash2(tx + k * 31, ty + k * 17) * Math.PI;
          const cx = px + 4 + hash2(tx * k + 1, ty) * 8;
          const cy = py + 4 + hash2(tx, ty * k + 1) * 8;
          ctx.moveTo(cx - Math.cos(a) * 5, cy - Math.sin(a) * 5);
          ctx.lineTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
        }
        ctx.stroke();
      }
    }
  }

  // dither static at tile edges during the unmaking
  if (story.inv > 0.05) {
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tileAt(tx, ty) === AIR) continue;
        if (hash2(tx * 5 + (time * 8 | 0), ty * 3) < story.inv * 0.15) {
          ctx.fillStyle = grey(hash2(tx, ty + (time * 60 | 0)));
          ctx.fillRect(tx * TILE + (hash2(tx, ty) * 12 | 0), ty * TILE + (hash2(ty, tx) * 12 | 0), 2, 2);
        }
      }
    }
  }
}

function drawDarkness(x0, x1, y0, y1) {
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const a = (1 - lightAt(tx, ty)) * 0.96;
      if (a < 0.02) continue;
      // in the underside-sky band, don't darken (it's lit sky)
      const depth = ty - SURFACE_BASE;
      if (depth >= BAND.UNDERSIDE && depth < BAND.UNMAKING && tileAt(tx, ty) === AIR) continue;
      ctx.fillStyle = story.inv > 0.5
        ? `rgba(255,255,255,${(a * 0.9).toFixed(3)})`   // "darkness" inverts to white
        : `rgba(0,0,0,${a.toFixed(3)})`;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
}

// ---------------------------------------------------------------- dwarf sprite
function drawDwarf(cx, topY, facing, time, swingT, swingAim, vx, isPlayer) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(topY));
  ctx.scale(facing, 1);
  const ink = isPlayer ? grey(0.02) : grey(0.02);

  const moving = Math.abs(vx) > 10;
  const leg = moving ? Math.sin(player.walkT * 14) * 3 : 0;
  const bob = moving ? Math.abs(Math.sin(player.walkT * 14)) * 1.1 : Math.sin(time * 2) * 0.5;

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // legs (stubby)
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-2, 16 + bob * 0.3); ctx.lineTo(-2 + leg, 22);
  ctx.moveTo(2, 16 + bob * 0.3); ctx.lineTo(2 - leg, 22);
  ctx.stroke();

  // round stocky body
  ctx.beginPath();
  ctx.ellipse(0, 12 + bob * 0.3, 5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // beard (mid-grey so it reads off the black body)
  ctx.fillStyle = grey(0.55);
  ctx.beginPath();
  ctx.moveTo(-4, 7.5 + bob * 0.4);
  ctx.lineTo(4, 7.5 + bob * 0.4);
  ctx.lineTo(2.5, 14 + bob * 0.3);
  ctx.lineTo(0, 15.5 + bob * 0.3);
  ctx.lineTo(-2.5, 14 + bob * 0.3);
  ctx.closePath();
  ctx.fill();

  // head
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(0, 6 + bob * 0.4, 3.6, 0, Math.PI * 2);
  ctx.fill();

  // hardhat: dome + brim
  ctx.beginPath();
  ctx.arc(0, 3.6 + bob * 0.4, 4.4, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-5.5, 3.2 + bob * 0.4, 11, 1.8);
  // headlamp — one white pixel (justifies the lantern light)
  ctx.fillStyle = grey(0.98);
  ctx.fillRect(3, 3.4 + bob * 0.4, 2, 2);

  // arm + shovel
  ctx.fillStyle = ink; ctx.strokeStyle = ink;
  const swinging = swingT > 0;
  const prog = swinging ? 1 - swingT / 0.16 : 0;
  let armA = 0.7;
  if (swinging) {
    const aim = Math.abs(facing === 1 ? swingAim : Math.PI - swingAim);
    armA = (aim - 1.1) + Math.sin(prog * Math.PI) * 1.4;
  }
  const sx = 0, sy = 11 + bob * 0.3;
  const hx = sx + Math.cos(armA) * 6, hy = sy + Math.sin(armA) * 6;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  const tipX = sx + Math.cos(armA) * 15, tipY = sy + Math.sin(armA) * 15;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
  ctx.save();
  ctx.translate(tipX, tipY); ctx.rotate(armA);
  ctx.fillRect(0, -3, 5, 6);
  ctx.restore();

  ctx.restore();
}

function drawPlayer(time) {
  drawDwarf(player.x + player.w / 2, player.y, player.facing, time, player.swingT, player.swingAim, player.vx, true);
}

function drawOther(time) {
  if (!other || !other.alive) return;
  const flick = 0.6 + Math.sin(other.t * 20) * 0.4;   // it flickers, unstable
  ctx.globalAlpha = flick;
  const swing = (other.digT % 0.4) < 0.16 ? 0.1 : 0;
  drawDwarf(other.x + 6, other.y, -1, time, swing, 0.9, 0, false);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- fossil & buried tent overlays
function drawSetPieces(time) {
  // shovel fossil — outline the air pocket so it reads as a relic
  if (story.fossil) {
    const { tx, ty } = story.fossil;
    ctx.strokeStyle = grey(0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(tx * TILE + 30, ty * TILE - 2, 4, 4); // faint marker; shape is the carved air
  }
  // buried tent — draw a faint sideways tent silhouette in its hollow
  if (story.buriedTent) {
    const { tx, ty } = story.buriedTent;
    ctx.save();
    ctx.translate(tx * TILE + 5 * TILE, ty * TILE + 3 * TILE);
    ctx.rotate(Math.PI / 2 + 0.2);   // fallen over
    drawTent(0, 0, 0.25);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- signs / typewriter
let activeSign = null, signT = 0;
function updateSigns(dt) {
  let near = null, best = 3 * TILE;
  for (const s of signs) {
    const dx = (s.tx + 0.5) * TILE - playerCX();
    const dy = (s.ty + 0.5) * TILE - playerCY();
    const d = Math.hypot(dx, dy);
    if (d < best) { best = d; near = s; }
  }
  if (near !== activeSign) { activeSign = near; signT = 0; }
  if (activeSign) signT = Math.min(activeSign.text.length, signT + dt * 22);
}

function drawSigns() {
  for (const s of signs) {
    const px = (s.tx + 0.5) * TILE, py = s.ty * TILE;
    // signpost
    ctx.fillStyle = grey(0.1);
    ctx.fillRect(px - 1, py, 2, TILE);
    ctx.fillRect(px - 6, py - 2, 12, 5);
  }
  if (activeSign) {
    let txt = activeSign.text.slice(0, Math.floor(signT));
    // garble text during the unmaking
    if (story.inv > 0.2 && !activeSign.surface) {
      txt = txt.split('').map((c, i) =>
        (c !== ' ' && hash2(i * 3 + (performance.now() / 120 | 0), 1) < story.inv * 0.5)
          ? String.fromCharCode(33 + (hash2(i, performance.now() / 200 | 0) * 90 | 0))
          : c).join('');
    }
    const px = (activeSign.tx + 0.5) * TILE, py = activeSign.ty * TILE - 14;
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const w = ctx.measureText(txt).width;
    ctx.fillStyle = story.inv > 0.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
    ctx.fillRect(px - w / 2 - 5, py - 15, w + 10, 19);
    ctx.fillStyle = grey(0.02);
    ctx.fillText(txt, px, py);
    ctx.textAlign = 'left';
  }
}

// ---------------------------------------------------------------- HUD
function iconGem(x, y) {
  ctx.fillStyle = grey(0.1);
  ctx.beginPath();
  ctx.moveTo(x + 6, y); ctx.lineTo(x + 11, y + 6); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x + 1, y + 6);
  ctx.closePath(); ctx.stroke();
}
function drawHUD() {
  ctx.font = 'bold 16px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  // gem + dirt counters, bottom-left (no depth — you have no bearings)
  const y = VIEW_H - 34;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(10, y - 6, 132, 30);
  ctx.strokeStyle = grey(0.1); ctx.lineWidth = 2;
  iconGem(18, y - 2);
  ctx.fillStyle = grey(0.02);
  ctx.fillText('× ' + gems, 34, y);
  // dirt block icon
  ctx.fillStyle = grey(0.55);
  ctx.fillRect(84, y, 12, 12);
  ctx.strokeRect(84, y, 12, 12);
  ctx.fillStyle = grey(0.02);
  ctx.fillText('× ' + dirt, 100, y);

  // controls hint (mutates with story)
  ctx.font = '12px ui-monospace, monospace';
  const hint = story.hintText;
  const tw = ctx.measureText(hint).width;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(VIEW_W / 2 - tw / 2 - 8, VIEW_H - 26, tw + 16, 20);
  ctx.fillStyle = grey(0.02);
  ctx.fillText(hint, VIEW_W / 2 - tw / 2, VIEW_H - 22);
}

// ---------------------------------------------------------------- render
function render(time) {
  const depth = depthOfPlayer();

  // sky (inverts during the unmaking; goes greyer each loop)
  ctx.fillStyle = grey(0.98 - story.loop * 0.04);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // void-fall: white nothing + giant DIG. drifting past
  if (story.falling) {
    ctx.fillStyle = grey(0.98);
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = grey(0.85);
    ctx.font = 'bold 220px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const dy = ((story.voidY * 0.4) % (VIEW_H * 2));
    ctx.fillText('DIG.', VIEW_W / 2, VIEW_H - dy);
    ctx.fillText('DIG.', VIEW_W / 2, VIEW_H * 2 - dy);
    ctx.textAlign = 'left';
    // the falling dwarf, centred
    drawDwarf(VIEW_W / 2, VIEW_H / 2 - 20, player.facing, time, 0, 0.9, 0, true);
    drawHUD();
    return;
  }

  const shakeX = (Math.random() - 0.5) * shake;
  const shakeY = (Math.random() - 0.5) * shake;
  ctx.save();
  ctx.translate(-Math.round(cam.x + shakeX), -Math.round(cam.y + shakeY));

  const x0 = Math.floor(cam.x / TILE) - 1;
  const x1 = Math.floor((cam.x + VIEW_W) / TILE) + 1;
  const y0 = Math.floor(cam.y / TILE) - 1;
  const y1 = Math.floor((cam.y + VIEW_H) / TILE) + 1;

  drawScenery(time, x0, x1);
  drawTiles(x0, x1, y0, y1, time);
  drawUndersideSky(time, x0, x1, y0, y1);
  drawSetPieces(time);
  drawSigns();

  // aim indicator (mouse)
  if (mouse.left || mouse.right) {
    const tx = Math.floor((mouse.x + cam.x) / TILE), ty = Math.floor((mouse.y + cam.y) / TILE);
    ctx.strokeStyle = tileInReach(tx, ty) ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
  }

  for (const p of particles) { ctx.fillStyle = grey(p.l); ctx.fillRect(p.x, p.y, p.size, p.size); }

  drawOther(time);
  drawPlayer(time);
  drawDarkness(x0, x1, y0, y1);

  ctx.restore();
  drawHUD();
}

// ---------------------------------------------------------------- story tick
function updateStory(dt, depth) {
  // inversion ramps through the unmaking band
  story.inv = clamp01((depth - BAND.UNMAKING) / (BAND.CRUST - BAND.UNMAKING));

  // hint text mutation
  story.hintText = 'A/D move · SPACE jump · S/J dig · K place · R reset';
  if (depth > BAND.WRONG && story.wrongHint) story.hintText = 'A/D move · SPACE jump · S/J dig · K place · why';
  if (story.inv > 0.4) {
    story.hintText = story.hintText.split('').map(c =>
      (c !== ' ' && hash2(c.charCodeAt(0), performance.now() / 300 | 0) < story.inv * 0.4)
        ? String.fromCharCode(33 + (hash2(c.charCodeAt(0), 3) * 90 | 0)) : c).join('');
  }

  // one-shot: change the hint to "why" when entering WRONG band
  if (depth > BAND.WRONG + 4 && !story.wrongHint && !fired('why-hint')) {
    story.wrongHint = true;
    sfx.wrong();
  }

  // heartbeat in the WRONG band
  if (depth > BAND.WRONG && depth < BAND.UNDERSIDE) {
    story.heart -= dt;
    if (story.heart <= 0) { sfx.heartbeat(); story.heart = 0.9; }
  }

  updateDrone(depth);
  updateOther(dt);
}

// ---------------------------------------------------------------- loop
function reset() {
  seed = (Math.random() * 1e9) | 0;
  story.loop = 0;
  story.fired.clear();
  story.inv = 0;
  story.wrongHint = false;
  story.falling = false;
  gems = 0; dirt = 5;
  generateWorld();
  spawnPlayer();
  particles.length = 0;
  shake = 0;
  updateCamera(0, true);
}

const DT = 1 / 60;
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= DT) {
    if (story.falling) {
      updateVoidFall(DT);
    } else {
      updatePlayer(DT);
      updateDigging();
      updatePlacing();
      updateSigns(DT);
    }
    updateParticles(DT);
    updateStory(DT, depthOfPlayer());
    updateCamera(DT, false);
    shake = Math.max(0, shake - shake * 10 * DT - 0.5 * DT);
    acc -= DT;
  }
  render(now / 1000);
  requestAnimationFrame(frame);
}

story.hintText = 'A/D move · SPACE jump · S/J dig · K place · R reset';
generateWorld();
spawnPlayer();
updateCamera(0, true);
requestAnimationFrame(frame);
