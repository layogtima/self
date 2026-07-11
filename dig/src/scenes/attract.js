// THE FIELD RECORD - the opening that is also the trailer. Behind the title,
// the REAL game engine (makeGameScene demo mode, deterministic seed, persist
// disabled) plays an endless narrated loop of the game's life: waking, digging,
// meeting the neighbours, working the salvage line, reading the deep strata,
// and bringing something back. A scripted autopilot keeps the rover moving and
// genuinely interacting - real digs, a real scan card, a real E-load, a real
// resurrection - with soft cinematic cuts and storybook captions between
// chapters. No glitches, no corruption: just the mission, telling itself.

import { VIEW_W, VIEW_H, TILE, WORLD_W } from '../config.js';
import { keys, mouse, injectPress } from '../core/input.js';
import { text } from '../render/text.js';
import { makeGameScene } from './game.js';
import { DAY_LENGTH } from '../game/environment.js';
import { FAUNA_BY_ID } from '../content/fauna.js';
import { sfx } from '../core/audio.js';

const CUT_T = 0.9;                 // soft fade-through-black between chapters
const NUMERAL = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** aim the (virtual) mouse at a world point through the rig's camera */
function aimAt(rig, wx, wy) {
  mouse.x = Math.max(0, Math.min(VIEW_W, rig.cam.sx(wx)));
  mouse.y = Math.max(0, Math.min(VIEW_H, rig.cam.sy(wy)));
}
function releaseInputs() {
  for (const k of Object.keys(keys)) keys[k] = false;
  mouse.left = false; mouse.right = false;
}
/** put the rover at a column, feet on the surface, camera snapped */
function placeAt(rig, col, dy = 0) {
  const c = Math.max(4, Math.min(WORLD_W - 4, col));
  rig.player.x = c * TILE + 2;
  rig.player.y = (rig.world.surface[c] + dy - 1) * TILE - 15;
  rig.player.vx = 0; rig.player.vy = 0;
  rig.cam.follow(rig.player.cx(), rig.player.cy(), 0, true);
}
/** nearest cave air pocket at ~depth with a floor, to stage the deep chapters */
function findPocket(rig, wantDepth) {
  const w = rig.world;
  for (let tx = 20; tx < WORLD_W - 20; tx += 3) {
    const ty = w.surface[tx] + wantDepth;
    if (w.tileAt(tx, ty) === 0 && w.tileAt(tx + 1, ty) === 0 && w.solidAt(tx, ty + 1)) return { tx, ty };
  }
  return null;
}
/** amble: drive in a lazy patrol so the rover never stands still */
function amble(t, period = 3.4) {
  const ph = t % period;
  keys.KeyD = ph < period * 0.5;
  keys.KeyA = ph >= period * 0.5 && ph < period * 0.95;
}
/** hop over terrain steps - but only after genuinely stalling for a while.
 *  (the old instant version fired on every walk start and read as anxious bouncing) */
function autoHop(rig, dt, st) {
  const trying = (keys.KeyA || keys.KeyD) && Math.abs(rig.player.vx) < 8 && rig.player.onGround;
  st.stall = trying ? st.stall + dt : 0;
  if (st.stall > 0.55) { st.stall = -0.4; injectPress('Space'); }   // hop, then cool down
}
/** the rover's emotional range: two keys and a headlight, used with intent */
const EMOTE = {
  /** wonder - a slow searching sweep of the light across the new world */
  wonder(rig, t) { aimAt(rig, rig.player.cx() + Math.cos(t * 1.1) * 90, rig.player.cy() - 24 + Math.sin(t * 0.8) * 30); },
  /** attention - light pinned on the thing, with the tiniest tremble of focus */
  watch(rig, wx, wy, t) { aimAt(rig, wx + Math.sin(t * 6) * 2, wy); },
  /** surprise - one startled step away; the light never leaves the thing */
  startle(rig, dir, tt) { keys[dir > 0 ? 'KeyD' : 'KeyA'] = tt >= 0 && tt < 0.22; },
  /** delight - a little hop on the spot (self-limiting: only fires grounded) */
  hop(rig) { if (rig.player.onGround) injectPress('Space'); },
  /** patience - small weight-shifts so standing never reads as powered down */
  fidget(t, period = 3.4) { const ph = t % period; keys.KeyD = ph < 0.14; keys.KeyA = ph > 1.8 && ph < 1.94; },
};
/** stagecraft: level the ground across a beat's set so walks + machines line up.
 *  Pass lvl to level TO a specific row (else the lowest point in range wins). */
function flatten(rig, c0, c1, lvl = null) {
  const w = rig.world, W = w.WORLD_W;
  if (lvl == null) { lvl = 0; for (let x = c0; x <= c1; x++) lvl = Math.max(lvl, w.surface[x]); }
  for (let x = Math.max(2, c0); x <= Math.min(W - 3, c1); x++) {
    for (let y = w.surface[x]; y < lvl; y++) w.tiles[y * W + x] = 0;                 // shave bumps to air
    for (let y = lvl; y < lvl + 4; y++) { const i = y * W + x; if (w.tiles[i] === 0 || w.tiles[i] === 4) w.tiles[i] = 1; }   // solid floor
    w.surface[x] = lvl;
  }
}

// ---- the six chapters ---------------------------------------------------------
const BEATS = [
  {
    id: 'awaken', dur: 7,
    card: ['it woke alone.', 'year 102,025. the makers are gone. something small boots up anyway.'],
    setup(rig) {
      // chapter one again: strike yesterday's sets, or the loop stacks
      // machines on machines and revenants on revenants
      for (const e of [...rig.entities.list]) if (e.type !== 'pod') rig.entities.remove(e.uid);
      const fa = rig.ambient._fauna;
      for (let i = fa.length - 1; i >= 0; i--) if (fa[i].spec?.revived || fa[i].kind === 'grazer') fa.splice(i, 1);
      rig.env._setClock(DAY_LENGTH * 0.97);        // the sky warming toward dawn
      rig.env._force('clear');
      // level the approach TO the pod's own ground row - never cut the ground
      // out from under the pod itself (it would be left hovering over the set)
      flatten(rig, rig.spawnCol - 18, rig.spawnCol - 2, rig.world.surface[rig.spawnCol]);
      placeAt(rig, rig.spawnCol - 12);
      this._home = (rig.spawnCol + 1) * TILE;
      this._marked = false;
    },
    run(rig, t) {
      // roll home to the pod, STOP there, look around, and mark home
      if (t > 0.8 && rig.player.cx() < this._home - 10) {
        keys.KeyD = true;
        aimAt(rig, rig.player.cx() + 60, rig.player.cy() - 8);
      } else {
        EMOTE.wonder(rig, t);                       // arrived: where... is this?
        if (!this._marked && t > 4) { this._marked = true; injectPress('KeyH'); }   // "this is home now"
      }
    },
  },
  {
    id: 'dig', dur: 8,
    card: ['it learned to dig.', 'every metre down is a million years back.'],
    setup(rig) {
      rig.env._setClock(DAY_LENGTH * 0.2);         // bright morning
      rig.switchMode('laser');
      placeAt(rig, rig.spawnCol + 26);
    },
    run(rig, t) {
      // stair-cut: drive right while lasering ahead-and-down
      keys.KeyD = t % 2.2 < 1.5;
      aimAt(rig, rig.player.cx() + 34, rig.player.cy() + 26);
      mouse.left = true;
    },
  },
  {
    id: 'scan', dur: 8,
    card: ['it met the neighbours.', 'the scanner reads the individual, not the species.'],
    setup(rig) {
      rig.env._setClock(DAY_LENGTH * 0.3);
      const col = rig.spawnCol - 30;
      flatten(rig, col - 12, col + 12);
      placeAt(rig, col + 8);                        // approach from the RIGHT this time
      // stage a calm grazing saiga to the left - the rover creeps up to it
      rig.ambient.release(FAUNA_BY_ID.grazer, (col + 1) * TILE, rig.world.surface[col + 1] * TILE);
      const f = rig.ambient._fauna[rig.ambient._fauna.length - 1];
      if (f) { f.state = 'feed'; f.age = 0.3; f.t = 0; }
      rig.switchMode('scan');
      this._near = (col + 5) * TILE;
      this._read = false; this._pleased = false;
    },
    run(rig, t) {
      const f = rig.ambient._fauna.find(x => x.kind === 'grazer');
      if (f) { f.state = 'feed'; f.x = Math.max(f.x, rig.player.cx() - TILE * 9); }
      keys.KeyA = t < 2.2 && rig.player.cx() > this._near;   // creep in from the right, then hold still
      mouse.left = t > 2 && t < 4.4;                          // lock, charge, the live card pops
      if (f) {
        if (t > 2.6) EMOTE.startle(rig, +1, t - 2.6);         // the card pops - a small double-take
        EMOTE.watch(rig, f.x, f.y - 6, t);                    // ...but it can't look away
      }
      if (!this._read && t > 6.6) { this._read = true; injectPress('Space'); }   // read it, tuck it away - ONCE
      if (!this._pleased && t > 7.2) { this._pleased = true; EMOTE.hop(rig); }   // a new neighbour!
    },
  },
  {
    id: 'salvage', dur: 9,
    card: ['it put their garbage to work.', 'their trash outlived them. it makes excellent machines.'],
    setup(rig) {
      rig.env._setClock(DAY_LENGTH * 0.62);        // dusk
      rig.env._force('rain', 0.5);                 // weather rolling in
      const col = rig.spawnCol + 8;
      flatten(rig, col - 5, col + 18);
      placeAt(rig, col - 2);
      const surfOf = c => rig.world.surface[c] - 1;
      for (const [type, dx, junk] of [['smelter', 3, 'scrap-metal'], ['pyrolysis', 7, 'tyre-chunk'], ['kiln', 11, 'glass-bottle']]) {
        const e = rig.entities.add(type, col + dx, surfOf(col + dx));
        e.queue.push(junk); e.battery = 18;
      }
      rig.entities.add('solar', col + 15, surfOf(col + 15));
      rig.entities.add('lamp-green', col + 5, surfOf(col + 5));
      rig.entities.add('lamp-amber', col + 13, surfOf(col + 13));
      // junk in the hold, so the E at the smelter is a REAL load
      rig.inventory.addGarbage('scrap-metal'); rig.inventory.addGarbage('aluminium-can');
      this._targetX = (col + 3.5) * TILE;   // the smelter
      this._col = col;
      this._fed = false;
    },
    run(rig, t) {
      if (!this._fed) {
        aimAt(rig, rig.player.cx() + 30, rig.player.cy() - 6);
        // walk TO the smelter (position-based, no overshoot), then feed it
        if (rig.player.cx() < this._targetX - 14) keys.KeyD = true;
        else { this._fed = true; injectPress('KeyE'); }
      } else {
        // supervise the line: watch each machine in turn, shifting weight
        const dx = [3, 7, 11][Math.floor(t / 2.6) % 3];
        EMOTE.watch(rig, (this._col + dx + 0.5) * TILE, rig.player.cy() - 12, t);
        EMOTE.fidget(t);
      }
    },
  },
  {
    id: 'descend', dur: 8,
    card: ['it read the planet’s diary.', 'the strata keep every day. the laser turns the pages.'],
    setup(rig) {
      rig.env._setClock(DAY_LENGTH * 0.35);        // noon god-rays overhead
      const p = findPocket(rig, 60) || { tx: rig.spawnCol + 40, ty: rig.world.surface[rig.spawnCol + 40] + 8 };
      rig.player.x = p.tx * TILE + 2;
      rig.player.y = p.ty * TILE - 15;
      rig.player.vx = 0; rig.player.vy = 0;
      rig.cam.follow(rig.player.cx(), rig.player.cy(), 0, true);
      // stage the quench: lava beside water on the pocket floor, walled in
      const W = rig.world.WORLD_W, tls = rig.world.tiles;
      const ry = p.ty, rx = p.tx + 3;
      tls[ry * W + rx] = 5; tls[ry * W + rx + 1] = 4;             // T_LAVA | T_WATER
      tls[ry * W + rx - 1] = 1; tls[ry * W + rx + 2] = 1;         // rock plugs
      rig.world.wakeFluid(rx, ry); rig.world.wakeFluid(rx + 1, ry);
      rig.switchMode('laser');
    },
    run(rig, t) {
      // chip at the cave wall between glances at the hissing obsidian
      aimAt(rig, rig.player.cx() + 40, rig.player.cy() + (t % 3 < 1.5 ? 14 : -10));
      mouse.left = t % 3 < 1.4;
      if (t > 2.5) amble(t, 4.4);
    },
  },
  {
    id: 'resurrect', dur: 9,
    card: ['and it brought them back.', 'extinction, it turns out, is negotiable.'],
    setup(rig) {
      rig.env._setClock(DAY_LENGTH * 0.8);         // deep night
      rig.env._force('clear');
      rig.env._forceEvent('aurora', 0.3);
      const col = rig.spawnCol - 12;
      flatten(rig, col - 6, col + 10);
      placeAt(rig, col - 3);
      rig.entities.add('incubator', col + 4, rig.world.surface[col + 4] - 1);
      // a completed genome, so the E at the incubator is a REAL resurrection
      // (cleared each loop so the reel can revive it again forever)
      rig.revived.delete('coelophysis');
      rig.collection.addGenome('coelophysis', 1);
      this._targetX = (col + 4.5) * TILE;
      this._revived = false;
    },
    run(rig, t) {
      if (!this._revived) {
        aimAt(rig, rig.player.cx() + 50, rig.player.cy() - 20);
        // walk to the womb of glass (position-based), then press the button
        if (rig.player.cx() < this._targetX - 16) keys.KeyD = true;
        else { this._revived = true; this._revT = t; injectPress('KeyE'); sfx.reveal?.(); }
      } else {
        const since = t - this._revT;
        if ((since > 0.5 && since < 0.6) || (since > 1.1 && since < 1.2)) EMOTE.hop(rig);   // it WORKED. it's ALIVE.
        // walk alongside whatever came back, unable to look away
        const rev = rig.ambient._fauna.find(f => f.spec?.revived);
        if (rev) {
          EMOTE.watch(rig, rev.x, rev.y - 8, t);
          keys.KeyD = rev.x > rig.player.cx() + 14;
          keys.KeyA = rev.x < rig.player.cx() - 34;
        } else EMOTE.wonder(rig, t);
      }
    },
  },
];

export function makeAttractScene(services) {
  let demo = makeGameScene(services, { demo: true });
  const rig = demo._rig;
  let beat = 0, tBeat = 0, cutT = 0, started = false, disposed = false;
  const hopSt = { stall: 0 };

  function startBeat(i) {
    releaseInputs();
    rig.switchMode('laser');
    const b = BEATS[i];
    b.setup(rig);
    tBeat = 0;
  }

  return {
    /** test/inspection hooks */
    get _beat() { return beat; },
    get _rig() { return rig; },
    /** screen-space y of the ground line under the rover (the title parks its buttons below it) */
    get _groundY() { return disposed ? VIEW_H - 175 : rig.cam.sy(rig.player.y + 16); },

    /** free the reel's demo world (~4MB) deterministically on hand-off to the game */
    dispose() {
      disposed = true;
      demo = null;
      if (rig) { rig.world = rig.ambient = rig.entities = rig.env = rig.player = null; }
    },

    update(dt) {
      if (disposed) return;
      if (!started) { started = true; startBeat(0); }
      if (cutT > 0) {
        cutT -= dt;
        if (cutT <= CUT_T / 2 && !this._switched) {         // switch chapters at full black
          this._switched = true;
          beat = (beat + 1) % BEATS.length;
          startBeat(beat);
        }
        if (cutT <= 0) this._switched = false;
        // keep the world breathing through the cut (the fade hides the teleport)
        demo.update(dt);
        return;
      }
      const b = BEATS[beat];
      releaseInputs();                              // every intent is re-asserted fresh each frame
      b.run(rig, tBeat, dt);
      autoHop(rig, dt, hopSt);                      // never stall on a terrain step (but don't bounce)
      demo.update(dt);
      tBeat += dt;
      if (tBeat >= b.dur) {
        releaseInputs();
        cutT = CUT_T;
      }
    },

    render(time) {
      if (disposed) return;
      demo.render(time);
      const ctx = services.ctx;

      // ---- storybook caption (lower third, typewriter) ----------------------
      const b = BEATS[beat];
      if (cutT <= 0 && tBeat > 0.5) {
        const [title, sub] = b.card;
        const shown = title.slice(0, Math.floor((tBeat - 0.5) / 0.045));
        const cy = VIEW_H - 92;
        ctx.fillStyle = 'rgba(14,12,10,0.68)';
        ctx.fillRect(VIEW_W / 2 - 270, cy - 8, 540, 56);
        ctx.fillStyle = '#E0A24A';
        ctx.fillRect(VIEW_W / 2 - 270, cy - 8, 3, 56);
        text(ctx, `${NUMERAL[beat]}.`, VIEW_W / 2 - 256, cy - 1, { size: 9, bold: true, color: 'rgba(75,227,232,0.85)' });
        text(ctx, shown, VIEW_W / 2 - 256, cy + 11, { size: 18, bold: true, color: '#F6E8C8' });
        if (tBeat > 2) text(ctx, sub, VIEW_W / 2 - 256, cy + 34, { size: 10, color: 'rgba(233,220,188,0.75)' });
      }

      // ---- soft cinematic cut: fade through black ----------------------------
      if (cutT > 0) {
        const a = 1 - Math.abs(cutT / CUT_T - 0.5) * 2;     // 0 → 1 → 0
        ctx.fillStyle = `rgba(5,6,10,${Math.min(1, a * 1.25).toFixed(3)})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    },
  };
}
