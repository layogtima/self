import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { makeRng } from '../rng.js';

// Rigged park crowd from the Creative Characters pack (modular mix-and-match,
// ~1.1K tris) animated by a SHARED Mixamo clip library.
//
// Two tricks make it work:
//  1. Shared clips: every Mixamo rig uses the same bone names, so one library
//     of clips plays on any character. The library's tracks are prefixed
//     `mixamorig1:` while the pack's bones are bare (Hips, LeftFoot…), so we
//     strip the prefix off the tracks once at load → they bind cleanly.
//  2. Modular variety: the pack is 30 parts (Body/Hat/Costume/Pants/…) on one
//     skeleton. Each cloned guest shows a randomly-assembled valid outfit by
//     toggling part visibility — thousands of looks from a single glb.

const BOUNDS = { x0: 26, x1: 314, z0: -76, z1: 76 };
const LIBRARY_URL = '/assets/anims/mixamo-library.glb';

// The Mixamo clips' root (Hips) frame is offset from the pack rig's bind by a
// fixed rotation (a Blender FBX up-axis quirk) — uncorrected it lays the body
// flat. Correct the Hips track by this so the body stands + hips still animate.
// Tunable via ?rootfix=<deg> for calibration.
const ROOTFIX_DEG = new URLSearchParams(location.search).has('rootfix')
  ? +new URLSearchParams(location.search).get('rootfix') : 90;

const DEFAULT_MODELS = [{
  url: '/assets/characters/creative-character-free.glb',
  texture: '/assets/characters/creative-texture.png',
  scale: 1, yaw: 0, modular: true,
}];

// part node-name prefix → outfit category
function categoryOf(name) {
  const n = name.toLowerCase();
  if (n.startsWith('body')) return 'body';
  if (n.startsWith('male_emotion') || n.startsWith('female_emotion')) return 'face';
  if (n.startsWith('costume')) return 'costume';
  if (n.startsWith('t_shirt') || n.startsWith('t-shirt')) return 'top';
  if (n.startsWith('outerwear') || n.startsWith('outwear')) return 'outerwear';
  if (n.startsWith('pants') || n.startsWith('shorts')) return 'bottom';
  if (n.startsWith('shoe')) return 'shoes';
  if (n.startsWith('socks')) return 'socks';
  if (n.startsWith('hairstyle')) return 'hair';
  if (n.startsWith('hat')) return 'hat';
  if (n.startsWith('glasses')) return 'glasses';
  if (n.startsWith('moustache')) return 'moustache';
  if (n.startsWith('gloves')) return 'gloves';
  return 'accessory'; // clown_nose, headphones, pacifier
}

// state → library clip names (first present wins)
const WALKS = ['walk', 'walk.happy'];
const IDLES = ['idle', 'idle.happy', 'idle.5', 'idle.lookaround'];
const EMOTES = ['wave', 'cheer', 'clap', 'laugh', 'excited', 'bow', 'drink', 'idle.4', 'idle.lookaround'];
const ONESHOT = new Set(['wave', 'bow', 'excited', 'idle.4']);

export function createCharacters(scene, { count = 90, models = DEFAULT_MODELS } = {}) {
  const rng = makeRng(777);
  const group = new THREE.Group();
  scene.add(group);
  const chars = [];
  const tmp = new THREE.Vector3();
  const loader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();

  // load the shared clip library + all character models in parallel
  const libP = loader.loadAsync(LIBRARY_URL).then((g) => {
    const map = {};
    for (const clip of g.animations) {
      // ROTATIONS ONLY. Mixamo clips are authored at cm scale and their
      // position/scale tracks would force the source rig's (huge) bone offsets
      // onto our small character → skinning explosion. Bone rotations are
      // scale-independent; positions come from the target bind pose. Dropping
      // Hips.position also removes root motion (In-Place, we move via code).
      // Then strip the Mixamo prefix (GLTFLoader sanitizes the ':' away, so
      // the track reads "mixamorig1Hips" — colon optional).
      clip.tracks = clip.tracks
        .filter((t) => /\.quaternion$/i.test(t.name))
        .map((t) => { t.name = t.name.replace(/^mixamorig\d*:?/i, ''); return t; });
      // correct the Hips-track keyframes by the fixed root-frame offset
      const hips = clip.tracks.find((t) => t.name === 'Hips.quaternion');
      if (hips) {
        const fix = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ROOTFIX_DEG * Math.PI / 180);
        const q = new THREE.Quaternion();
        const v = hips.values;
        for (let i = 0; i < v.length; i += 4) {
          q.set(v[i], v[i + 1], v[i + 2], v[i + 3]).premultiply(fix);
          v[i] = q.x; v[i + 1] = q.y; v[i + 2] = q.z; v[i + 3] = q.w;
        }
      }
      map[clip.name] = clip;
    }
    return map;
  });

  const modelP = Promise.all(models.map((m) => loader.loadAsync(m.url).then((g) => {
    if (m.texture) {
      const tex = texLoader.load(m.texture);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // glTF convention
      g.scene.traverse((o) => {
        if (o.isMesh && o.material && /color/i.test(o.material.name || '')) {
          o.material.map = tex; o.material.needsUpdate = true;
        }
      });
    }
    return { ...m, gltf: g };
  })));

  Promise.all([libP, modelP]).then(([clipMap, loaded]) => {
    // prune tracks for bones the pack rig lacks (Spine2/Head/fingers) so
    // PropertyBinding doesn't spam "no target node" warnings
    const boneSet = new Set();
    loaded[0].gltf.scene.traverse((o) => { if (o.isBone) boneSet.add(o.name); });
    for (const n in clipMap) clipMap[n].tracks = clipMap[n].tracks.filter((t) => boneSet.has(t.name.split('.')[0]));

    const pick = (names) => { for (const n of names) if (clipMap[n]) return clipMap[n]; return null; };
    const walkClips = WALKS.map((n) => clipMap[n]).filter(Boolean);
    const idleClips = IDLES.map((n) => clipMap[n]).filter(Boolean);
    const emoteClips = EMOTES.map((n) => (clipMap[n] ? { name: n, clip: clipMap[n] } : null)).filter(Boolean);

    for (let i = 0; i < count; i++) {
      const src = rng.pick(loaded);
      const model = skeletonClone(src.gltf.scene);
      model.scale.setScalar((src.scale ?? 1) * rng.range(0.92, 1.08));
      const pos = new THREE.Vector3(rng.range(BOUNDS.x0, BOUNDS.x1), 0, rng.range(BOUNDS.z0, BOUNDS.z1));
      model.position.copy(pos);
      if (src.modular) dressUp(model, rng);
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      group.add(model);

      const mixer = new THREE.AnimationMixer(model);
      const walkClip = walkClips.length ? rng.pick(walkClips) : pick(['idle']);
      const idleClip = idleClips.length ? rng.pick(idleClips) : pick(['idle']);
      const ch = {
        model, mixer, pos, heading: rng.next() * Math.PI * 2, yaw: src.yaw ?? 0,
        target: new THREE.Vector3(), speed: rng.range(1.2, 2.0),
        state: 'walk', dwell: 0, current: null,
        walk: walkClip ? mixer.clipAction(walkClip) : null,
        idle: idleClip ? mixer.clipAction(idleClip) : null,
        emotes: emoteClips.map((e) => ({ once: ONESHOT.has(e.name), action: mixer.clipAction(e.clip) })),
      };
      mixer.addEventListener('finished', () => { if (ch.state === 'dwell' && ch.idle) fadeTo(ch, ch.idle); });
      pickTarget(ch);
      if (ch.walk) fadeTo(ch, ch.walk);
      chars.push(ch);
    }
  }).catch((e) => console.error('[characters] load failed:', e));

  // — assemble a random valid outfit by toggling part visibility —
  function dressUp(model, rng) {
    const cats = {};
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.visible = false;
      (cats[categoryOf(o.name)] ||= []).push(o);
    });
    const show = (arr) => arr && arr.forEach((o) => (o.visible = true));
    const one = (cat) => cats[cat] && (cats[cat][rng.int(0, cats[cat].length - 1)].visible = true);
    show(cats.body);
    one('face');
    one('shoes');
    if (rng.chance(0.25) && cats.costume) { one('costume'); }
    else {
      one('bottom'); if (cats.top) one('top');
      if (rng.chance(0.35)) one('outerwear');
      if (rng.chance(0.4)) one('socks');
    }
    if (rng.chance(0.7)) one('hair');
    if (rng.chance(0.32)) one('hat');
    if (rng.chance(0.3)) one('glasses');
    if (rng.chance(0.22)) one('moustache');
    if (rng.chance(0.15)) one('gloves');
    if (rng.chance(0.12)) one('accessory');
  }

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
    if (ch.emotes.length && rng.chance(0.7)) {
      const e = rng.pick(ch.emotes);
      fadeTo(ch, e.action, 0.3, e.once);
    } else if (ch.idle) fadeTo(ch, ch.idle);
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
        pickTarget(ch); ch.state = 'walk'; if (ch.walk) fadeTo(ch, ch.walk);
      }
      ch.model.position.set(ch.pos.x, 0, ch.pos.z);
      const want = ch.heading + ch.yaw;
      let dy = want - ch.model.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      ch.model.rotation.y += dy * Math.min(1, dt * 8);
    }
  }

  return { update, group, get count() { return chars.length; } };
}
