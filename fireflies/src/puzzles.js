// puzzles.js — interactive mechanisms. Each returns an object with a mesh, an
// update(t, dt), and its own activation logic. Sockets accept a specific
// firefly species; solving one fires onSolve -> opens a gate / reveals a
// light-bridge / burns a gloom barrier.
import * as THREE from 'three';
import { SPECIES, radialTex, clamp } from './util.js';

const glowTex = radialTex('rgba(255,255,255,0.9)', 0.3, 'rgba(255,255,255,0.4)');

// ---- NODE (socket): a floating colour-coded shard. Bring `need` synced
// fireflies of its species close and it drinks them — no keypress, pure
// proximity. It glows in its species colour to wordlessly say "this colour". ----
export function makeSocket(scene, { species, need, x, y = 0, z }) {
  const sp = SPECIES[species];
  const col = new THREE.Color(sp.glow);
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  scene.add(grp);

  const HOVER = 1.35;
  const shardMat = new THREE.MeshStandardMaterial({ color: '#0a0b10', emissive: col, emissiveIntensity: 0.5, roughness: 0.25, metalness: 0.1, flatShading: true });
  const shard = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), shardMat);
  shard.position.y = HOVER;
  grp.add(shard);

  // a ring of `need` marker pips that light up as the node fills
  const pips = [];
  for (let i = 0; i < need; i++) {
    const a = (i / need) * Math.PI * 2;
    const pipMat = new THREE.MeshStandardMaterial({ color: '#0a0b10', emissive: col, emissiveIntensity: 0.15, roughness: 0.4 });
    const pip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pipMat);
    pip.position.set(Math.cos(a) * 0.55, HOVER, Math.sin(a) * 0.55);
    grp.add(pip); pips.push(pipMat);
  }

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.25, depthWrite: false }));
  halo.scale.setScalar(1.7); halo.position.y = HOVER;
  grp.add(halo);

  const light = new THREE.PointLight(col, 0.6, 6, 1.7); light.position.set(x, y + HOVER, z); scene.add(light);
  const drinkPoint = new THREE.Vector3(x, y + HOVER, z);
  const ACT_R = 4.2; // how close the swarm must be (covers the widest formation)

  const api = {
    kind: 'socket', species, need, pos: grp.position, solved: false, charge: 0, _cbs: [],
    onSolve(cb) { this._cbs.push(cb); return this; },
    forceSolve(ctx) { // dev only
      if (this.solved) return;
      this.solved = true; this.charge = 1;
      if (ctx && ctx.fireflies) ctx.fireflies.consume(species, need, drinkPoint);
      this._cbs.forEach((cb) => cb());
    },
    update(t, dt, ctx) {
      const fireflies = ctx && ctx.fireflies, playerPos = ctx && ctx.playerPos, audio = ctx && ctx.audio;
      shard.rotation.y += dt * 0.6; shard.rotation.x += dt * 0.25;
      const pulse = 0.5 + Math.abs(Math.sin(t * 2.2)) * 0.5;

      if (!this.solved) {
        const near = fireflies ? fireflies.capturedNear(species, drinkPoint, ACT_R) : 0;
        // charge while enough of the right colour hover close; decay otherwise
        if (near >= need) this.charge = Math.min(1, this.charge + dt * 0.9);
        else this.charge = Math.max(0, this.charge - dt * 1.5);

        if (this.charge >= 1) {
          this.solved = true;
          if (fireflies) fireflies.consume(species, need, drinkPoint);
          if (audio) audio.ping(species);
          this._cbs.forEach((cb) => cb());
        }
        // light the pips up to the charge fraction; invite with a soft pulse
        const filled = this.charge * need;
        pips.forEach((m, i) => { m.emissiveIntensity = i < filled ? 1.8 : 0.12 + pulse * 0.12; });
        shardMat.emissiveIntensity = 0.5 + this.charge * 1.6 + pulse * 0.25;
        halo.material.opacity = 0.2 + this.charge * 0.4 + pulse * 0.1;
        light.intensity = 0.6 + this.charge * 2.2;
      } else {
        shardMat.emissiveIntensity = 2.4 + pulse * 0.8;
        pips.forEach((m) => (m.emissiveIntensity = 2.2));
        halo.material.opacity = 0.45 + pulse * 0.2;
        light.intensity = 2.6;
        shard.position.y = HOVER + Math.sin(t * 1.5) * 0.06;
      }
    },
  };
  return api;
}

// ---- GATE: a slab blocking the way; open() sinks it and drops its collider ----
export function makeGate(world, { x, y = 0, z, w = 3, h = 5, d = 0.6 }) {
  const { mesh, box } = world.addBox(x, y + h / 2, z, w, h, d, new THREE.MeshStandardMaterial({ color: '#0c0d12', roughness: 0.8, metalness: 0.3 }));
  let opening = false; let openT = 0; const startY = mesh.position.y;
  const api = {
    kind: 'gate', mesh,
    open() {
      if (opening) return;
      opening = true;
      const i = world.colliders.indexOf(box);
      if (i >= 0) world.colliders.splice(i, 1);
    },
    update(t, dt) {
      if (opening && openT < 1) {
        openT = Math.min(1, openT + dt * 0.5);
        const e = 1 - Math.pow(1 - openT, 3);
        mesh.position.y = startY - e * (h + 0.5);
      }
    },
  };
  return api;
}

// ---- LIGHT-BRIDGE: ghostly planks that solidify when revealed. Until then an
// invisible guard wall fills the gap so you can never blunder off the edge. ----
export function makeLightBridge(scene, world, { cx, cz, w, d, y = 0, color = SPECIES.wisp.glow }) {
  const col = new THREE.Color(color);
  const region = world.addFloor(cx, cz, w, d, y, { invisible: true, active: false });

  // invisible collider filling the span — blocks crossing (and falling) until revealed
  const guard = new THREE.Box3(new THREE.Vector3(cx - w / 2, y, cz - d / 2), new THREE.Vector3(cx + w / 2, y + 3, cz + d / 2));
  world.colliders.push(guard);

  // faint preview so you can tell a crossing is *possible* here
  const ghostMat = new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.14 });
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), ghostMat);
  ghost.position.set(cx, y - 0.1, cz);
  scene.add(ghost);

  const solidMat = new THREE.MeshStandardMaterial({ color: '#0a1416', emissive: col, emissiveIntensity: 0, roughness: 0.4, transparent: true, opacity: 0 });
  const solid = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), solidMat);
  solid.position.set(cx, y - 0.11, cz);
  scene.add(solid);

  let revealed = false; let rt = 0;
  const api = {
    kind: 'bridge',
    reveal() {
      revealed = true; region.active = true;
      const i = world.colliders.indexOf(guard);
      if (i >= 0) world.colliders.splice(i, 1);
    },
    update(t, dt) {
      if (revealed && rt < 1) {
        rt = Math.min(1, rt + dt * 0.8);
        solidMat.opacity = rt;
        solidMat.emissiveIntensity = rt * 1.8 + Math.abs(Math.sin(t * 3)) * 0.4 * rt;
        ghostMat.opacity = 0.12 * (1 - rt);
      } else if (revealed) {
        solidMat.emissiveIntensity = 1.8 + Math.abs(Math.sin(t * 3)) * 0.4;
      }
    },
  };
  return api;
}

// ---- GLOOM: a churning dark barrier; burn() dissipates it ----
export function makeGloom(scene, world, { x, y = 0, z, w = 4, h = 5, d = 1 }) {
  const { mesh, box } = world.addBox(x, y + h / 2, z, w, h, d, new THREE.MeshBasicMaterial({ color: '#000000' }));
  mesh.material.transparent = true; mesh.material.opacity = 0.96;

  // roiling smoke sprites
  const smoke = new THREE.Group(); scene.add(smoke);
  const puffs = [];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#1a1020', blending: THREE.NormalBlending, transparent: true, opacity: 0.5, depthWrite: false }));
    s.position.set(x + (Math.random() - 0.5) * w, y + Math.random() * h, z + (Math.random() - 0.5) * d);
    s.scale.setScalar(1.5 + Math.random() * 1.5);
    smoke.add(s); puffs.push({ s, ph: Math.random() * 6.28 });
  }

  let burning = false; let bt = 0;
  const api = {
    kind: 'gloom',
    burn() {
      if (burning) return;
      burning = true;
      const i = world.colliders.indexOf(box);
      if (i >= 0) world.colliders.splice(i, 1);
    },
    update(t, dt) {
      for (const p of puffs) {
        p.s.position.y += dt * 0.3;
        if (p.s.position.y > y + h) p.s.position.y = y;
        p.s.material.opacity = (burning ? Math.max(0, 0.5 - bt) : 0.4 + Math.sin(t * 2 + p.ph) * 0.15);
      }
      if (burning && bt < 1) {
        bt = Math.min(1, bt + dt * 0.6);
        mesh.material.opacity = 0.96 * (1 - bt);
        mesh.scale.y = 1 - bt;
        // as it burns, embers flare orange
        smoke.children.forEach((s) => s.material.color.lerp(new THREE.Color('#ff7a3c'), dt * 1.5));
      }
      if (bt >= 1) { mesh.visible = false; smoke.visible = false; }
    },
  };
  return api;
}

// ---- EXIT: a portal that activates once the level's objective is met ----
export function makeExit(scene, { x, y = 0, z }) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); scene.add(grp);
  const col = new THREE.Color('#bfe9ff');

  const ringMat = new THREE.MeshStandardMaterial({ color: '#0b1016', emissive: col, emissiveIntensity: 0.2, roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 14, 40), ringMat);
  ring.position.y = 1.3; grp.add(ring);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false }));
  halo.scale.setScalar(3.4); halo.position.y = 1.3; grp.add(halo);

  const light = new THREE.PointLight(col, 0, 10, 1.6); light.position.set(x, y + 1.3, z); scene.add(light);

  const api = {
    kind: 'exit', pos: grp.position, ready: false,
    activate() { this.ready = true; },
    update(t, dt) {
      ring.rotation.z += dt * (this.ready ? 0.8 : 0.15);
      const pulse = 0.5 + Math.abs(Math.sin(t * 2)) * 0.5;
      const lvl = this.ready ? 1 : 0.12;
      ringMat.emissiveIntensity = (0.4 + pulse * 2.2) * lvl;
      halo.material.opacity = (0.2 + pulse * 0.4) * lvl;
      light.intensity = (1.5 + pulse * 2) * lvl;
    },
    reached(playerPos) { return this.ready && playerPos.distanceTo(grp.position) < 1.8; },
  };
  return api;
}
