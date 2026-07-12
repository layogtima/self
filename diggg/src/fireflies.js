// Fireflies: additive glow sprites that wander above the meadow at night, each
// pulsing on its own phase. Two of them carry real PointLights for cheap bounce.

import * as THREE from 'three';
import { W, D, hash2 } from './world.js';

const N = 70;

function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  const grad = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,220,120,1)');
  grad.addColorStop(0.4, 'rgba(255,190,80,0.5)');
  grad.addColorStop(1, 'rgba(255,180,60,0)');
  c.fillStyle = grad; c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export function makeFireflies(scene, world) {
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const flies = [];
  for (let i = 0; i < N; i++) {
    const x = 2 + hash2(i * 7.3, 1.1) * (W - 4), z = 2 + hash2(i * 3.9, 8.7) * (D - 4);
    flies.push({ x, z, y: world.heightAt(x, z) + 0.8 + hash2(i, 4) * 2, ph: hash2(i, 9) * 7, reanchor: hash2(i, 5) * 8 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    map: glowTexture(), size: 0.55, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // two of the swarm actually light the ground
  const lights = [0, 1].map(() => {
    const l = new THREE.PointLight('#ffd25a', 0, 7, 1.6);
    scene.add(l); return l;
  });

  const base = new THREE.Color('#ffd25a');
  return {
    update(t, dt, night) {
      for (let i = 0; i < N; i++) {
        const f = flies[i];
        f.reanchor -= dt;
        if (f.reanchor <= 0) {   // drift to a fresh patch of meadow
          f.x = Math.max(2, Math.min(W - 2, f.x + (hash2(i, t | 0) - 0.5) * 10));
          f.z = Math.max(2, Math.min(D - 2, f.z + (hash2(t | 0, i) - 0.5) * 10));
          f.y = world.heightAt(f.x, f.z) + 0.8 + hash2(i, t | 0) * 2;
          f.reanchor = 5 + hash2(i, 3) * 6;
        }
        pos[i * 3] = f.x + Math.sin(t * 0.7 + f.ph) * 1.2;
        pos[i * 3 + 1] = f.y + Math.sin(t * 1.1 + f.ph * 2) * 0.5;
        pos[i * 3 + 2] = f.z + Math.cos(t * 0.9 + f.ph) * 1.2;
        const pulse = (0.35 + 0.65 * Math.max(0, Math.sin(t * 2.4 + f.ph))) * night;
        col[i * 3] = base.r * pulse; col[i * 3 + 1] = base.g * pulse; col[i * 3 + 2] = base.b * pulse;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      points.visible = night > 0.02;
      lights.forEach((l, k) => {
        l.position.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
        l.intensity = 2.2 * night;
      });
    },
  };
}
