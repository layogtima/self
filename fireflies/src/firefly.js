// firefly.js — living fireflies + the swarm system.
//
// A firefly is a dark body in front of its own leaking glow: a thorax, an
// emissive abdomen "lantern", a soft aura, and beating wings.
//
// Two things make them read as REAL fireflies (per playtest):
//  1. They FLASH — mostly dim, then a quick bright bloom that decays, with dark
//     gaps between. Not a continuous sine. Staggered per instance; when a
//     species SYNCS the flashes converge into one shared rhythm.
//  2. When gathered they don't clump into a ball — each takes a slot in an
//     evolving geometric FORMATION (a slowly breathing, rotating constellation)
//     that tightens as the sync deepens. Different species orbit at different
//     radii/heights, so the swarm layers into a living lantern around you.
import * as THREE from 'three';
import { SPECIES, hash11, radialTex, clamp, lerp } from './util.js';

// ---- shared resources ----
const auraTex = radialTex('rgba(255,255,255,0.95)', 0.25, 'rgba(255,255,255,0.5)');

const thoraxGeo = new THREE.CapsuleGeometry(0.03, 0.07, 3, 6);
thoraxGeo.rotateX(Math.PI / 2);
const abdomenGeo = new THREE.SphereGeometry(0.055, 10, 10);
const wingGeo = new THREE.PlaneGeometry(0.12, 0.08);
wingGeo.translate(0.06, 0, 0);

const bodyMat = new THREE.MeshStandardMaterial({ color: '#2a2320', roughness: 0.85 });
const wingMat = new THREE.MeshBasicMaterial({
  color: '#cdd8ee', transparent: true, opacity: 0.09,
  side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
});

// per-species formation: radius, height band, spin dir/speed, lobe count
const FORM = {
  glimmer: { r: 1.5, y: 0.15, rot: 0.35, lobes: 3 },
  wisp: { r: 2.25, y: 0.85, rot: -0.26, lobes: 4 },
  ember: { r: 2.9, y: 0.45, rot: 0.2, lobes: 5 },
};
const SYNC_PERIOD = 2.6; // seconds — the shared flash cadence once synced

function buildRig(species) {
  const sp = SPECIES[species];
  const glow = new THREE.Color(sp.glow);
  const group = new THREE.Group();

  const thorax = new THREE.Mesh(thoraxGeo, bodyMat);
  group.add(thorax);

  const abdomenMat = new THREE.MeshStandardMaterial({ color: '#120f0d', emissive: glow, emissiveIntensity: 1, roughness: 0.5 });
  const abdomen = new THREE.Mesh(abdomenGeo, abdomenMat);
  abdomen.position.z = -0.06;
  group.add(abdomen);

  const auraMat = new THREE.SpriteMaterial({ map: auraTex, color: glow, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.4, depthWrite: false });
  const aura = new THREE.Sprite(auraMat);
  aura.scale.setScalar(0.8); aura.position.z = -0.06;
  group.add(aura);

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.01, 0.02, 0.01);
  wingR.position.set(0.01, 0.02, 0.01);
  group.add(wingL, wingR);

  return { group, abdomenMat, auraMat, aura, wingL, wingR };
}

// scratch
const _t = new THREE.Vector3();
const _d = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _f = new THREE.Vector3();
const _centroid = new THREE.Vector3();

export function makeFireflies(scene) {
  const list = [];

  // pool of real lights. A couple ride the swarm centroid (steady navigation
  // light); the rest ride the brightest individuals (flashing sparkle).
  const POOL = 7;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const l = new THREE.PointLight('#ffffff', 0, 13, 1.6);
    scene.add(l); pool.push(l);
  }

  const sync = {};
  for (const k in SPECIES) sync[k] = { count: 0, synced: false, blend: 0, flash: 0, justSynced: false };

  let uid = 0;

  function spawn(species, x, y, z, captured = false) {
    const rig = buildRig(species);
    rig.group.position.set(x, y, z);
    scene.add(rig.group);
    const seed = uid++;
    list.push({
      species, ...rig, seed,
      flashPeriod: 2.2 + hash11(seed * 1.7) * 1.8,   // 2.2–4.0 s
      flashOffset: hash11(seed * 3.3),                // 0–1 stagger
      dx: hash11(seed * 5.1) * 6.28, dy: hash11(seed * 7.9) * 6.28, dz: hash11(seed * 9.2) * 6.28,
      wingPh: hash11(seed * 4.4) * 6.28,
      fj: 0.9 + hash11(seed * 11.3) * 0.2,
      anchor: new THREE.Vector3(x, y, z),
      driftAmp: 0.4 + hash11(seed * 2.2) * 0.6,
      state: captured ? 'captured' : 'wild',
      vel: new THREE.Vector3(),
      consumeTarget: null,
      flash: 0, slot: 0, slotN: 1,
    });
  }

  function countCaptured(species) {
    let n = 0;
    for (const ff of list) if (ff.species === species && ff.state === 'captured') n++;
    return n;
  }

  // captured fireflies of a species whose orbit centre (the player) is near pt
  function capturedNear(species, pt, r) {
    let n = 0; const r2 = r * r;
    for (const ff of list) {
      if (ff.species !== species || ff.state !== 'captured') continue;
      if (ff.group.position.distanceToSquared(pt) < r2) n++;
    }
    return n;
  }

  // a node drinks n captured fireflies of a species — they stream into `point`
  function consume(species, n, point) {
    let taken = 0;
    for (const ff of list) {
      if (taken >= n) break;
      if (ff.species === species && ff.state === 'captured') {
        ff.state = 'consumed'; ff.consumeTarget = point.clone(); taken++;
      }
    }
    return taken;
  }

  function clear() {
    for (const ff of list) if (ff.group.parent) ff.group.parent.remove(ff.group);
    list.length = 0;
    for (const l of pool) l.intensity = 0;
    for (const k in sync) { sync[k].count = 0; sync[k].synced = false; sync[k].blend = 0; }
  }

  // ctx: { playerPos, beam:{origin,dir,cosHalf,range,on} }
  function update(t, dt, ctx) {
    const { playerPos, beam } = ctx;

    // assign formation slots per species (stable-ish ordering by seed)
    const perSpecies = { glimmer: [], wisp: [], ember: [] };
    for (const ff of list) if (ff.state === 'captured') perSpecies[ff.species].push(ff);
    for (const k in perSpecies) {
      const arr = perSpecies[k];
      sync[k].count = arr.length;
      for (let i = 0; i < arr.length; i++) { arr[i].slot = i; arr[i].slotN = arr.length; }
    }

    for (const ff of list) {
      const s = sync[ff.species];

      // ---------- gather: beam cone OR very-close proximity ----------
      if (ff.state === 'wild') {
        let lure = false;
        if (beam.on) {
          _v.copy(ff.group.position).sub(beam.origin);
          const dist = _v.length();
          if (dist < beam.range && dist > 1e-3) { _v.divideScalar(dist); if (_v.dot(beam.dir) > beam.cosHalf) lure = true; }
        }
        const near = ff.group.position.distanceTo(playerPos);
        if (near < 1.7) ff.state = 'captured';
        else if (lure) ff.state = 'lured';
      } else if (ff.state === 'lured') {
        if (ff.group.position.distanceTo(playerPos) < 1.6) ff.state = 'captured';
      }

      // ---------- target position by state ----------
      if (ff.state === 'wild') {
        _d.set(Math.sin(t * 1.3 * ff.fj + ff.dx), Math.cos(t * 1.7 * ff.fj + ff.dy) * 0.6, Math.sin(t * 0.9 * ff.fj + ff.dz)).multiplyScalar(ff.driftAmp);
        _t.copy(ff.anchor).add(_d);
        spring(ff, _t, 2.0, dt);
      } else if (ff.state === 'lured') {
        _t.copy(playerPos); _t.y += 0.4;
        spring(ff, _t, 5.0, dt);
      } else if (ff.state === 'captured') {
        formation(ff, s, t, playerPos, _t);
        spring(ff, _t, 3.5 + 3 * s.blend, dt);
      } else if (ff.state === 'consumed') {
        _t.copy(ff.consumeTarget);
        spring(ff, _t, 7, dt);
        if (ff.group.position.distanceTo(_t) < 0.35) { if (ff.group.parent) ff.group.parent.remove(ff.group); ff._dead = true; }
      }

      // ---------- face travel direction ----------
      if (ff.vel.lengthSq() > 0.0004) {
        _f.copy(ff.vel).normalize();
        ff.group.rotation.y = lerp(ff.group.rotation.y, Math.atan2(_f.x, _f.z), 0.15);
        ff.group.rotation.x = lerp(ff.group.rotation.x, -Math.asin(clamp(_f.y, -1, 1)), 0.15);
      }

      // ---------- FLASH: dim base, periodic bright decaying spike ----------
      const period = lerp(ff.flashPeriod, SYNC_PERIOD, s.blend);
      const off = lerp(ff.flashOffset, 0, s.blend);
      const ph = (t / period + off) % 1;
      const flash = Math.exp(-ph * 6.5); // instant "blink on", exponential fade — a firefly flash
      ff.flash = flash;
      const level = 0.16 + flash * 1.1;
      ff.abdomenMat.emissiveIntensity = 0.5 + level * 2.4;
      ff.auraMat.opacity = 0.1 + flash * 0.55;
      ff.aura.scale.setScalar(0.55 + flash * 0.7);

      // ---------- wing beat ----------
      const beat = Math.abs(Math.sin(t * 17 * ff.fj + ff.wingPh));
      ff.wingL.rotation.z = 0.5 + beat * 0.9;
      ff.wingR.rotation.z = Math.PI - 0.5 - beat * 0.9;
    }

    // reap consumed
    for (let i = list.length - 1; i >= 0; i--) if (list[i]._dead) list.splice(i, 1);

    // ---------- resolve sync ----------
    for (const k in sync) {
      const st = sync[k];
      const was = st.synced;
      st.synced = st.count >= SPECIES[k].syncAt;
      st.blend = lerp(st.blend, st.synced ? 1 : 0, 1 - Math.pow(0.0015, dt));
      st.justSynced = st.synced && !was;
    }

    assignPool(playerPos);
  }

  // evolving constellation slot for a captured firefly
  function formation(ff, s, t, center, out) {
    const cfg = FORM[ff.species];
    const a = (ff.slot / Math.max(1, ff.slotN)) * Math.PI * 2 + t * cfg.rot;
    const rr = cfg.r * (1 + 0.16 * Math.sin(cfg.lobes * a + t * 0.6)); // breathing rose
    // structured position
    _c.set(center.x + Math.cos(a) * rr, center.y + cfg.y + Math.sin(a * 2 + t * 0.8) * 0.3, center.z + Math.sin(a) * rr);
    // loose wander added when NOT yet synced (so a small swarm looks alive, not rigid)
    const loose = (1 - s.blend) * 0.9;
    _d.set(Math.sin(t * 1.4 + ff.dx), Math.cos(t * 1.1 + ff.dy) * 0.7, Math.sin(t * 1.7 + ff.dz)).multiplyScalar(loose);
    out.copy(_c).add(_d);
  }

  // steady centroid light + per-firefly sparkle lights
  function assignPool(playerPos) {
    // centroid + dominant colour of the captured swarm
    _centroid.set(0, 0, 0);
    let n = 0, best = null, bestC = 0;
    for (const k in sync) if (sync[k].count > bestC) { bestC = sync[k].count; best = k; }
    for (const ff of list) if (ff.state === 'captured') { _centroid.add(ff.group.position); n++; }

    let li = 0;
    if (n > 0) {
      _centroid.divideScalar(n);
      const l = pool[li++];
      l.position.copy(_centroid); l.position.y += 0.3;
      l.color.set(SPECIES[best].glow);
      l.intensity = Math.min(15, 5 + n * 0.9); // steady swarm glow — lights the room
      l.distance = 24;
    }

    // remaining lights: brightest fireflies (captured preferred, then wild-near)
    const cand = [];
    for (const ff of list) {
      if (ff.state === 'consumed') continue;
      const d2 = ff.group.position.distanceToSquared(playerPos);
      const pref = ff.state === 'captured' ? 0.2 : 1.0;
      cand.push({ ff, score: (0.4 + ff.flash) / (pref + d2 * 0.04) });
    }
    cand.sort((a, b) => b.score - a.score);
    for (let i = 0; li < pool.length; i++, li++) {
      const l = pool[li];
      if (i < cand.length) {
        const ff = cand[i].ff;
        l.position.copy(ff.group.position);
        l.color.set(SPECIES[ff.species].glow);
        l.intensity = 3.2 + ff.flash * 2.4;  // steady floor + flash sparkle
        l.distance = 15;
      } else l.intensity = 0;
    }
  }

  return { spawn, countCaptured, capturedNear, consume, clear, update, sync, list, pool };
}

function spring(ff, target, stiffness, dt) {
  _v.copy(target).sub(ff.group.position);
  ff.vel.addScaledVector(_v, stiffness * dt);
  ff.vel.multiplyScalar(Math.pow(0.015, dt));
  ff.group.position.addScaledVector(ff.vel, dt);
}
