import * as THREE from 'three';
import { HABITAT } from '../glass.js';

// Park ground: a painted canvas texture — frosty pale deck, warm sand paths,
// plaza circles — so the floor reads designed rather than flat.

export function createDeck(scene) {
  const H = HABITAT;
  const w = H.max.x - H.min.x - 2 * H.wallT;
  const d = H.max.z - H.min.z - 2 * H.wallT;

  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');

  // frosty base
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, '#dfe6ec');
  base.addColorStop(1, '#cdd6de');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  // subtle deck plating grid
  ctx.strokeStyle = 'rgba(140,155,170,0.25)';
  ctx.lineWidth = 2;
  for (let gx = 0; gx <= 1024; gx += 64) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 512); ctx.stroke(); }
  for (let gy = 0; gy <= 512; gy += 64) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(1024, gy); ctx.stroke(); }

  // warm promenade loop
  ctx.strokeStyle = '#e8c99a';
  ctx.lineWidth = 46;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(512, 300, 380, 150, 0, 0, Math.PI * 2);
  ctx.stroke();
  // spur paths to the rides
  ctx.lineWidth = 30;
  const spurs = [[512, 300, 512, 80], [512, 300, 140, 180], [512, 300, 880, 160], [512, 300, 260, 440], [512, 300, 800, 430]];
  for (const [x1, y1, x2, y2] of spurs) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  // plaza discs
  ctx.fillStyle = '#e2ceab';
  for (const [px, py, pr] of [[512, 300, 90], [140, 180, 55], [880, 160, 60], [260, 440, 48], [800, 430, 50]]) {
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(180,150,105,0.5)';
  ctx.lineWidth = 4;
  for (const [px, py, pr] of [[512, 300, 90], [140, 180, 55], [880, 160, 60]]) {
    ctx.beginPath(); ctx.arc(px, py, pr - 8, 0, Math.PI * 2); ctx.stroke();
  }
  // scattered planting beds
  ctx.fillStyle = 'rgba(120,160,110,0.5)';
  for (let i = 0; i < 26; i++) {
    const px = (i * 173) % 1024, py = 40 + ((i * 89) % 440);
    ctx.beginPath(); ctx.arc(px, py, 10 + (i % 4) * 5, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((H.min.x + H.max.x) / 2, 0.05, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  return { floor };
}
