import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { makeRng } from '../rng.js';

// Rigged, skeletally-animated park visitors. Loads one or more CC0/CC glTF
// character models, clones each per visitor (SkeletonUtils → own skeleton),
// and runs a small state machine on a per-character AnimationMixer:
//   walk to a target → arrive → a random idle/emote action → walk on.
//
// Animation clips are matched HEURISTICALLY by name substring, so you can drop
// in arbitrary Sketchfab/Mixamo models (their clips are named differently) and
// it still finds the walk/idle/action loops. Add model types to `models`.
//
// Perf note: multi-mesh models cost ~N draws each — prefer single-mesh
// (or merged) rigs for big crowds; use rigged hero visitors + the cheap
// instanced box-crowd (guests.js) for the masses.

const BOUNDS = { x0: 26, x1: 314, z0: -76, z1: 76 };
const WALK_KEYS = ['walk', 'run', 'move'];
const IDLE_KEYS = ['idle', 'stand', 'breath'];
const ACTION_KEYS = ['wave', 'dance', 'cheer', 'clap', 'talk', 'yes', 'no',
  'thumb', 'jump', 'sit', 'point', 'laugh', 'look'];

// Soldier: a rigged human, ~2 skinned meshes (≈2 draws vs RobotExpressive's
// 35), clips Idle/Walk/Run — cheap enough for a real crowd. Add more model
// types (Mixamo/Quaternius) here for richer variety + emotes.
// yaw = extra Y rotation so the model faces its travel direction (rigs differ:
// Soldier's forward is -Z → needs PI; RobotExpressive's is +Z → 0).
const DEFAULT_MODELS = [
  { url: '/assets/characters/Soldier.glb', scale: 1.0, tint: true, yaw: Math.PI },
];

// match by keyword PRIORITY (try keys[0] across all clips, then keys[1], …)
// so 'walk' wins over 'run' rather than depending on clip order
const findClip = (clips, keys) => {
  for (const k of keys) {
    const c = clips.find((cl) => cl.name.toLowerCase().includes(k));
    if (c) return c;
  }
  return null;
};

export function createCharacters(scene, { count = 28, models = DEFAULT_MODELS } = {}) {
  const rng = makeRng(777);
  const group = new THREE.Group();
  scene.add(group);
  const chars = [];
  const tmp = new THREE.Vector3();
  const loader = new GLTFLoader();

  Promise.all(models.map((m) => loader.loadAsync(m.url).then((gltf) => {
    const clips = gltf.animations;
    return {
      ...m, gltf,
      walk: findClip(clips, WALK_KEYS),
      idle: findClip(clips, IDLE_KEYS) || clips[0] || null,
      actions: clips.filter((c) => ACTION_KEYS.some((k) => c.name.toLowerCase().includes(k))),
    };
  }))).then((loaded) => {
    const usable = loaded.filter((m) => m.gltf.scene);
    for (let i = 0; i < count; i++) {
      const src = rng.pick(usable);
      const model = skeletonClone(src.gltf.scene);
      const tint = src.tint ? new THREE.Color().setHSL(rng.next(), rng.range(0.3, 0.6), rng.range(0.42, 0.68)) : null;
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.frustumCulled = false;
        if (tint) { o.material = o.material.clone(); o.material.color.copy(tint); } // per-guest colour
      });
      model.scale.setScalar((src.scale ?? 0.3) * rng.range(0.9, 1.1));
      const pos = new THREE.Vector3(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1));
      model.position.copy(pos);
      group.add(model);

      const mixer = new THREE.AnimationMixer(model);
      const act = (clip) => (clip ? mixer.clipAction(clip) : null);
      const ch = {
        model, mixer, pos, heading: rng.next() * Math.PI * 2, yaw: src.yaw ?? 0,
        target: new THREE.Vector3(), speed: rng.range(1.3, 2.1),
        state: 'walk', dwell: 0, current: null,
        walk: act(src.walk), idle: act(src.idle),
        actions: src.actions.map(act),
      };
      mixer.addEventListener('finished', () => { if (ch.state === 'dwell') fadeTo(ch, ch.idle); });
      pickTarget(ch);
      fadeTo(ch, ch.walk || ch.idle);
      chars.push(ch);
    }
  }).catch((e) => console.error('[characters] load failed:', e));

  function fadeTo(ch, next, dur = 0.3, once = false) {
    if (!next || next === ch.current) return;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(dur).play();
    if (ch.current) ch.current.fadeOut(dur);
    ch.current = next;
  }

  function pickTarget(ch) {
    // 55% short hop near where they are (so they stop & act often), else roam
    if (rng.chance(0.55)) {
      ch.target.set(
        THREE.MathUtils.clamp(ch.pos.x + rng.range(-24, 24), BOUNDS.x0, BOUNDS.x1), 0,
        THREE.MathUtils.clamp(ch.pos.z + rng.range(-24, 24), BOUNDS.z0, BOUNDS.z1));
    } else {
      ch.target.set(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1));
    }
  }

  function startDwell(ch) {
    ch.state = 'dwell';
    ch.dwell = rng.range(2.5, 7);
    if (ch.actions.length && rng.chance(0.6)) fadeTo(ch, rng.pick(ch.actions), 0.3, true);
    else fadeTo(ch, ch.idle);
  }

  function update(dt) {
    for (const ch of chars) {
      ch.mixer.update(dt);
      if (ch.state === 'walk') {
        tmp.subVectors(ch.target, ch.pos); tmp.y = 0;
        const d = tmp.length();
        if (d < 1.6) startDwell(ch);
        else {
          tmp.divideScalar(d);
          ch.pos.addScaledVector(tmp, ch.speed * dt);
          ch.heading = Math.atan2(tmp.x, tmp.z);
        }
      } else if ((ch.dwell -= dt) <= 0) {
        pickTarget(ch); ch.state = 'walk'; fadeTo(ch, ch.walk || ch.idle);
      }
      ch.model.position.set(ch.pos.x, 0, ch.pos.z);
      const want = ch.heading + ch.yaw; // per-model forward-axis offset
      let dy = want - ch.model.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      ch.model.rotation.y += dy * Math.min(1, dt * 8);
    }
  }

  return { update, group, get count() { return chars.length; } };
}
