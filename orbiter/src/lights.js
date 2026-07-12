import * as THREE from 'three';
import { HABITAT } from './glass.js';

// Two-world lighting. Outside: one hard cold sun + faint space fill. Inside:
// a moody golden-hour rig — a warm overhead key, a low amber uplight, and two
// coloured carnival accents (magenta + teal) for that fairground glow.
//
// Deliberately FEW real lights: MeshStandard fragment cost scales with light
// count, and this scene was crashing weaker GPUs. We lean on emissives + bloom
// + additive glow (see atmosphere.js) for the rest of the mood.

export function createLights(scene) {
  // --- the sun: cold key from high off the +Z bow quarter ---
  const sun = new THREE.DirectionalLight(0xeaf2ff, 3.1);
  sun.position.set(700, 850, 1300);
  sun.target.position.set(-200, 50, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -650; cam.right = 650;
  cam.top = 480; cam.bottom = -380;
  cam.near = 100; cam.far = 3200;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 2.5;
  scene.add(sun, sun.target);

  // faint cool space fill so shadow sides aren't pure black
  const fill = new THREE.HemisphereLight(0x2a3a52, 0x0b0e15, 0.7);
  scene.add(fill);

  // cold rim from the far side to carve the dark silhouette (planet-bounce)
  const rim = new THREE.DirectionalLight(0x4c6ea0, 0.6);
  rim.position.set(-900, 250, -1100);
  rim.target.position.set(-200, 50, 0);
  scene.add(rim, rim.target);

  // --- interior rig (5 lights total, all shadowless) ---
  const H = HABITAT;
  const cx = (H.min.x + H.max.x) / 2;

  // warm overhead key — the "sun through the roof" of the park
  const key = new THREE.PointLight(0xffb968, 1700, 320, 1.5);
  key.position.set(cx, H.ceilY - 6, 6);
  scene.add(key);

  // low amber uplight near the carousel — warms the crowd from below
  const uplight = new THREE.PointLight(0xff9a4a, 480, 130, 1.9);
  uplight.position.set(160, 14, -6);
  scene.add(uplight);

  // ferris-side warm accent
  const ferrisWarm = new THREE.PointLight(0xffcaa0, 700, 150, 1.7);
  ferrisWarm.position.set(262, 30, -10);
  scene.add(ferrisWarm);

  // carnival colour accents — subtle, animated flicker in atmosphere.js
  const magenta = new THREE.PointLight(0xff4d84, 380, 120, 2.0);
  magenta.position.set(96, 16, 34);
  scene.add(magenta);

  const teal = new THREE.PointLight(0x33d6c8, 340, 120, 2.0);
  teal.position.set(232, 16, -34);
  scene.add(teal);

  return { sun, accents: { magenta, teal, uplight } };
}
