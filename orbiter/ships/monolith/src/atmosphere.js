import * as THREE from 'three';
import { makeRng } from './rng.js';
import { ATRIUM } from './config.js';

// Atrium air: god-ray shafts through the oculus + drifting warm motes, and
// the disco engine (cycles whatever accent lights are registered with it —
// the live array grows as chambers do).

export function createAtmosphere(scene, accents) {
  const rng = makeRng(313);
  const group = new THREE.Group();
  scene.add(group);

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

  const fx = new THREE.Group();
  group.add(fx);

  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0xffce9a) }, uStrength: { value: 0.1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
      void main(){
        float v = smoothstep(0.0, 0.55, vUv.y);
        float h = 1.0 - abs(vUv.x - 0.5) * 2.0;
        gl_FragColor = vec4(uColor, v * h * h * uStrength);
      }
    `,
  });
  for (let i = 0; i < 3; i++) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(30, ATRIUM.h), shaftMat);
    shaft.position.set(-22 + i * 22, ATRIUM.h / 2, -14 + i * 14);
    shaft.rotation.y = rng.range(-0.4, 0.4);
    shaft.renderOrder = 31;
    fx.add(shaft);
  }

  const N = 120;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = rng.range(-60, 60);
    pos[i * 3 + 1] = rng.range(2, ATRIUM.h - 20);
    pos[i * 3 + 2] = rng.range(-60, 60);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const motes = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffe0b8, size: 0.4, sizeAttenuation: true,
    transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending,
    map: glowTex,
  }));
  motes.renderOrder = 32;
  fx.add(motes);

  let disco = 0;

  function update(dt, elapsed) {
    motes.position.y = Math.sin(elapsed * 0.2) * 1.2;
    if (disco > 0) {
      disco -= dt;
      const hue = (elapsed * 0.35) % 1;
      accents.forEach((a, i) => {
        if (!a.userData.baseColor) {
          a.userData.baseColor = a.color.clone();
          a.userData.baseIntensity = a.intensity;
        }
        a.color.setHSL((hue + i * 0.17) % 1, 0.85, 0.6);
        a.intensity = a.userData.baseIntensity * (1.5 + Math.sin(elapsed * 9 + i) * 0.7);
      });
      if (disco <= 0) accents.forEach((a) => {
        if (a.userData.baseColor) { a.color.copy(a.userData.baseColor); a.intensity = a.userData.baseIntensity; }
      });
    }
  }

  return {
    group, update,
    startDisco(seconds = 10) { disco = seconds; },
    setEffectsVisible(v) { fx.visible = v; },
  };
}
