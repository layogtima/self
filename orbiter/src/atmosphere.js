import * as THREE from 'three';
import { makeRng } from './rng.js';
import { HABITAT } from './glass.js';

// Cheap volumetric mood for the park interior — no extra real lights. Ground
// glow pools under the rides, soft god-ray shafts from the ceiling strips,
// drifting warm dust motes, and animated flicker on the coloured accents.

export function createAtmosphere(scene, accents) {
  const rng = makeRng(313);
  const group = new THREE.Group();
  scene.add(group);

  // radial glow sprite texture (shared)
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(cv);

  // --- ground glow pools under key attractions ---
  const pools = [
    { pos: [160, 0.3, -8], r: 22, color: 0xffb060, op: 0.22 },  // carousel (kept low; it self-glows)
    { pos: [268, 0.3, -10], r: 36, color: 0xffd0a0, op: 0.3 },  // ferris
    { pos: [72, 0.3, -30], r: 24, color: 0xffc070, op: 0.3 },   // drop tower
    { pos: [96, 0.3, 34], r: 22, color: 0xff5a8c, op: 0.34 },   // magenta accent
    { pos: [232, 0.3, -34], r: 22, color: 0x40e0d0, op: 0.34 }, // teal accent
  ];
  for (const p of pools) {
    const mat = new THREE.MeshBasicMaterial({
      map: glowTex, color: p.color, transparent: true, opacity: p.op,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(p.r * 2, p.r * 2), mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(...p.pos);
    disc.renderOrder = 30;
    group.add(disc);
  }

  // --- god-ray shafts hanging from the ceiling strips ---
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0xffce9a) }, uStrength: { value: 0.12 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
      void main(){
        float v = smoothstep(0.0, 0.55, vUv.y);        // brightest at top (ceiling)
        float h = 1.0 - abs(vUv.x - 0.5) * 2.0;         // fade to the sides
        gl_FragColor = vec4(uColor, v * h * h * uStrength);
      }
    `,
  });
  for (let i = 0; i < 5; i++) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(48, HABITAT.ceilY), shaftMat);
    shaft.position.set(90 + i * 46, HABITAT.ceilY / 2, -60 + i * 30);
    shaft.rotation.y = rng.range(-0.3, 0.3);
    shaft.renderOrder = 31;
    group.add(shaft);
  }

  // --- warm dust motes floating through the park air ---
  const N = 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = rng.range(30, 310);
    pos[i * 3 + 1] = rng.range(2, 100);
    pos[i * 3 + 2] = rng.range(-80, 80);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const motes = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.5, sizeAttenuation: true,
    transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
    map: glowTex,
  }));
  motes.renderOrder = 32;
  group.add(motes);

  const baseMag = accents?.magenta?.intensity ?? 0;
  const baseTeal = accents?.teal?.intensity ?? 0;

  function update(dt, elapsed) {
    motes.rotation.y = elapsed * 0.01;
    motes.position.y = Math.sin(elapsed * 0.2) * 1.5;
    // carnival flicker on the coloured accents
    if (accents?.magenta) accents.magenta.intensity = baseMag * (0.75 + 0.25 * Math.sin(elapsed * 5.3));
    if (accents?.teal) accents.teal.intensity = baseTeal * (0.75 + 0.25 * Math.sin(elapsed * 4.1 + 1.5));
    if (accents?.uplight) accents.uplight.intensity = 480 * (0.92 + 0.08 * Math.sin(elapsed * 11));
  }

  return { group, update };
}
