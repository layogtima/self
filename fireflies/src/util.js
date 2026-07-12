// util.js — shared constants + tiny helpers
import * as THREE from 'three';

// ---- the three firefly species: colour = ability = musical voice ----
// hue drives body/glow; note is a semitone offset within our scale (see audio.js)
export const SPECIES = {
  glimmer: { key: 'glimmer', name: 'Glimmer', ability: 'light',  glow: '#ffb648', body: '#ffe6a8', css: '#ffb648', note: 0,  syncAt: 3 },
  wisp:    { key: 'wisp',    name: 'Wisp',    ability: 'reveal', glow: '#4fe6ff', body: '#c9f6ff', css: '#4fe6ff', note: 7,  syncAt: 3 },
  ember:   { key: 'ember',   name: 'Ember',   ability: 'ignite', glow: '#ff5f8f', body: '#ffd0dc', css: '#ff5f8f', note: 4,  syncAt: 3 },
};
export const SPECIES_ORDER = ['glimmer', 'wisp', 'ember'];

// ---- deterministic per-instance randomness (no Math.random in hot paths) ----
// gives each firefly a stable seed so a swarm never looks uniform
export function hash11(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// ---- reusable radial-gradient sprite texture (glow halos, embers, dust) ----
export function radialTex(inner = '#ffffff', mid = 0.35, midColor = null) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0.5, 32, 32, 31);
  g.addColorStop(0, inner);
  g.addColorStop(mid, midColor || inner);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
