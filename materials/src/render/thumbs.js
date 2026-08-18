// Card specimens are rendered once into their own little canvas and then left alone.
// A grid of fifty live WebGL viewports costs a frame's worth of GPU every frame, forever;
// this costs one render each at boot and nothing thereafter. Hover brings one back to life.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeMesh } from './specimens.js';

const SIZE = 192; // enough for a 72px slot at 2.5x device pixel ratio

export function createThumbnailer() {
  const source = document.createElement('canvas');
  source.width = source.height = SIZE;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: source, antialias: true, alpha: true });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  renderer.setSize(SIZE, SIZE, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearAlpha(0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2.5, 3.5, 2.5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.3, 5.1);
  camera.lookAt(0, 0, 0);

  const meshes = new Map();
  const mesh = (material) => {
    if (!meshes.has(material.id)) meshes.set(material.id, makeMesh(material, 'card'));
    return meshes.get(material.id);
  };

  /** Draw one material into a card's canvas at the given rotation. */
  function paint(material, target, angle = 0) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(target.clientWidth * dpr));
    const h = Math.max(1, Math.round(target.clientHeight * dpr));
    if (w <= 1 || h <= 1) return false;
    if (target.width !== w || target.height !== h) {
      target.width = w;
      target.height = h;
    }

    const m = mesh(material);
    m.rotation.set(0.3 + Math.sin(angle * 0.6) * 0.08, material.specimen.seed * 0.7 + angle, 0.1);
    scene.add(m);
    renderer.render(scene, camera);
    scene.remove(m);

    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, SIZE, SIZE, 0, 0, w, h);
    return true;
  }

  return {
    paint,
    dispose() {
      for (const m of meshes.values()) scene.remove(m);
      meshes.clear();
      renderer.dispose();
    },
  };
}
