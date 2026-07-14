// The colony as a superorganism. Ants are point agents that hug tunnel walls
// (thigmotaxis), read the pheromone field, and run local rules — forage, excavate,
// nurse, undertake — with task by age polyethism. Emergence does the rest.

import { COLS, ROWS, SURFACE } from './config.js';

let NEXT_ID = 1;
const LIFESPAN = 240;         // seconds (compressed)
const MAJOR_FRAC = 0.16;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

export function makeColony(nest, pher) {
  const ants = [];
  const brood = [];        // {stage:'egg'|'larva'|'pupa', x,y,t,fed,major}
  const corpses = [];      // {x,y,t}
  const ent = nest.entrance, cham = nest.chamber;

  // chambers the colony wants hollowed out: diggers tunnel to each and excavate a
  // round room; new ones spawn deeper as the colony grows (galleries form between).
  const digSites = [
    { x: cham.x, y: cham.y, r: 6, done: true },
    { x: cham.x - 10, y: cham.y + 7, r: 5, done: false },
    { x: cham.x + 9, y: cham.y + 9, r: 5, done: false },
  ];
  let popMark = 13;
  function addDigSite() {
    let deepest = cham.y; for (const s of digSites) deepest = Math.max(deepest, s.y);
    const nx = clamp((cham.x + (Math.random() - 0.5) * 36) | 0, 10, COLS - 10);
    const ny = Math.min(ROWS - 8, (deepest + 7 + Math.random() * 8) | 0);
    digSites.push({ x: nx, y: ny, r: 4 + (Math.random() * 4 | 0), done: false });
  }
  function roomSoil(site) {   // nearest soil-with-air-neighbour inside the room disc (center-out = round)
    for (let ring = 1; ring <= site.r; ring++) for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring || dx * dx + dy * dy > site.r * site.r) continue;
      const x = site.x + dx, y = site.y + dy;
      if (nest.isSoil(x, y) && (!nest.solid(x - 1, y) || !nest.solid(x + 1, y) || !nest.solid(x, y - 1) || !nest.solid(x, y + 1))) return { x, y };
    }
    return null;
  }

  function spawnAnt(x, y, caste, age) {
    const a = {
      id: NEXT_ID++, caste, x, y, hx: Math.random() - 0.5, hy: Math.random() - 0.5,
      age: age ?? 0, task: 'nurse', state: 'wander', crop: 0.6, carrying: null, ref: null,
      speed: caste === 'major' ? 6.5 : caste === 'queen' ? 2 : 9.5, t: 0,
      vy: 0, climbing: false,   // gravity + wall/stalk climbing (+y is down)
    };
    const l = Math.hypot(a.hx, a.hy) || 1; a.hx /= l; a.hy /= l;
    ants.push(a); return a;
  }

  // founding: a queen, her first nanitic workers, some brood, seeds in the outworld
  const queen = spawnAnt(cham.x, cham.y, 'queen', 0.4); queen.task = 'queen';
  for (let i = 0; i < 10; i++) spawnAnt(cham.x + (Math.random() - 0.5) * 6, cham.y + (Math.random() - 0.5) * 4, Math.random() < 0.12 ? 'major' : 'minor', 0.2 + Math.random() * 0.5);
  for (let i = 0; i < 8; i++) brood.push({ stage: ['egg', 'larva', 'pupa'][i % 3], x: cham.x + (Math.random() - 0.5) * 6, y: cham.y + (Math.random() - 0.5) * 3, t: Math.random(), fed: 0.5, major: Math.random() < MAJOR_FRAC });
  seedRain(6);

  // seeds fall in PATCHES (a scatter of a plant's seed), so foragers converge and
  // a recruitment trail self-organizes to the pile
  function seedRain(n) {   // seeds shed from a plant, resting ON the lawn at its base
    const pl = nest.plants.length ? nest.plants[(Math.random() * nest.plants.length) | 0] : { x: COLS / 2 };
    for (let i = 0; i < n; i++) nest.addSeed(pl.x + (Math.random() - 0.5) * 5, SURFACE - 1);
  }

  // ---- gravity-aware movement (+y = down): CLIMB walls/stalks → WALK floors → FALL --
  const R = Math.round, cc = c => c < 0 ? 0 : c >= COLS ? COLS - 1 : c;
  const solidC = (x, y) => nest.solid(R(x), R(y));
  const stalkAt = (x, y) => { const t = nest.stalkTop[cc(R(x))]; return t >= 0 && y >= t - 0.5 && y <= SURFACE - 0.5; };
  const grounded = (x, y) => solidC(x, y + 1) && !solidC(x, y);           // solid below, self in air
  const climbFace = (x, y) => stalkAt(x, y) || solidC(x - 1, y) || solidC(x + 1, y);
  const GRAV = 42, TERM = 16, CLIMB_SPD = 0.62;
  const stalkCols = []; for (let c = 0; c < COLS; c++) if (nest.stalkTop[c] >= 0) stalkCols.push(c);

  // in the NEST (soil behind glass) ants crawl freely in 2D — the glass is their
  // floor; this is the original free-steer + wall-hug, which reads correctly
  function moveFree(a, tdx, tdy, dt, urgency = 1) {
    const dl = Math.hypot(tdx, tdy);
    let da = dl > 1e-4 ? Math.atan2(tdy, tdx) : Math.atan2(a.hy, a.hx);
    let ha = Math.atan2(a.hy, a.hx);
    const diff = Math.atan2(Math.sin(da - ha), Math.cos(da - ha));
    ha += diff * (0.18 * urgency) + (Math.random() - 0.5) * 0.5;
    const spd = a.speed;
    for (let k = 0; k < 8; k++) {
      const ang = ha + (k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.42 : 0);
      const nx = a.x + Math.cos(ang) * spd * dt, ny = a.y + Math.sin(ang) * spd * dt;
      if (!nest.solid(Math.round(nx), Math.round(ny))) { a.x = nx; a.y = ny; a.hx = Math.cos(ang); a.hy = Math.sin(ang); a.climbing = false; return true; }
    }
    ha += Math.PI * (0.5 + Math.random()); a.hx = Math.cos(ha); a.hy = Math.sin(ha); return false;
  }
  // dispatch: real gravity in the open-air garden, free-crawl in the glass nest
  function move(a, tdx, tdy, dt, urgency = 1) {
    return a.y < SURFACE - 0.5 ? moveGarden(a, tdx, tdy, dt, urgency) : moveFree(a, tdx, tdy, dt, urgency);
  }
  function moveGarden(a, tdx, tdy, dt, urgency = 1) {
    const spd = a.speed;
    let dir = tdx > 0.05 ? 1 : tdx < -0.05 ? -1 : (a.hx >= 0 ? 1 : -1);
    if (Math.random() < 0.06 / urgency) dir = -dir;                       // low-rate wander flip
    const wantUp = tdy < -0.25, wantDown = tdy > 0.25;
    const g = grounded(a.x, a.y), face = climbFace(a.x, a.y);

    // CLIMB — clinging to a wall/stalk with genuine vertical intent
    if (face && (a.climbing || wantUp || (wantDown && !g))) {
      a.vy = 0;
      let ny = a.y + (wantDown ? 1 : -1) * spd * CLIMB_SPD * dt;
      const top = nest.stalkTop[cc(R(a.x))];
      if (top >= 0) ny = Math.max(top, Math.min(SURFACE - 1, ny));        // don't climb off the stalk
      if (!solidC(a.x, ny) && (climbFace(a.x, ny) || grounded(a.x, ny))) {
        a.y = ny; a.hx = 0; a.hy = wantDown ? 1 : -1; a.climbing = !grounded(a.x, ny); return true;
      }
      a.climbing = false;                                                 // reached an end → fall through to WALK/FALL
    }

    // WALK — grounded floor-follow, ±1-cell step, ledges become falls
    if (g) {
      a.vy = 0; a.climbing = false;
      const nx = a.x + dir * spd * dt;
      if (solidC(nx, a.y)) { if (!solidC(nx, a.y - 1) && !solidC(a.x, a.y - 1)) { a.x = nx; a.y -= 1; } else dir = -dir; }  // step up 1, else turn
      else if (solidC(nx, a.y + 1)) a.x = nx;                             // flat ground
      else if (solidC(nx, a.y + 2)) { a.x = nx; a.y += 1; }               // step down 1
      else a.x = nx;                                                      // off a ledge → falls next tick
      a.hx = dir; a.hy = 0; return true;
    }

    // FALL — gravity, capped step so it can't tunnel a wall
    a.vy = Math.min(TERM, a.vy + GRAV * dt);
    const nx = a.x + dir * spd * 0.3 * dt;
    let ny = a.y + Math.min(0.9, a.vy * dt);
    if (solidC(a.x, ny)) { ny = Math.floor(ny) - 0.001; a.vy = 0; }       // land atop the cell
    if (!solidC(nx, a.y)) a.x = nx;
    a.y = ny; a.hx = dir * 0.3; a.hy = 1;
    const l = Math.hypot(a.hx, a.hy) || 1; a.hx /= l; a.hy /= l;
    return true;
  }
  function scramble(a, dt) {   // rare anti-stuck pop (the old free air-probe, one step)
    for (let k = 0; k < 8; k++) { const ang = Math.random() * Math.PI * 2, nx = a.x + Math.cos(ang) * a.speed * dt, ny = a.y + Math.sin(ang) * a.speed * dt; if (!solidC(nx, ny)) { a.x = nx; a.y = ny; return; } }
  }
  const dirTo = (a, tx, ty) => [tx - a.x, ty - a.y];

  // ---- per-ant task logic --------------------------------------------------------
  function assignTask(a) {
    if (a.caste === 'queen') { a.task = 'queen'; return; }
    if (corpses.length && (a.id % 5 === 0) && a.age > 0.3) { a.task = 'undertake'; return; }
    // age polyethism, nudged by colony need — but keep a real dig cohort so
    // chambers actually get excavated (only starvation pulls diggers to forage)
    const needDig = digSites.some(s => !s.done);
    if (a.age < 0.18) a.task = 'nurse';
    else if (a.age < 0.55) a.task = (nest.stores < 1.5 ? 'forage' : (needDig && Math.random() < 0.5 ? 'dig' : 'forage'));   // split diggers vs foragers so both progress
    else a.task = 'forage';
    if (a.caste === 'major') a.task = a.age < 0.45 ? 'nurse' : (Math.random() < 0.4 ? 'dig' : 'forage');
  }

  function update(dt) {
    // --- pheromone-driven arousal (alarm makes any ant bolt) ---
    for (const a of ants) {
      a.t += dt;
      if (a.caste !== 'queen') a.crop = clamp(a.crop - dt * 0.02, 0, 1);
      if (a.caste !== 'queen') {   // the queen outlives workers by ~20× — she doesn't age out
        a.age += dt / LIFESPAN;
        if (a.age >= 1) { a.dead = true; corpses.push({ x: a.x, y: a.y, t: 0 }); continue; }
      }
      if (Math.random() < dt * 0.25) assignTask(a);

      a.stuckT = (a.stuckT || 0) + dt;   // anti-stuck watchdog: pop free of rare 1-cell pockets
      if (a.stuckT > 1) { a.stuck = dist2(a.x, a.y, a.px ?? a.x, a.py ?? a.y) < 0.3; a.px = a.x; a.py = a.y; a.stuckT = 0; }
      if (a.stuck && a.caste !== 'queen') scramble(a, dt);

      const alarm = pher.sample('ALARM', a.x, a.y);
      if (alarm > 0.35) {                       // flee down-alarm-gradient, fast
        const [gx, gy] = pher.grad('ALARM', a.x, a.y);
        move(a, -gx, -gy + 0.2, dt, 1.6);
        pher.deposit('ALARM', a.x, a.y, dt * 1.2);   // arousal spreads
        continue;
      }
      const necro = pher.sample('NECRO', a.x, a.y);
      if (necro > 0.5 && a.carrying === null && a.age > 0.3 && Math.random() < dt) a.task = 'undertake';

      switch (a.task) {
        case 'queen': tickQueen(a, dt); break;
        case 'forage': tickForage(a, dt); break;
        case 'dig': tickDig(a, dt); break;
        case 'nurse': tickNurse(a, dt); break;
        case 'undertake': tickUndertake(a, dt); break;
        default: move(a, (Math.random() - 0.5), (Math.random() - 0.5), dt);
      }
    }
    for (let i = ants.length - 1; i >= 0; i--) if (ants[i].dead) ants.splice(i, 1);

    tickBrood(dt);
    pher.deposit('QUEEN', queen.x, queen.y, dt * 2);
    for (const c of corpses) { c.t += dt; pher.deposit('NECRO', c.x, c.y, dt * 1.5); }
    for (const b of brood) if (b.stage === 'larva') pher.deposit('BROOD', b.x, b.y, dt * (1 - b.fed) * 1.2);
    if (Math.random() < dt * 0.14 && nest.seeds.filter(s => !s.taken && !s.stored).length < 22) seedRain(3 + (Math.random() * 4 | 0));   // steady garden seed-fall
    if (stalkCols.length && Math.random() < dt * 0.6) {   // a seed ripens at a stalk head (foragers climb to harvest)
      const c = stalkCols[(Math.random() * stalkCols.length) | 0], t = nest.stalkTop[c];
      if (!nest.seeds.some(s => !s.taken && Math.abs(s.x - c) < 1.5 && s.y < SURFACE)) nest.addSeed(c, t + 0.5);
    }
    if (ants.length >= popMark) { popMark += 10; if (digSites.filter(s => !s.done).length < 2) addDigSite(); }   // grow into new rooms, but keep the dig backlog small
  }

  function tickQueen(a, dt) {
    move(a, cham.x - a.x, 0, dt, 0.4);   // mill horizontally on the chamber floor
    a.eggT = (a.eggT || 0) + dt;
    const cap = 240;   // generous — space + food regulate growth, not a hard tie to stores (which caused boom-bust)
    if (a.eggT > 2.6 && nest.stores > 1.5 && ants.length + brood.length < cap) {
      a.eggT = 0; nest.stores -= 0.35;
      brood.push({ stage: 'egg', x: a.x + (Math.random() - 0.5) * 5, y: a.y + (Math.random() - 0.5) * 3, t: 0, fed: 0, major: Math.random() < MAJOR_FRAC });
    }
  }

  function tickForage(a, dt) {
    if (a.carrying === 'seed') {                          // RETURN home, laying TRAIL
      pher.deposit('TRAIL', a.x, a.y, dt * 2.2);
      const tgt = a.y < nest.surface + 2 ? [ent.x, ent.y + 3] : [cham.x, cham.y];   // dive into the shaft, then granary
      move(a, ...dirTo(a, tgt[0], tgt[1]), dt, 1.2);
      if (dist2(a.x, a.y, cham.x, cham.y) < 20) { a.carrying = null; a.ref = null; nest.stores += 2; nest.seeds.push({ x: cham.x + (Math.random() - 0.5) * 8, y: cham.y + 2 + Math.random() * 3, taken: false, stored: true }); }
      return;
    }
    // searching
    if (a.y > nest.surface) {                              // still in the nest → head out
      move(a, ...dirTo(a, ent.x, ent.y - 3), dt, 1.1);
      return;
    }
    const seed = nest.nearestSeed(a.x, a.y, 9);            // grab a seed if close
    if (seed && !seed.stored) {
      if (dist2(a.x, a.y, seed.x, seed.y) < 2.2) { seed.taken = true; a.carrying = 'seed'; a.ref = seed; return; }
      move(a, ...dirTo(a, seed.x, seed.y), dt, 1.3); return;
    }
    const [gx] = pher.grad('TRAIL', a.x, a.y);             // follow the trail HORIZONTALLY, else patrol the lawn
    if (Math.abs(gx) > 0.02) move(a, gx * 30, 0, dt, 0.9);
    else move(a, (Math.random() - 0.5), 0, dt, 0.5);       // tdy = 0 keeps them grounded (no sky-drift)
  }

  function tickDig(a, dt) {
    if (a.carrying === 'pellet') {                        // relay spoil toward the surface; deep loads get backfilled
      a.haulT = (a.haulT || 0) + dt;
      move(a, ...dirTo(a, ent.x, nest.surface - 1), dt, 1.1);
      if (a.y <= nest.surface) { nest.dropPellet(a.x); a.carrying = null; a.haulT = 0; }
      else if (a.haulT > 1.1) { a.carrying = null; a.haulT = 0; }   // drop in a dead-end (real ants relay + backfill)
      return;
    }
    if (!a.site || a.site.done) a.site = digSites.find(s => !s.done) || null;
    const site = a.site;
    if (!site) { if (Math.random() < dt) a.task = 'forage'; move(a, cham.x - a.x, 0.5, dt, 0.4); return; }
    if (dist2(a.x, a.y, site.x, site.y) < (site.r + 1.5) ** 2) {   // in the room → hollow it out (round)
      const t = roomSoil(site);
      if (!t) { site.done = true; a.site = null; return; }
      if (dist2(a.x, a.y, t.x, t.y) < 2.2) { if (nest.dig(t.x, t.y)) a.carrying = 'pellet'; }
      else move(a, ...dirTo(a, t.x, t.y), dt, 0.9);
    } else {                                              // travel to the site, tunnelling the cell TOWARD it (incl. below → shafts go straight down)
      const dx = site.x - a.x, dy = site.y - a.y;
      const cxs = R(a.x + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : 0));
      const cys = R(a.y + (Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0));
      if (cys > nest.surface && nest.isSoil(cxs, cys) && nest.dig(cxs, cys)) a.carrying = 'pellet';
      move(a, dx, dy, dt, 1.0);
    }
  }

  function tickNurse(a, dt) {
    if (a.carrying === 'brood') {                         // carry brood toward the warm sweet spot
      const b = a.ref; if (!b || b.moved) { a.carrying = null; a.ref = null; return; }
      b.x = a.x; b.y = a.y;
      const warm = SURFACE + ROWS * 0.28;
      move(a, (cham.x - a.x), (warm - a.y), dt, 1.0);
      if (Math.abs(a.y - warm) < 3 && dist2(a.x, a.y, cham.x, cham.y) < 90) { a.carrying = null; a.ref = null; b.moved = false; }
      return;
    }
    // find a larva to feed, or a stray brood to fetch
    let best = null, bd = 64;
    for (const b of brood) { const d = dist2(a.x, a.y, b.x, b.y); if (d < bd) { bd = d; best = b; } }
    if (best) {
      if (bd < 3) {
        if (best.stage === 'larva' && nest.stores > 0.5) { best.fed = clamp(best.fed + dt * 0.4, 0, 1); if (Math.random() < dt * 0.3) nest.stores -= 0.05; }
        const warm = SURFACE + ROWS * 0.28;
        if (Math.abs(best.y - warm) > 5 && a.carrying === null && Math.random() < dt) { a.carrying = 'brood'; a.ref = best; best.moved = true; }
        else move(a, (Math.random() - 0.5), (Math.random() - 0.5), dt, 0.3);
      } else move(a, ...dirTo(a, best.x, best.y), dt, 0.9);
    } else move(a, (cham.x - a.x), (cham.y - a.y), dt, 0.5);
  }

  function tickUndertake(a, dt) {
    if (a.carrying === 'corpse') {
      move(a, ...dirTo(a, ent.x, nest.surface - 1), dt, 1.1);
      if (a.y <= nest.surface) { a.carrying = null; a.ref = null; nest.dropPellet(a.x); }
      return;
    }
    let best = null, bd = 1e9, bi = -1;
    for (let i = 0; i < corpses.length; i++) { const c = corpses[i], d = dist2(a.x, a.y, c.x, c.y); if (d < bd) { bd = d; best = c; bi = i; } }
    if (!best) { a.task = 'forage'; return; }
    if (bd < 3) { corpses.splice(bi, 1); a.carrying = 'corpse'; }
    else move(a, ...dirTo(a, best.x, best.y), dt, 1.0);
  }

  function tickBrood(dt) {
    for (let i = brood.length - 1; i >= 0; i--) {
      const b = brood[i];
      if (!b.moved && !nest.solid(R(b.x), R(b.y) + 1) && b.y < ROWS - 2) b.y = Math.min(ROWS - 2, b.y + 10 * dt);   // settle onto a floor (nursery reads as a cross-section)
      const warmth = 0.4 + nest.tempAt(b.x | 0, b.y | 0) * 0.6;
      const rate = (b.stage === 'larva' ? (0.3 + b.fed * 0.7) : 1) * warmth;
      b.t += dt / 18 * rate;
      if (b.t >= 1) {
        b.t = 0;
        if (b.stage === 'egg') b.stage = 'larva';
        else if (b.stage === 'larva') { if (b.fed > 0.4) b.stage = 'pupa'; else b.t = 0.6; }
        else { spawnAnt(b.x, b.y, b.major ? 'major' : 'minor', 0).crop = 0.3; brood.splice(i, 1); }   // eclosion
      }
    }
  }

  return {
    ants, brood, corpses, queen, update, digSites,
    stats() {
      const tasks = { forage: 0, dig: 0, nurse: 0, undertake: 0, queen: 0, idle: 0 };
      for (const a of ants) tasks[a.task] = (tasks[a.task] || 0) + 1;
      const broodStages = { egg: 0, larva: 0, pupa: 0 }; for (const b of brood) broodStages[b.stage]++;
      return { pop: ants.length, brood: brood.length, stores: Math.round(nest.stores), majors: ants.filter(a => a.caste === 'major').length, corpses: corpses.length, tasks, broodStages, chambers: digSites.filter(s => s.done).length, digging: digSites.filter(s => !s.done).length };
    },
    intent(a) {   // plain-language "what it's doing" for the analysis card
      if (!a) return '';
      if (a.caste === 'queen') return 'laying eggs in the royal chamber';
      switch (a.task) {
        case 'forage': return a.carrying === 'seed' ? 'hauling a seed to the granary' : (a.y > nest.surface ? 'climbing out to forage' : 'scenting for seeds in the garden');
        case 'dig': return a.carrying === 'pellet' ? 'carrying spoil up to the rim' : 'excavating a chamber';
        case 'nurse': return a.carrying === 'brood' ? 'shifting brood to the warm zone' : 'grooming and feeding the brood';
        case 'undertake': return a.carrying === 'corpse' ? 'bearing the dead to the midden' : 'answering a death cue';
        default: return 'milling in the galleries';
      }
    },
    predict(a) {   // a light "what next" read
      if (!a || a.caste === 'queen') return '';
      if (a.crop < 0.2) return 'hungry — will seek trophallaxis';
      if (a.age > 0.9) return 'nearing end of life';
      if (a.task === 'forage' && a.carrying) return 'will recruit others with a trail';
      if (a.task === 'dig' && a.carrying) return 'will return to widen the room';
      return 'continuing its task';
    },
    antAt(wx, wy, r = 1.6) {   // pick for the inspector
      let best = null, bd = r * r;
      for (const a of ants) { const d = dist2(a.x, a.y, wx, wy); if (d < bd) { bd = d; best = a; } }
      return best;
    },
  };
}
