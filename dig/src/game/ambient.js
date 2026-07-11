// Ambient life - the world breathes. Context-driven spawners, all tiny and
// bounded. Overground: bird flocks, butterflies, pollen, scurrying critters.
// Underground: dust motes in the headlight, ceiling drips (+plink), pebble
// trickles after digs, deep crystal twinkles, one-shot bat bursts from caverns.
// (Grass/canopy sway is drawn by the scenery layer using time - no state here.)

import { TILE, WORLD_W, WORLD_H, VIEW_W, VIEW_H, T_AIR, T_WATER } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { sfx } from '../core/audio.js';
import { pickFauna, FAUNA_BY_ID } from '../content/fauna.js';
import { drawFauna } from '../render/fauna.js';
import { biomeAtX } from '../content/biomes.js';

const MAX = { birds: 2, butterflies: 6, motes: 40, drips: 26, pebbles: 30, bats: 12, critters: 1, fauna: 6 };

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
  const moths = [];        // {key,ang,r,t,life,x,y,disperse,dvx,dvy,fade} luna moths
  const glowSpots = [];   // discovered glowworm ceiling patches {x,y,n,seed}
  const litCaverns = new Set();
  let dripScan = 0;
  let weatherRef = null;  // set via setWeather()

  let lures = [];   // built Lure Beacon world-x positions (spawn bias)

  return {
    /** the environment engine, for rain-driven drips + wind scatter */
    setEnvironment(env) { weatherRef = env; },
    /** the built Lure Beacons draw fauna toward them (set per frame) */
    setLures(list) { lures = list || []; },

    /** resurrection: inject a living creature from a synthetic spec (fossil
     *  revival). It joins the ambient world - ages, breeds, is scannable. */
    release(spec, x, y) {
      fauna.push({
        kind: spec.id, spec, zone: spec.zone || 'surface', x, y,
        dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0,
        life: 240, ph: Math.random() * 7, age: 0.25, fade: 0, mateCd: 8,
      });
    },

    /** call after a tile breaks - a little settling trickle above the hole */
    onDig(wx, wy) {
      if (pebbles.length < MAX.pebbles && Math.random() < 0.5) {
        for (let i = 0; i < 2; i++) pebbles.push({ x: wx + (Math.random() - 0.5) * 10, y: wy - 8, vy: 20 + Math.random() * 30, life: 1.2 });
      }
    },

    update(dt, world, player, cam, depth, lightPoly, env, emitters = []) {
      const lamps = emitters;   // (legacy name in the firefly light-pollution check)
      const b = cam.bounds();
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
          x: parent.x + (Math.random() < 0.5 ? -6 : 6), y: parent.y || 0,
          dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0,
          life: 40 + Math.random() * 30, ph: Math.random() * 7, age: 0.02, fade: 0, mateCd: 20,
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
        if (isDay && birds.length < MAX.birds && Math.random() < 0.0012) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const y = 40 + Math.random() * 110;
          birds.push({
            x: dir > 0 ? cam.x - 60 : cam.x + VIEW_W + 60, y, vx: dir * (26 + Math.random() * 14),
            members: Array.from({ length: 3 + (Math.random() * 4 | 0) }, (_, i) => ({ ox: -i * 12 * dir + (Math.random() - 0.5) * 8, oy: (i % 2 ? 7 : -5) + (Math.random() - 0.5) * 4, ph: Math.random() * 6 })),
          });
        }
        // butterflies: only bright, dry days
        if (isDay && clearish && !raining && butterflies.length < MAX.butterflies && Math.random() < 0.006) {
          const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(cam.x / TILE) + (Math.random() * (VIEW_W / TILE) | 0)));
          butterflies.push({ x: tx * TILE, y: world.surface[tx] * TILE - 8 - Math.random() * 24, t: Math.random() * 10, life: 12 + Math.random() * 10, age: 0.1 + Math.random() * 0.5 });
        }
        // a critter scurries by (rare, one at a time)
        if (critters.length < MAX.critters && Math.random() < 0.0008) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          critters.push({ x: dir > 0 ? cam.x - 20 : cam.x + VIEW_W + 20, dir, t: 0, life: 14 });
        }
        // surface fauna: whoever the registry says is out in this time & weather.
        // A Lure Beacon in view calls them out faster + spawns them near it.
        const lureNear = lures.find(lx => lx > b.x0 * TILE - 40 && lx < b.x1 * TILE + 40);
        const spawnP = 0.0016 * (lureNear ? 4 : 1);
        if (fauna.length < MAX.fauna && fauna.filter(f => f.zone === 'surface').length < 3 && Math.random() < spawnP) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const spawnX = dir > 0 ? cam.x - 30 : cam.x + VIEW_W + 30;
          const spawnTx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(spawnX / TILE)));
          const biomeId = biomeAtX(spawnTx, WORLD_W).id;
          const spec = surfaceIsWater(spawnTx) ? null : pickFauna('surface', { isDay, weather, depth: 0, biomeId });   // never on a pond
          if (spec) {
            fauna.push({ kind: spec.id, spec, zone: 'surface', x: spawnX, y: 0, dir, state: 'walk', t: 0, life: 40 + Math.random() * 30, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0 });
          }
        }
        // fireflies drift over the surface on warm nights
        if (night > 0.5 && !raining && fireflies.length < 14 && Math.random() < 0.03) {
          const tx = Math.max(0, Math.min(WORLD_W - 1, Math.floor(cam.x / TILE) + (Math.random() * (VIEW_W / TILE) | 0)));
          fireflies.push({ x: tx * TILE, y: world.surface[tx] * TILE - 6 - Math.random() * 40, t: Math.random() * 7, life: 8 + Math.random() * 8, age: 0.1 + Math.random() * 0.5 });
        }
        // luna moths: ANY light in the dark pulls them out - lamps, the pod, a
        // machine, the rover at night (real: males navigate by the moon and
        // mistake a bright thing for it)
        if (night > 0.3 && emitters.length && moths.length < 6 && Math.random() < 0.02) {
          const em = emitters[(Math.random() * emitters.length) | 0];
          moths.push({ key: em.key, ang: Math.random() * 7, r: 16 + Math.random() * 14, t: Math.random() * 7, life: 20 + Math.random() * 15, x: em.x, y: em.y, disperse: false, dvx: 0, dvy: 0, fade: 0 });
        }
      }

      // pond life: fish spawn in visible near-surface water (zone 'water').
      // A global fauna cap keeps the array bounded whatever the zone mix is.
      if (fauna.length < MAX.fauna && fauna.filter(f => f.zone === 'water').length < 3 && Math.random() < 0.005) {
        for (let tries = 0; tries < 12; tries++) {
          const tx = b.x0 + ((Math.random() * (b.x1 - b.x0)) | 0);
          const ty = b.y0 + ((Math.random() * (b.y1 - b.y0)) | 0);
          if (world.fluidAt?.(tx, ty) !== T_WATER || world.depthOfRow(tx, ty) > 10) continue;
          const biomeId = biomeAtX(tx, WORLD_W).id;
          const spec = pickFauna('water', { isDay, weather, depth: 0, biomeId });
          if (spec) {
            fauna.push({ kind: spec.id, spec, zone: 'water', x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0, life: 40 + Math.random() * 30, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0 });
          }
          break;
        }
      }

      // cave fauna: registry-picked for this depth, near the player. The
      // sunlit shallows (depth 5-30) get a livelier cap - dip under the grass
      // and something is home.
      const caveCount = fauna.filter(f => f.zone === 'cave').length;
      const caveCap = depth < 30 ? 3 : 2;
      if (depth > 5 && fauna.length < MAX.fauna && caveCount < caveCap && Math.random() < 0.004) {
        const biomeId = biomeAtX(player.tx(), WORLD_W).id;
        const spec = pickFauna('cave', { isDay, weather, depth, biomeId });
        // seat it on a nearby air-tile floor/wall
        if (spec) for (let tries = 0; tries < 10; tries++) {
          const tx = player.tx() + ((Math.random() * 16 - 8) | 0);
          const ty = Math.floor(player.cy() / TILE) + ((Math.random() * 10 - 5) | 0);
          if (world.tileAt(tx, ty) === T_AIR && world.solidAt(tx, ty + 1)) {
            fauna.push({ kind: spec.id, spec, zone: 'cave', x: (tx + 0.5) * TILE, y: (ty + 1) * TILE, dir: Math.random() < 0.5 ? 1 : -1, state: 'walk', t: 0, life: 30, ph: Math.random() * 7, age: 0.15 + Math.random() * 0.6, fade: 0 });
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
      for (let i = birds.length - 1; i >= 0; i--) if (birds[i].x < cam.x - 300 || birds[i].x > cam.x + VIEW_W + 300) birds.splice(i, 1);

      for (const bf of butterflies) { bf.t += dt; bf.life -= dt; bf.age = Math.min(1, (bf.age ?? 0.5) + dt / 14); bf.x += Math.sin(bf.t * 2.2) * 18 * dt; bf.y += Math.cos(bf.t * 3.1) * 12 * dt; }
      for (let i = butterflies.length - 1; i >= 0; i--) if (butterflies[i].life <= 0) butterflies.splice(i, 1);

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
              for (let i = 0; i < n; i++) bats.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 40, t: 2.4 + Math.random() });
              sfx.flutter?.();
              break;
            }
          }
        }
      }

      // fauna brains: wander/idle/feed/hunt/fight, flee the rover, sleep at
      // night, bolt in storms, grow up, and eventually fade of old age
      const diurnal = f => !!(f.spec?.activity?.day && !f.spec?.activity?.night);
      for (const f of fauna) {
        f.spec = f.spec || FAUNA_BY_ID[f.kind];   // tolerate registry-less spawns (tests)
        f.t += dt; f.life -= dt;

        // -- lifecycle: age up; the old fade out where they stand ---------------
        f.age = Math.min(1, (f.age ?? 0.5) + dt / (f.spec?.lifespan || 150));
        if (f.age >= 1) { f.fade = (f.fade || 0) + dt; if (f.fade > 2) f.life = 0; }

        // -- hunt: predators stalk their prey (fireflies/butterflies/other fauna)
        if (f.spec?.prey && f.state !== 'flee' && f.state !== 'eat' && f.age > 0.35 && Math.random() < 0.01) {
          let best = null, bd2 = (TILE * 7) ** 2;
          const pool = [];
          if (f.spec.prey.includes('firefly')) for (const ff of fireflies) pool.push({ ref: ff, arr: fireflies, x: ff.x, y: ff.y });
          if (f.spec.prey.includes('butterfly')) for (const bf of butterflies) pool.push({ ref: bf, arr: butterflies, x: bf.x, y: bf.y });
          if (f.spec.prey.includes('prismfly')) for (const o of fauna) if (o.kind === 'prismfly' && o !== f) pool.push({ ref: o, arr: fauna, x: o.x, y: o.y });
          for (const c2 of pool) {
            const d2 = (c2.x - f.x) ** 2 + (c2.y - f.y) ** 2;
            if (d2 < bd2) { bd2 = d2; best = c2; }
          }
          if (best) { f.state = 'hunt'; f.quarry = best; f.t = 0; }
        }
        if (f.state === 'hunt') {
          const q = f.quarry;
          const gone = !q || !q.arr.includes(q.ref);
          if (gone || f.t > 5) { f.state = 'walk'; f.quarry = null; f.t = 0; }
          else {
            f.dir = q.ref.x >= f.x ? 1 : -1;
            if (Math.abs(q.ref.x - f.x) < 7 && Math.abs((q.ref.y ?? f.y) - f.y) < 12) {
              q.arr.splice(q.arr.indexOf(q.ref), 1);           // caught
              f.state = 'eat'; f.t = 0; f.quarry = null;
            }
          }
        }
        if (f.state === 'eat' && f.t > 2) { f.state = 'walk'; f.t = 0; }

        // -- feed: grazers pause to crop the grass (mudskippers nibble the bank)
        if (f.spec?.grazes && f.state === 'walk' && f.zone !== 'cave' && Math.random() < 0.004) { f.state = 'feed'; f.t = 0; }
        if (f.state === 'feed' && f.t > 2.5) { f.state = 'walk'; f.t = 0; }

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

        // weather/time overrides
        if (f.zone === 'surface' && diurnal(f)) {
          if (storm && f.state !== 'flee') { f.state = 'flee'; f.dir = f.x < player.cx() ? -1 : 1; }
          else if (night > 0.6 && f.state !== 'flee') { f.state = 'sleep'; }
          else if (f.state === 'sleep' && night < 0.5) f.state = 'walk';
        }
        const distX = Math.abs(f.x - player.cx());
        const near = distX < TILE * 5 && Math.abs((f.y || player.cy()) - player.cy()) < TILE * 6;
        if (near && f.state !== 'flee') { f.state = 'flee'; f.dir = f.x < player.cx() ? -1 : 1; f.t = 0; }
        const fleeMul = storm ? 1.4 : 1;
        const sp = f.spec?.speed || { walk: 24, flee: 50 };
        const speed = f.state === 'sleep' || f.state === 'feed' || f.state === 'eat' || f.state === 'fight' || f.state === 'mate' ? 0
          : f.state === 'flee' ? sp.flee * fleeMul
          : f.state === 'hunt' ? sp.flee * 0.85
          : f.state === 'walk' ? sp.walk : 0;
        if (f.state === 'flee' && f.t > 2.5) f.state = 'walk';
        if (f.state === 'walk' && f.t > 3 + (f.ph % 3)) { f.state = Math.random() < 0.5 ? 'idle' : 'walk'; f.t = 0; if (Math.random() < 0.3) f.dir *= -1; }
        if (f.state === 'idle' && f.t > 2) { f.state = 'walk'; f.t = 0; }
        // hoppers arc; swimmers stay wet; everyone else slides along their floor
        if (f.zone === 'water') {
          // swim: advance only while the water continues; turn at the banks
          if (speed > 0) {
            const nx = f.x + f.dir * speed * dt;
            const aheadTx = Math.floor((nx + f.dir * 5) / TILE);
            if (world.fluidAt?.(aheadTx, Math.floor(f.y / TILE)) === T_WATER) f.x = nx;
            else f.dir *= -1;
          }
          f.y += Math.sin(f.t * 2.1 + f.ph) * 4 * dt;   // gentle bob
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
      for (let i = fauna.length - 1; i >= 0; i--) if (fauna[i].life <= 0) fauna.splice(i, 1);

      for (const ff of fireflies) {
        ff.t += dt; ff.life -= dt; ff.age = Math.min(1, (ff.age ?? 0.5) + dt / 10);
        ff.x += Math.sin(ff.t * 1.3) * 12 * dt; ff.y += Math.cos(ff.t * 1.7) * 8 * dt;
        // light pollution is real: harsh lamps drown the courtship code -
        // fireflies clear out. Amber (dark-sky) lamps they can live with.
        for (const L of lamps) {
          if (L.amber) continue;
          if ((ff.x - L.x) ** 2 + (ff.y - L.y) ** 2 < (TILE * 6) ** 2) { ff.life = Math.min(ff.life, 0.4); break; }
        }
      }
      for (let i = fireflies.length - 1; i >= 0; i--) if (fireflies[i].life <= 0 || (env && env.night01() < 0.3)) fireflies.splice(i, 1);

      // moths spiral their emitter; when the light is GONE (deconstructed,
      // powered down, the rover drove off) they DISPERSE - fly off and fade,
      // not vanish
      for (const mo of moths) {
        mo.t += dt; mo.life -= dt;
        const em = emitters.find(e => e.key === mo.key);
        if (em && !mo.disperse) {
          mo.ang += dt * (1.4 + Math.sin(mo.t * 2.2) * 0.5);
          mo.r += Math.sin(mo.t * 3.1) * 6 * dt;
          mo.x = em.x + Math.cos(mo.ang) * mo.r;
          mo.y = em.y + Math.sin(mo.ang) * mo.r * 0.6;
        } else {
          if (!mo.disperse) { mo.disperse = true; mo.fade = 0; const a = Math.random() * 7; mo.dvx = Math.cos(a) * 22; mo.dvy = -8 - Math.random() * 12; }
          mo.fade += dt;
          mo.x += mo.dvx * dt; mo.y += mo.dvy * dt;
        }
      }
      for (let i = moths.length - 1; i >= 0; i--) {
        const mo = moths[i];
        if (mo.life <= 0 || (mo.disperse && mo.fade > 2.2) || (env && env.night01() < 0.25)) moths.splice(i, 1);
      }
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
        bt.vy += Math.sin(bt.t * 20) * 40 * dt - 10 * dt;
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
      // luna moths: pale green wings beating around any light (fade when dispersing)
      for (const mo of moths) {
        const mx = mo.x, my = mo.y;
        const open = Math.abs(Math.sin(mo.t * 9));
        const a = mo.disperse ? Math.max(0, 1 - mo.fade / 2.2) : 1;
        ctx.fillStyle = `rgba(190,235,180,${(0.85 * a).toFixed(2)})`;
        ctx.beginPath(); ctx.ellipse(mx - 1.5 - open * 1.6, my, 2.6, 1.6, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx + 1.5 + open * 1.6, my, 2.6, 1.6, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(90,106,80,${a.toFixed(2)})`; ctx.fillRect(mx - 0.8, my - 1.4, 1.6, 3.4);
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
      for (const ff of fireflies) if ((ff.x - wx) ** 2 + (ff.y - wy) ** 2 < r2) out.push({ kind: 'firefly', x: ff.x, y: ff.y });
      for (const bf of butterflies) if ((bf.x - wx) ** 2 + (bf.y - wy) ** 2 < r2) out.push({ kind: 'butterfly', x: bf.x, y: bf.y });
      for (const bt of bats) if ((bt.x - wx) ** 2 + (bt.y - wy) ** 2 < r2) out.push({ kind: 'bat', x: bt.x, y: bt.y });
      for (const mo of moths) {
        if (mo.disperse) continue;   // a dispersing moth isn't a stable scan target
        if ((mo.x - wx) ** 2 + (mo.y - wy) ** 2 < r2) out.push({ kind: 'moth', x: mo.x, y: mo.y, size: [9, 6] });
      }
      for (const g of glowSpots) if ((g.x - wx) ** 2 + (g.y - wy) ** 2 < r2) out.push({ kind: 'glowworm', x: g.x + 10, y: g.y });
      return out;
    },
    /** glowworm patches as light sources for the lighting pass */
    glowLights() { return glowSpots.map(g => ({ x: g.x + 10, y: g.y + 4, r: 34, warmth: 0 })); },
    /** test hooks: inject/inspect the living arrays directly */
    _fauna: fauna,
    _fireflies: fireflies,
    _moths: moths,
  };
}

// fauna art lives in render/fauna.js (FAUNA_ART), keyed by the registry's `draw` field.

// ---- live telemetry (the scanner reads the INDIVIDUAL, not just the species) --

/** human label for a brain state */
export const STATE_LABELS = {
  walk: 'ranging', idle: 'at rest', flee: 'fleeing', sleep: 'sleeping',
  feed: 'grazing', hunt: 'hunting', eat: 'feeding', fight: 'sparring',
};

/** emotional read, derived from state + age - what the visor calls a mood */
export function moodOf(f) {
  if ((f.age ?? 0.5) >= 1) return 'FADING';
  switch (f.state) {
    case 'flee': return 'TERRIFIED';
    case 'hunt': return 'LOCKED ON';
    case 'eat': case 'feed': return 'CONTENT';
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
