// Ambient life - the world breathes. Context-driven spawners, all tiny and
// bounded. Overground: bird flocks, butterflies, pollen, scurrying critters.
// Underground: dust motes in the headlight, ceiling drips (+plink), pebble
// trickles after digs, deep crystal twinkles, one-shot bat bursts from caverns.
// (Grass/canopy sway is drawn by the scenery layer using time - no state here.)

import { TILE, WORLD_W, WORLD_H, WIN_W, WIN_H, T_AIR, T_WATER } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { sfx } from '../core/audio.js';
import { pickFauna, FAUNA_BY_ID } from '../content/fauna.js';
import { drawFauna } from '../render/fauna.js';
import { biomeAtX } from '../content/biomes.js';
import { findShelter, forageAt, findForage, caveFeaturesAt } from './features.js';

// v5.4: creatures are RESIDENTS now - a bounded roster that lives full lives and
// persists across camera + reload, instead of a churn of 40-70s spawns.
// v5.7b: a MUCH bigger living roster - the world felt empty with 16. Density is
// kept sane by higher spawn rates filling the caps + a far-off-camera cull below
// (fauna follow the rover instead of pooling behind it), not by a tiny ceiling.
const MAX = { birds: 4, butterflies: 16, motes: 40, drips: 26, pebbles: 30, bats: 16, critters: 2, fauna: 64 };
const SURFACE_CAP = 38, WATER_CAP = 10, CAVE_CAP_SHALLOW = 14, CAVE_CAP_DEEP = 9;
// predators persist while prey get eaten, so without a hard cap the roster fills
// with hunters. Keep them scarce per zone so it stays prey-heavy (a few visible
// hunters, not a convention).
const PREDATOR_CAP = 3;
const LIFE = 1e9;   // creatures die of OLD AGE (age→1→fade), not an arbitrary timer

export function makeAmbient() {
  const birds = [];       // flocks: {x,y,vx,members:[{ox,oy,ph}]}
  const butterflies = []; // {x,y,t,anchor}
  const motes = [];       // {x,y,vx,vy,life}
  const drips = [];       // {x,y,vy,life} falling droplets
  const pebbles = [];     // {x,y,vy,life}
  const bats = [];        // {x,y,vx,vy,t}
  const critters = [];    // {x,dir,t,leg}
  // fauna: proper creatures with tiny brains {kind,x,y,dir,state,t,life}
  //   surface: grazer | hopper | lizard   caves: salamander | spider
  const fauna = [];
  const fireflies = [];    // {x,y,t,life} night-only glowers
  const glowSpots = [];   // discovered glowworm ceiling patches {x,y,n,seed}
  const litCaverns = new Set();
  let dripScan = 0;
  let weatherRef = null;  // set via setWeather()

  let lures = [];   // built Lure Beacon world-x positions (spawn bias)
  let prevCamX = null;   // camera velocity → spawn on the LEADING edge while driving

  return {
    /** the environment engine, for rain-driven drips + wind scatter */
    setEnvironment(env) { weatherRef = env; },
    /** the built Lure Beacons draw fauna toward them (set per frame) */
    setLures(list) { lures = list || []; },

    /** resurrection: inject a living creature from a synthetic spec (fossil
     *  revival). It joins the ambient world - ages, breeds, is scannable. */
    release(spec, x, y) {
      fauna.push({
        kind: spec.id, spec, zone: spec.zone || 'surface', x, y, home: x,
        dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0,
        life: LIFE, ph: Math.random() * 7, age: 0.25, fade: 0, mateCd: 8,
        hunger: Math.random() * 0.3, energy: 0.7 + Math.random() * 0.3, _keep: true,   // a resurrected species is never culled off-camera
      });
    },

    /** call after a tile breaks - a little settling trickle above the hole */
    onDig(wx, wy) {
      if (pebbles.length < MAX.pebbles && Math.random() < 0.5) {
        for (let i = 0; i < 2; i++) pebbles.push({ x: wx + (Math.random() - 0.5) * 10, y: wy - 8, vy: 20 + Math.random() * 30, life: 1.2 });
      }
      // the ground shudders: nearby fauna startle and bolt (throttled - digging
      // calls this several times a second)
      if (Math.random() < 0.3) {
        for (const f of fauna) {
          if (f.state === 'flee' || f.state === 'sleep' || (f.age ?? 1) < 0.15) continue;
          if (Math.abs(f.x - wx) < TILE * 6 && Math.abs((f.y || wy) - wy) < TILE * 6) {
            f.state = 'flee'; f.dir = f.x < wx ? -1 : 1; f.t = 0;
          }
        }
      }
    },

    update(dt, world, player, cam, depth, lightPoly, env, emitters = []) {
      const lamps = emitters;   // (legacy name in the firefly light-pollution check)
      const b = cam.bounds();
      const camVx = prevCamX == null ? 0 : cam.x - prevCamX;   // >0 = panning right
      prevCamX = cam.x;
      const above = depth < 2;
      // a column whose surface row is water = a pond bank (ground fauna avoid it)
      const surfaceIsWater = (tx) => {
        const s = world.surface[Math.max(0, Math.min(WORLD_W - 1, tx))];
        return world.fluidAt?.(tx, s) === T_WATER || world.fluidAt?.(tx, s - 1) === T_WATER;
      };
      // a newborn beside its parent: same kind/zone, age 0 (tiny), inherits life
      const spawnJuvenile = (parent) => {
        if (fauna.length >= MAX.fauna) return;
        fauna.push({
          kind: parent.kind, spec: parent.spec, zone: parent.zone,
          x: parent.x + (Math.random() < 0.5 ? -6 : 6), y: parent.y || 0, home: parent.home ?? parent.x,
          dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0,
          life: LIFE, ph: Math.random() * 7, age: 0.02, fade: 0, mateCd: 20,
          hunger: Math.random() * 0.3, energy: 0.7 + Math.random() * 0.3,
        });
      };
      // time & weather drive who is out and how they behave (mod 14)
      const night = env ? env.night01() : 0;
      const weather = env ? env.weather : 'clear';
      const raining = weather === 'rain' || weather === 'storm';
      const storm = weather === 'storm';
      const clearish = weather === 'clear' || weather === 'overcast';
      const isDay = night < 0.35;

      // ---------- overground ----------
      if (above || player.cy() < world.surface[player.tx()] * TILE + TILE * 6) {
        // bird flocks (day only)
        if (isDay && birds.length < MAX.birds && Math.random() < 0.003) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const y = 40 + Math.random() * 110;
          birds.push({
            x: dir > 0 ? cam.x - 60 : cam.x + WIN_W + 60, y, vx: dir * (26 + Math.random() * 14),
            members: Array.from({ length: 3 + (Math.random() * 4 | 0) }, (_, i) => ({ ox: -i * 12 * dir + (Math.random() - 0.5) * 8, oy: (i % 2 ? 7 : -5) + (Math.random() - 0.5) * 4, ph: Math.random() * 6 })),
          });
        }
        // butterflies: only bright, dry days
        if (isDay && clearish && !raining && butterflies.length < MAX.butterflies && Math.random() < 0.016) {
          const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(cam.x / TILE) + (Math.random() * (WIN_W / TILE) | 0)));
          butterflies.push({ x: tx * TILE, y: world.surface[tx] * TILE - 8 - Math.random() * 24, t: Math.random() * 10, age: 0.1 + Math.random() * 0.5, fade: 0, mateCd: 0 });
        }
        // a critter scurries by (rare, one at a time)
        if (critters.length < MAX.critters && Math.random() < 0.0008) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          critters.push({ x: dir > 0 ? cam.x - 20 : cam.x + WIN_W + 20, dir, t: 0, life: 14 });
        }
        // surface fauna: whoever the registry says is out in this time & weather.
        // A Lure Beacon in view calls them out faster + spawns them near it.
        const lureNear = lures.find(lx => lx > b.x0 * TILE - 40 && lx < b.x1 * TILE + 40);
        const spawnP = 0.022 * (lureNear ? 3 : 1);
        if (fauna.length < MAX.fauna && fauna.filter(f => f.zone === 'surface').length < SURFACE_CAP && Math.random() < spawnP) {
          // spawn on the LEADING edge while driving so you move INTO fresh life
          // instead of leaving it all behind (both edges when roughly still)
          const dir = camVx > 12 ? -1 : camVx < -12 ? 1 : (Math.random() < 0.5 ? 1 : -1);
          const spawnX = dir > 0 ? cam.x - 30 : cam.x + WIN_W + 30;
          let spawnTx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(spawnX / TILE)));
          const biomeId = biomeAtX(spawnTx, WORLD_W).id;
          // moths (nocturnal fliers) come out at night via the registry; ground
          // kinds never on a pond. Aerial kinds hover; the rest walk in.
          let spec = surfaceIsWater(spawnTx) ? null : pickFauna('surface', { isDay, weather, depth: 0, biomeId });
          if (spec?.prey && fauna.filter(f => f.zone === 'surface' && f.spec?.prey).length >= PREDATOR_CAP) spec = null;   // keep hunters scarce
          if (spec) {
            // ground foragers AND their hunters seat near the green, so life
            // clusters around food instead of scattering across bare ground
            if (!spec.aerial && (spec.grazes || spec.prey)) {
              const fx = findForage(world, spawnX, 16);
              if (fx != null) spawnTx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(fx / TILE)));
            }
            const sx = spec.aerial ? spawnX : (spawnTx + 0.5) * TILE;
            const gy = world.surface[spawnTx] * TILE;
            fauna.push({
              kind: spec.id, spec, zone: 'surface', x: sx, home: sx,
              y: spec.aerial ? gy - 22 - Math.random() * 30 : 0,
              dir, state: 'walk', t: 0, life: LIFE, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0,
              hunger: Math.random() * 0.3, energy: 0.7 + Math.random() * 0.3,
            });
          }
        }
        // fireflies drift over the surface on warm nights
        if (night > 0.5 && !raining && fireflies.length < 28 && Math.random() < 0.06) {
          const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(cam.x / TILE) + (Math.random() * (WIN_W / TILE) | 0)));
          fireflies.push({ x: tx * TILE, y: world.surface[tx] * TILE - 6 - Math.random() * 40, t: Math.random() * 7, life: 999, age: 0.1 + Math.random() * 0.5, fade: 0, mateCd: 0 });
        }
      }

      // pond life: fish spawn in visible near-surface water (zone 'water').
      // A global fauna cap keeps the array bounded whatever the zone mix is.
      if (fauna.length < MAX.fauna && fauna.filter(f => f.zone === 'water').length < WATER_CAP && Math.random() < 0.03) {
        for (let tries = 0; tries < 12; tries++) {
          const tx = b.x0 + ((Math.random() * (b.x1 - b.x0)) | 0);
          const ty = b.y0 + ((Math.random() * (b.y1 - b.y0)) | 0);
          if (world.fluidAt?.(tx, ty) !== T_WATER || world.depthOfRow(tx, ty) > 10) continue;
          const biomeId = biomeAtX(tx, WORLD_W).id;
          const spec = pickFauna('water', { isDay, weather, depth: 0, biomeId });
          if (spec) {
            fauna.push({ kind: spec.id, spec, zone: 'water', x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, home: (tx + 0.5) * TILE, dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0, life: LIFE, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0, hunger: Math.random() * 0.3, energy: 0.7 + Math.random() * 0.3 });
          }
          break;
        }
      }

      // cave fauna: registry-picked for this depth, near the player. The
      // sunlit shallows (depth 5-30) get a livelier cap - dip under the grass
      // and something is home.
      const caveCount = fauna.filter(f => f.zone === 'cave').length;
      const caveCap = depth < 30 ? CAVE_CAP_SHALLOW : CAVE_CAP_DEEP;
      if (depth > 5 && fauna.length < MAX.fauna && caveCount < caveCap && Math.random() < 0.03) {
        const biomeId = biomeAtX(player.tx(), WORLD_W).id;
        let spec = pickFauna('cave', { isDay, weather, depth, biomeId });
        if (spec?.prey && fauna.filter(f => f.zone === 'cave' && f.spec?.prey).length >= PREDATOR_CAP) spec = null;   // keep hunters scarce
        // seat it on a nearby air-tile floor/wall
        if (spec) for (let tries = 0; tries < 10; tries++) {
          const tx = player.tx() + ((Math.random() * 16 - 8) | 0);
          const ty = Math.floor(player.cy() / TILE) + ((Math.random() * 10 - 5) | 0);
          if (world.tileAt(tx, ty) === T_AIR && world.solidAt(tx, ty + 1)) {
            fauna.push({ kind: spec.id, spec, zone: 'cave', x: (tx + 0.5) * TILE, y: (ty + 1) * TILE, home: (tx + 0.5) * TILE, dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0, life: LIFE, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0, hunger: Math.random() * 0.3, energy: 0.7 + Math.random() * 0.3 });
            break;
          }
        }
      }
      // glowworm patches: ceilings of dark caves get constellations (persistent);
      // allowed from the shallow grottoes down (depth 18+)
      if (depth > 18 && glowSpots.length < 20 && Math.random() < 0.01) {
        const tx = b.x0 + ((Math.random() * (b.x1 - b.x0)) | 0);
        const ty = b.y0 + ((Math.random() * (b.y1 - b.y0)) | 0);
        if (world.tileAt(tx, ty) === T_AIR && world.solidAt(tx, ty - 1) && world.depthOfRow(tx, ty) > 18) {
          const key = `${tx >> 2},${ty >> 2}`;
          if (!glowSpots.some(g => g.key === key)) {
            glowSpots.push({ key, x: tx * TILE, y: ty * TILE, n: 3 + (Math.random() * 5 | 0), seed: Math.random() * 100 });
          }
        }
      }

      for (const f of birds) { f.x += f.vx * dt; }
      for (let i = birds.length - 1; i >= 0; i--) if (birds[i].x < cam.x - 300 || birds[i].x > cam.x + WIN_W + 300) birds.splice(i, 1);

      // glasswing butterflies: a real day: grow up, flit, pair off + lay, fade of
      // old age (not an arbitrary timer); they fold away at nightfall
      for (const bf of butterflies) {
        bf.t += dt;
        bf.age = Math.min(1, (bf.age ?? 0.5) + dt / 45);
        if (bf.age >= 1) bf.fade = (bf.fade || 0) + dt;
        bf.mateCd = Math.max(0, (bf.mateCd || 0) - dt);
        bf.x += Math.sin(bf.t * 2.2) * 18 * dt; bf.y += Math.cos(bf.t * 3.1) * 12 * dt;
        if (bf.age > 0.4 && bf.age < 0.9 && bf.mateCd <= 0 && butterflies.length < MAX.butterflies && Math.random() < 0.006) {
          const mate = butterflies.find(o => o !== bf && (o.age ?? 0) > 0.4 && (o.mateCd || 0) <= 0 && Math.abs(o.x - bf.x) < TILE && Math.abs(o.y - bf.y) < TILE);
          if (mate) { butterflies.push({ x: bf.x + 5, y: bf.y, t: 0, age: 0.02, fade: 0, mateCd: 20 }); bf.mateCd = mate.mateCd = 25; }
        }
      }
      for (let i = butterflies.length - 1; i >= 0; i--) if ((butterflies[i].fade || 0) > 2 || (env && env.night01() > 0.6)) butterflies.splice(i, 1);

      for (const cr of critters) {
        cr.t += dt; cr.life -= dt;
        cr.x += cr.dir * 46 * dt;
        const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(cr.x / TILE)));
        cr.y = world.surface[tx] * TILE - 3;
      }
      for (let i = critters.length - 1; i >= 0; i--) if (critters[i].life <= 0) critters.splice(i, 1);

      // ---------- underground ----------
      if (depth > 3) {
        // dust motes inside the light cone
        if (motes.length < MAX.motes && lightPoly && Math.random() < 0.5) {
          const p = lightPoly[1 + (Math.random() * (lightPoly.length - 1) | 0)];
          const t = Math.random();
          motes.push({
            x: player.cx() + (p.x - player.cx()) * t, y: player.cy() + (p.y - player.cy()) * t,
            vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 5, life: 2 + Math.random() * 2,
          });
        }
        // ceiling drips: scan a few random visible air tiles with rock above
        dripScan -= dt;
        const rainBoost = weatherRef ? 1 + weatherRef.precip01() * 2 : 1;
        if (dripScan <= 0 && drips.length < MAX.drips) {
          dripScan = 0.4 / rainBoost;
          for (let k = 0; k < 3; k++) {
            const tx = b.x0 + ((Math.random() * (b.x1 - b.x0)) | 0);
            const ty = b.y0 + ((Math.random() * (b.y1 - b.y0)) | 0);
            if (tx < 1 || tx >= WORLD_W - 1 || ty < 2 || ty >= WORLD_H - 3) continue;
            if (world.tileAt(tx, ty) === T_AIR && world.solidAt(tx, ty - 1) && world.depthOfRow(tx, ty) > 4 && Math.random() < 0.25) {
              drips.push({ x: (tx + 0.3 + Math.random() * 0.4) * TILE, y: ty * TILE + 1, vy: 0, life: 3 });
            }
          }
        }
        // bats: one burst per cavern region the first time it's near the light
        if (lightPoly && bats.length === 0 && Math.random() < 0.02) {
          const px = player.tx(), py = Math.floor(player.cy() / TILE);
          // find a decently open air region nearby (cavern-ish): count air neighbours
          for (const [ox, oy] of [[6, 2], [-6, 2], [8, -1], [-8, -1]]) {
            const tx = px + ox, ty = py + oy;
            const key = `${tx >> 3},${ty >> 3}`;
            if (litCaverns.has(key)) continue;
            let open = 0;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (world.tileAt(tx + dx, ty + dy) === T_AIR) open++;
            if (open > 16 && world.depthOfRow(tx, ty) > 40) {
              litCaverns.add(key);
              const n = 3 + (Math.random() * 3 | 0);
              for (let i = 0; i < n; i++) bats.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 40, t: 6 + Math.random() * 4, age: 0.2 + Math.random() * 0.6 });
              sfx.flutter?.();
              break;
            }
          }
        }
      }

      // fauna brains: wander/idle/feed/hunt/fight, flee the rover, sleep at
      // night, bolt in storms, grow up, and eventually fade of old age
      const diurnal = f => !!(f.spec?.activity?.day && !f.spec?.activity?.night);
      const nocturnalF = f => !!(f.spec?.nocturnal || f.spec?.activity?.night);
      const anyHunting = fauna.some(o => o.state === 'hunt');   // skip the prey-flee scan entirely when nobody hunts
      for (const f of fauna) {
        f.spec = f.spec || FAUNA_BY_ID[f.kind];   // tolerate registry-less spawns (tests)
        f.t += dt; f.life -= dt;

        // -- lifecycle: age up; the old fade out where they stand ---------------
        f.age = Math.min(1, (f.age ?? 0.5) + dt / (f.spec?.lifespan || 150));
        if (f.age >= 1) { f.fade = (f.fade || 0) + dt; if (f.fade > 2) f.life = 0; }

        // -- needs: hunger climbs, energy tracks activity. These drive the whole
        // predator/prey economy - hunting, grazing, breeding and starvation - so
        // the world runs on appetite instead of dice rolls.
        const restful = f.state === 'sleep' || f.state === 'roost' || f.state === 'idle';
        f.hunger = Math.min(1, (f.hunger ?? 0.2) + dt / (f.spec?.satiety ?? 90));
        f.energy = Math.max(0, Math.min(1, (f.energy ?? 0.8) + (restful ? dt / 40 : -dt / 160)));
        if (f.hunger >= 1 && f.age < 1 && Math.random() < dt * 0.05) f.age = 1;   // starved → old-age fade path

        // -- hunt: a HUNGRY predator picks the nearest reachable prey. Appetite
        // (not a flat dice roll) triggers it, and ANY fauna kind listed in `prey`
        // is fair game now - not just the old firefly/butterfly/prismfly pools.
        if (f.spec?.prey && f.state !== 'flee' && f.state !== 'eat' && f.state !== 'hunt'
          && f.age > 0.35 && f.hunger > 0.4 && f.energy > 0.15 && Math.random() < 0.3 * f.hunger) {
          let best = null, bd2 = (TILE * 11) ** 2;   // spot prey from ~11 tiles off
          const pool = [];
          if (f.spec.prey.includes('firefly')) for (const ff of fireflies) pool.push({ ref: ff, arr: fireflies, x: ff.x, y: ff.y });
          if (f.spec.prey.includes('butterfly')) for (const bf of butterflies) pool.push({ ref: bf, arr: butterflies, x: bf.x, y: bf.y });
          for (const o of fauna) if (o !== f && (o.age ?? 1) > 0.1 && f.spec.prey.includes(o.kind)) pool.push({ ref: o, arr: fauna, x: o.x, y: o.y });
          for (const c2 of pool) {
            const d2 = (c2.x - f.x) ** 2 + (c2.y - f.y) ** 2;
            if (d2 < bd2) { bd2 = d2; best = c2; }
          }
          if (best) { f.state = 'hunt'; f.quarry = best; f.t = 0; }
        }
        if (f.state === 'hunt') {
          const q = f.quarry;
          const gone = !q || !q.arr.includes(q.ref);
          if (gone || f.t > 8) { f.state = 'walk'; f.quarry = null; f.t = 0; }
          else {
            f.dir = q.ref.x >= f.x ? 1 : -1;
            if (Math.abs(q.ref.x - f.x) < 7 && Math.abs((q.ref.y ?? f.y) - f.y) < 12) {
              q.arr.splice(q.arr.indexOf(q.ref), 1);           // caught
              f.state = 'eat'; f.t = 0; f.quarry = null;
              f.hunger = Math.max(0, (f.hunger ?? 0) - 0.7);   // a full belly
              sfx.crumble?.();                                 // the beat of a kill
            }
          }
        }
        if (f.state === 'eat' && f.t > 2) { f.state = 'walk'; f.t = 0; }

        // -- forage: a hungry grazer heads for the nearest food plant and only
        // crops WHERE flora grows - grass/flowers/reeds/bush on the surface,
        // mushrooms in caves - so herds gather at the green and bare ground stays
        // empty. Pond grazers (mudskippers) nibble the bank abstractly.
        if (f.spec?.grazes && (f.hunger ?? 0) > 0.4 && (f.state === 'walk' || f.state === 'idle')) {
          if (f.zone === 'water') {
            if (Math.random() < 0.03) { f.state = 'feed'; f.t = 0; }
          } else if (f.zone === 'cave') {
            if (caveFeaturesAt(world, Math.floor(f.x / TILE), Math.floor(f.y / TILE))?.floor === 'mushroom' && Math.random() < 0.06) { f.state = 'feed'; f.t = 0; }
          } else if (forageAt(Math.floor(f.x / TILE), world)) {
            if (Math.random() < 0.06) { f.state = 'feed'; f.t = 0; }   // standing on food: crop it
          } else if (Math.random() < 0.03) {
            const fx = findForage(world, f.x, 26);                     // none here: amble toward the nearest patch
            if (fx != null && Math.abs(fx - f.x) > 4) f.dir = fx > f.x ? 1 : -1;
          }
        }
        if (f.state === 'feed' && f.t > 2.5) { f.state = 'walk'; f.t = 0; f.hunger = Math.max(0, (f.hunger ?? 0) - 0.5); }

        // -- drink: a surface creature at a pond bank dips to drink - the legible
        // "the herd came down to the water" beat
        if (f.zone === 'surface' && !f.spec?.aerial && f.state === 'walk' && Math.random() < 0.006) {
          const bankTx = Math.max(0, Math.min(WORLD_W - 1, Math.floor((f.x + f.dir * 8) / TILE)));
          if (surfaceIsWater(bankTx)) { f.state = 'drink'; f.t = 0; f.dir = (bankTx + 0.5) * TILE >= f.x ? 1 : -1; }
        }
        if (f.state === 'drink' && f.t > 2.5) { f.state = 'walk'; f.t = 0; }

        // -- fight: two adults of a kind, nose to nose - brief territorial shove -
        if (f.state === 'walk' && f.age > 0.5 && Math.random() < 0.02) {
          for (const o of fauna) {
            if (o === f || o.kind !== f.kind || (o.age ?? 0) < 0.5 || o.state === 'fight') continue;
            if (Math.abs(o.x - f.x) < 14 && Math.abs((o.y || 0) - (f.y || 0)) < 10) {
              f.state = 'fight'; o.state = 'fight'; f.t = 0; o.t = 0;
              f.dir = o.x >= f.x ? 1 : -1; o.dir = -f.dir;
              break;
            }
          }
        }
        if (f.state === 'fight') {
          f.x -= f.dir * 8 * dt;   // push apart, facing off
          if (f.t > 1.5) { f.state = 'walk'; f.t = 0; f.dir *= -1; }
        }

        // -- mate: two calm adults of a kind pair up and bear a juvenile, so the
        // world births + raises its own creatures (bounded: per-species cap +
        // per-parent cooldown keep meadows and ponds from overflowing)
        f.mateCd = Math.max(0, (f.mateCd || 0) - dt);
        if ((f.state === 'walk' || f.state === 'idle' || f.state === 'feed')
          && f.age > 0.5 && f.age < 0.95 && f.mateCd <= 0
          && (f.energy ?? 1) > 0.4 && (f.hunger ?? 0) < 0.6
          && fauna.length < MAX.fauna && Math.random() < 0.015) {
          const kin = fauna.filter(o => o.kind === f.kind);
          if (kin.length < 3) {
            for (const o of kin) {
              if (o === f || (o.age ?? 0) < 0.5 || o.mateCd > 0 || o.state === 'flee' || o.state === 'hunt') continue;
              if (Math.abs(o.x - f.x) < TILE * 1.5 && Math.abs((o.y || 0) - (f.y || 0)) < TILE) {
                f.state = o.state = 'mate'; f.t = o.t = 0;
                f.dir = o.x >= f.x ? 1 : -1; o.dir = -f.dir;
                f.mateCd = o.mateCd = 30; f._bearer = true;   // one of the pair bears
                break;
              }
            }
          }
        }
        if (f.state === 'mate') {
          if (f.t > 1.5) {
            if (f._bearer) { spawnJuvenile(f); f._bearer = false; }
            f.state = 'walk'; f.t = 0;
          }
        }

        // -- species behaviour: herders drift toward their own kind; baskers
        // sun-bathe (long idles) on clear days
        if (f.state === 'walk') {
          if (f.spec?.social === 'herd' && Math.random() < 0.03) {
            let nearest = null, nd = (TILE * 12) ** 2;
            for (const o of fauna) {
              if (o === f || o.kind !== f.kind) continue;
              const d2 = (o.x - f.x) ** 2; if (d2 < nd && d2 > 25) { nd = d2; nearest = o; }
            }
            if (nearest) f.dir = nearest.x >= f.x ? 1 : -1;   // amble toward the herd
          }
          if (f.spec?.basks && weather === 'clear' && night < 0.3 && Math.random() < 0.01) { f.state = 'idle'; f.t = -3; }   // long bask
        }

        // -- home range: forage near where you live; drift back when you stray
        if (f.state === 'walk' && f.home != null && Math.abs(f.x - f.home) > TILE * 22) {
          f.dir = f.home >= f.x ? 1 : -1;
        }

        // -- day/night rhythm: the world beds down. Diurnal ground kinds walk to
        // a tree/bush/rock at dusk (or in a storm) and SLEEP under it; nocturnal
        // fliers roost by day. They travel there and PARK - they don't blink out.
        const resting = f.state === 'sleep' || f.state === 'roost' || f.state === 'seekShelter';
        if (f.zone === 'surface' && !f.spec?.aerial) {
          const wantRest = diurnal(f) ? (night > 0.55 || storm) : false;
          if (wantRest && f.state !== 'flee' && !resting) {
            f._shelterX = findShelter(world, f.x) ?? f.x;   // nearest tree/bush/rock, else rest in place
            f.state = 'seekShelter'; f.t = 0;
          } else if (!wantRest && resting) { f.state = 'walk'; f.t = 0; }   // dawn / storm passed: forage again
          if (f.state === 'seekShelter') {
            const dx = (f._shelterX ?? f.x) - f.x;
            if (Math.abs(dx) < TILE * 0.8) { f.state = 'sleep'; f.t = 0; }   // arrived: bed down
            else f.dir = dx > 0 ? 1 : -1;
          }
        }
        if (f.spec?.aerial && nocturnalF(f)) {
          if (night < 0.4 && f.state !== 'flee' && f.state !== 'roost') { f.state = 'roost'; f.t = 0; }
          else if (night >= 0.4 && f.state === 'roost') { f.state = 'walk'; f.t = 0; }
        }

        // -- a nearby HUNTER scatters the prey: the other half of predation. Prey
        // only ever fled the rover before; now an active predator that lists this
        // kind sends it bolting - and a whole herd startles as one.
        if (anyHunting && f.state !== 'flee' && f.state !== 'sleep' && f.state !== 'eat' && (f.age ?? 1) > 0.15) {
          for (const o of fauna) {
            if (o === f || o.state !== 'hunt' || !o.spec?.prey?.includes(f.kind)) continue;
            const dx = o.x - f.x, dy = (o.y || 0) - (f.y || 0);
            if (dx * dx + dy * dy < (TILE * 5) ** 2) {
              f.state = 'flee'; f.dir = o.x < f.x ? 1 : -1; f.t = 0;
              if (f.spec?.social === 'herd') for (const k of fauna) {   // startle cascade
                if (k === f || k.kind !== f.kind || k.state === 'flee') continue;
                if (Math.abs(k.x - f.x) < TILE * 8) { k.state = 'flee'; k.dir = f.dir; k.t = Math.random() * 0.3; }
              }
              sfx.flutter?.();
              break;
            }
          }
        }

        // -- the rover approaches: brave kinds STAND AND DISPLAY before they run;
        // timid kinds bolt at once
        const distX = Math.abs(f.x - player.cx());
        const nearY = Math.abs((f.y || player.cy()) - player.cy()) < TILE * 6;
        const outer = distX < TILE * 6 && nearY, inner = distX < TILE * 3 && nearY;
        const runAway = () => { f.state = 'flee'; f.dir = f.x < player.cx() ? -1 : 1; f.t = 0; };
        if (f.spec?.intimidates) {
          if ((inner || (f.state === 'intimidate' && f.t > 1.5)) && f.state !== 'flee') runAway();
          else if (outer && f.state !== 'flee' && f.state !== 'intimidate') { f.state = 'intimidate'; f.dir = f.x < player.cx() ? 1 : -1; f.t = 0; }
          else if (f.state === 'intimidate' && !outer) { f.state = 'walk'; f.t = 0; }   // it left - stand down
        } else if (outer && f.state !== 'flee') runAway();
        const fleeMul = storm ? 1.4 : 1;
        const sp = f.spec?.speed || { walk: 24, flee: 50 };
        const STILL = f.state === 'sleep' || f.state === 'roost' || f.state === 'feed' || f.state === 'eat' || f.state === 'fight' || f.state === 'mate' || f.state === 'intimidate' || f.state === 'drink';
        const speed = STILL ? 0
          : f.state === 'flee' ? sp.flee * fleeMul
          : f.state === 'hunt' ? sp.flee   // pursue at full tilt so hunts actually close
          : (f.state === 'walk' || f.state === 'seekShelter') ? sp.walk : 0;
        if (f.state === 'flee' && f.t > 2.5) f.state = 'walk';
        if (f.state === 'walk' && f.t > 3 + (f.ph % 3)) { f.state = Math.random() < 0.5 ? 'idle' : 'walk'; f.t = 0; if (Math.random() < 0.3) f.dir *= -1; }
        if (f.state === 'idle' && f.t > 2) { f.state = 'walk'; f.t = 0; }
        // fliers flutter; hoppers arc; swimmers stay wet; the rest slide their floor
        if (f.spec?.aerial) {
          const rest = f.state === 'roost';
          let vx = rest ? 0 : f.dir * (f.state === 'flee' ? sp.flee : sp.walk) * 0.5;
          let vy = rest ? 12 : Math.sin(f.t * 3 + f.ph) * 14;   // resting: settle down onto a leaf
          if (!rest && f.spec.attracted && emitters.length) {
            // lured by the nearest light: steer toward it (males mistake it for the moon)
            let best = null, bd = (TILE * 12) ** 2;
            for (const e of emitters) { const d2 = (e.x - f.x) ** 2 + (e.y - f.y) ** 2; if (d2 < bd) { bd = d2; best = e; } }
            if (best) { vx += (best.x - f.x) * 0.7; vy += (best.y - f.y) * 0.7; }
          }
          f.x += vx * dt; f.y += vy * dt;
          if (!rest && Math.random() < 0.02) f.dir *= -1;   // wander
          const atx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(f.x / TILE)));
          const gy = world.surface[atx] * TILE;
          f.y = Math.max(gy - 92, Math.min(gy - (rest ? 4 : 8), f.y));   // between the canopy and the sky
        } else if (f.zone === 'water') {
          // swim: advance only while the water continues; turn at the banks
          if (speed > 0) {
            const nx = f.x + f.dir * speed * dt;
            const aheadTx = Math.floor((nx + f.dir * 5) / TILE);
            if (world.fluidAt?.(aheadTx, Math.floor(f.y / TILE)) === T_WATER) f.x = nx;
            else f.dir *= -1;
          }
          if (!f.spec?.amphibious) f.y += Math.sin(f.t * 2.1 + f.ph) * 4 * dt;   // fish bob; mudskippers perch still on the bank
          const txc = Math.floor(f.x / TILE), tyc = Math.floor(f.y / TILE);
          if (world.fluidAt?.(txc, tyc) !== T_WATER) {
            if (world.fluidAt?.(txc, tyc + 1) === T_WATER) f.y += 26 * dt;        // sink back in
            else if (world.fluidAt?.(txc, tyc - 1) === T_WATER) f.y -= 26 * dt;   // rise back in
            else f.life = 0;                                                      // pond gone - slip away
          }
        } else if (f.zone === 'surface') {
          if (speed > 0) {
            // ground creatures don't wade into ponds: turn at a water bank
            // (amphibious kinds may skim the very edge)
            const aheadTx = Math.max(0, Math.min(WORLD_W - 1, Math.floor((f.x + f.dir * 6) / TILE)));
            if (!f.spec?.amphibious && surfaceIsWater(aheadTx)) f.dir *= -1;
            else f.x += f.dir * speed * dt;
          }
          const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(f.x / TILE)));
          const baseY = world.surface[tx] * TILE;
          f.y = f.spec?.hop && speed > 0 ? baseY - Math.abs(Math.sin(f.t * 6)) * 10 : baseY;
        } else {
          if (speed > 0) {
            f.x += f.dir * speed * dt;
            const tx = Math.floor(f.x / TILE), ty = Math.floor(f.y / TILE) - 1;
            if (world.solidAt(tx, ty)) f.dir *= -1;          // wall: turn around
            else if (!world.solidAt(tx, Math.floor(f.y / TILE))) f.y += 30 * dt;  // step down gently
          }
        }
      }
      // clear the dead, and once the roster is busy reclaim residents that have
      // wandered more than a screen off-camera - so fresh life keeps spawning
      // AROUND the rover instead of pooling behind it (density follows you). The
      // mating pair and resurrected releases are spared.
      const cullX0 = cam.x - WIN_W * 0.5, cullX1 = cam.x + WIN_W * 1.5, cull = fauna.length > MAX.fauna * 0.5;
      for (let i = fauna.length - 1; i >= 0; i--) {
        const f = fauna[i];
        if (f.life <= 0) { fauna.splice(i, 1); continue; }
        if (cull && !f._keep && f.state !== 'mate' && (f.x < cullX0 || f.x > cullX1)) fauna.splice(i, 1);
      }

      for (const ff of fireflies) {
        ff.t += dt; ff.life -= dt * 0;   // natural death is old age now (life only falls under light pollution)
        ff.age = Math.min(1, (ff.age ?? 0.5) + dt / 40);
        if (ff.age >= 1) ff.fade = (ff.fade || 0) + dt;
        ff.mateCd = Math.max(0, (ff.mateCd || 0) - dt);
        ff.x += Math.sin(ff.t * 1.3) * 12 * dt; ff.y += Math.cos(ff.t * 1.7) * 8 * dt;
        // light pollution is real: harsh lamps drown the courtship code -
        // fireflies clear out. Amber (dark-sky) lamps they can live with.
        for (const L of lamps) {
          if (L.amber) continue;
          if ((ff.x - L.x) ** 2 + (ff.y - L.y) ** 2 < (TILE * 6) ** 2) { ff.life = Math.min(ff.life, 0.4) - dt; break; }
        }
        // courtship: two glowing adults near each other kindle a new spark
        if (ff.age > 0.4 && ff.age < 0.9 && ff.mateCd <= 0 && fireflies.length < 14 && Math.random() < 0.006) {
          const mate = fireflies.find(o => o !== ff && (o.age ?? 0) > 0.4 && (o.mateCd || 0) <= 0 && Math.abs(o.x - ff.x) < TILE && Math.abs(o.y - ff.y) < TILE);
          if (mate) { fireflies.push({ x: ff.x + 5, y: ff.y, t: 0, life: 999, age: 0.02, fade: 0, mateCd: 20 }); ff.mateCd = mate.mateCd = 25; }
        }
      }
      for (let i = fireflies.length - 1; i >= 0; i--) if (fireflies[i].life <= 0 || (fireflies[i].fade || 0) > 2 || (env && env.night01() < 0.3)) fireflies.splice(i, 1);

      // (luna moths are real fauna now - see the fauna brain's aerial branch;
      //  artificial light lures them, but they live near canopy regardless)
      this._lamps = emitters;   // for draw + scanTargets
      for (const m of motes) { m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; }
      for (let i = motes.length - 1; i >= 0; i--) if (motes[i].life <= 0) motes.splice(i, 1);

      for (const d of drips) {
        d.vy += 700 * dt; d.y += d.vy * dt; d.life -= dt;
        const ty = Math.floor(d.y / TILE), tx = Math.floor(d.x / TILE);
        if (world.solidAt(tx, ty)) { d.life = 0; if (Math.random() < 0.4) sfx.plink?.(); }
      }
      for (let i = drips.length - 1; i >= 0; i--) if (drips[i].life <= 0) drips.splice(i, 1);

      for (const p of pebbles) { p.vy += 600 * dt; p.y += p.vy * dt; p.life -= dt; }
      for (let i = pebbles.length - 1; i >= 0; i--) if (pebbles[i].life <= 0) pebbles.splice(i, 1);

      for (const bt of bats) {
        bt.t -= dt;
        bt.age = Math.min(1, (bt.age ?? 0.5) + dt / 90);   // they age like everything else
        bt.vy += Math.sin(bt.t * 20) * 40 * dt - 10 * dt;
        // turn at a wall so they wheel around the cavern instead of clipping out
        if (world.solidAt(Math.floor((bt.x + Math.sign(bt.vx) * 6) / TILE), Math.floor(bt.y / TILE))) bt.vx *= -1;
        bt.x += bt.vx * dt; bt.y += bt.vy * dt;
      }
      for (let i = bats.length - 1; i >= 0; i--) if (bats[i].t <= 0) bats.splice(i, 1);
    },

    /** world-space draw (call inside the camera transform, before darkness) */
    draw(ctx, time) {
      // birds: little "v" strokes with a flap
      ctx.strokeStyle = 'rgba(40,34,30,0.8)';
      ctx.lineWidth = 1.4;
      for (const f of birds) {
        for (const m of f.members) {
          const x = f.x + m.ox, y = f.y + m.oy;
          const flap = Math.sin(time * 9 + m.ph) * 2.4;
          ctx.beginPath();
          ctx.moveTo(x - 4, y - flap); ctx.lineTo(x, y); ctx.lineTo(x + 4, y - flap);
          ctx.stroke();
        }
      }
      // butterflies: two flickering wing dots (juveniles smaller)
      for (const bf of butterflies) {
        const open = Math.abs(Math.sin(bf.t * 10));
        const gr = 0.6 + Math.min(1, bf.age ?? 1) * 0.5;
        ctx.fillStyle = '#D8A0B8';
        ctx.fillRect(bf.x - (1 + open * 2) * gr, bf.y, 2 * gr, 2 * gr);
        ctx.fillRect(bf.x + (1 + open * 2) * gr - 2 * gr, bf.y, 2 * gr, 2 * gr);
      }
      // fireflies: pulsing amber dots (juveniles smaller)
      for (const ff of fireflies) {
        const pulse = 0.4 + Math.abs(Math.sin(ff.t * 3)) * 0.6;
        const s = 2 * (0.6 + Math.min(1, ff.age ?? 1) * 0.5);
        ctx.fillStyle = `rgba(255,210,90,${pulse.toFixed(2)})`;
        ctx.fillRect(ff.x, ff.y, s, s);
      }
      // critters: a scooting dark blob with legs
      ctx.fillStyle = '#3A3028';
      for (const cr of critters) {
        const wob = Math.abs(Math.sin(cr.t * 18)) * 1.4;
        ctx.beginPath(); ctx.ellipse(cr.x, cr.y - wob * 0.4, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cr.x - 4, cr.y + 1, 1.4, 2 + wob);
        ctx.fillRect(cr.x + 3, cr.y + 1, 1.4, 2 + wob * 0.6);
      }
      // motes
      ctx.fillStyle = 'rgba(255,240,210,0.5)';
      for (const m of motes) ctx.fillRect(m.x, m.y, 1.4, 1.4);
      // drips
      ctx.fillStyle = 'rgba(160,200,220,0.85)';
      for (const d of drips) ctx.fillRect(d.x, d.y, 1.6, 4);
      // pebbles
      ctx.fillStyle = 'rgba(90,74,60,0.9)';
      for (const p of pebbles) ctx.fillRect(p.x, p.y, 2, 2);
      // fauna
      for (const f of fauna) drawFauna(ctx, f, time);
      // glowworm constellations (visible in the dark - they self-illuminate)
      for (const g of glowSpots) {
        for (let i = 0; i < g.n; i++) {
          const gx = g.x + ((Math.imul(i + 1, 40503) >>> 0) % 28) - 6;
          const gy = g.y + ((Math.imul(i + 3, 30011) >>> 0) % 8);
          const pulse = 0.5 + Math.sin(time * 1.4 + g.seed + i * 1.7) * 0.4;
          ctx.fillStyle = `rgba(160,235,190,${(0.55 * pulse).toFixed(2)})`;
          ctx.fillRect(gx, gy, 1.6, 1.6);
        }
      }
      // bats
      ctx.strokeStyle = 'rgba(20,16,22,0.9)';
      ctx.lineWidth = 1.4;
      for (const bt of bats) {
        const flap = Math.sin(bt.t * 26) * 3;
        ctx.beginPath();
        ctx.moveTo(bt.x - 5, bt.y - flap); ctx.lineTo(bt.x, bt.y); ctx.lineTo(bt.x + 5, bt.y - flap);
        ctx.stroke();
      }
    },

    counts() { return { birds: birds.length, butterflies: butterflies.length, motes: motes.length, drips: drips.length, pebbles: pebbles.length, bats: bats.length, critters: critters.length, fauna: fauna.length, glow: glowSpots.length }; },
    /** live creatures near a world point, for the scanner (kind = codex id) */
    scanTargets(wx, wy, radius = TILE * 8) {
      const out = [];
      const r2 = radius * radius;
      for (const f of fauna) if ((f.x - wx) ** 2 + ((f.y || 0) - wy) ** 2 < r2) out.push({ kind: f.kind, x: f.x, y: f.y || 0, size: (f.spec || FAUNA_BY_ID[f.kind])?.size, ref: f });
      for (const ff of fireflies) if ((ff.x - wx) ** 2 + (ff.y - wy) ** 2 < r2) out.push({ kind: 'firefly', x: ff.x, y: ff.y, size: [4, 4], ref: ff });
      for (const bf of butterflies) if ((bf.x - wx) ** 2 + (bf.y - wy) ** 2 < r2) out.push({ kind: 'butterfly', x: bf.x, y: bf.y, size: [7, 5], ref: bf });
      for (const bt of bats) if ((bt.x - wx) ** 2 + (bt.y - wy) ** 2 < r2) out.push({ kind: 'bat', x: bt.x, y: bt.y, size: [9, 5], ref: bt });
      for (const g of glowSpots) if ((g.x - wx) ** 2 + (g.y - wy) ** 2 < r2) out.push({ kind: 'glowworm', x: g.x + 10, y: g.y });
      return out;
    },
    /** glowworm patches as light sources for the lighting pass */
    glowLights() { return glowSpots.map(g => ({ x: g.x + 10, y: g.y + 4, r: 34, warmth: 0 })); },

    /** the resident roster + discovered glow patches, for the save file. Spec is
     *  a live object ref (not serialized) - restore rebuilds it from the id. */
    serialize() {
      return {
        fauna: fauna.map(f => ({ kind: f.kind, zone: f.zone, x: f.x, y: f.y, home: f.home, dir: f.dir, state: f.state, age: f.age, ph: f.ph, mateCd: f.mateCd, hunger: f.hunger, energy: f.energy })),
        glow: glowSpots.map(g => ({ x: g.x, y: g.y, n: g.n, seed: g.seed })),
      };
    },
    /** repopulate from a saved roster (resolving spec from the registry; unknown kinds dropped) */
    restore(data) {
      if (!data) return;
      fauna.length = 0; glowSpots.length = 0;
      for (const s of data.fauna || []) {
        const spec = FAUNA_BY_ID[s.kind];
        if (!spec) continue;   // registry changed - retire this one
        fauna.push({ ...s, spec, t: 0, fade: 0, life: LIFE, hunger: s.hunger ?? 0.2, energy: s.energy ?? 0.8 });
      }
      for (const g of data.glow || []) glowSpots.push({ ...g, key: `${g.x >> 2},${g.y >> 2}` });
    },

    /** test hooks: inject/inspect the living arrays directly */
    _fauna: fauna,
    _fireflies: fireflies,
    _glow: glowSpots,
  };
}

// fauna art lives in render/fauna.js (FAUNA_ART), keyed by the registry's `draw` field.

// ---- live telemetry (the scanner reads the INDIVIDUAL, not just the species) --

/** human label for a brain state */
export const STATE_LABELS = {
  walk: 'ranging', idle: 'at rest', flee: 'fleeing', sleep: 'sleeping',
  feed: 'grazing', hunt: 'hunting', eat: 'feeding', fight: 'sparring',
  seekShelter: 'seeking cover', roost: 'roosting', intimidate: 'displaying', mate: 'courting', drink: 'drinking',
};

/** emotional read, derived from state + age - what the visor calls a mood */
export function moodOf(f) {
  if ((f.age ?? 0.5) >= 1) return 'FADING';
  switch (f.state) {
    case 'flee': return 'TERRIFIED';
    case 'hunt': return 'LOCKED ON';
    case 'eat': case 'feed': case 'drink': return 'CONTENT';
    case 'fight': return 'TERRITORIAL';
    case 'sleep': return 'DORMANT';
    case 'idle': return (f.age ?? 0.5) < 0.35 ? 'CURIOUS' : 'CALM';
    default: return 'CALM';
  }
}

/** freeze one creature's vitals for a card (the entity may despawn after) */
export function snapshotLive(f) {
  if (!f || f.age === undefined) return null;
  return {
    age: f.age ?? 0.5,
    lifespan: f.spec?.lifespan || 150,
    state: STATE_LABELS[f.state] || f.state || 'observed',
    mood: moodOf(f),
  };
}
