import * as THREE from 'three';
import gsap from 'gsap';
import { makeRng } from './rng.js';

// Deep space backdrop: layered starfield shells, planets built by a reusable
// factory (Nova can blink new ones into existence), distant traffic, and
// near-field dust. Exposes hooks for star tinting (Paint the Void), draw-range
// scaling (quality tiers), and group access (warp drive spin).

const SUN_DIR = new THREE.Vector3(0.4, 0.55, -0.73).normalize();

export function createPlanet({
  position = new THREE.Vector3(-1200, 1100, -5200),
  radius = 1350,
  seed = 1,
  tilt = 0.46,
  rings = true,
  palette = { a: 0x6f8bb8, b: 0x2c3d5e, c: 0xc9d6e8 },
} = {}) {
  const rng = makeRng(seed);
  const group = new THREE.Group();
  group.position.copy(position);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: SUN_DIR.clone() },
      uColorA: { value: new THREE.Color(palette.a) },
      uColorB: { value: new THREE.Color(palette.b) },
      uColorC: { value: new THREE.Color(palette.c) },
      uBandScale: { value: rng.range(8, 22) },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormalW; varying vec3 vPosW; varying vec3 vLocal;
      void main() {
        vLocal = position;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
      uniform float uBandScale;
      varying vec3 vNormalW; varying vec3 vPosW; varying vec3 vLocal;
      void main() {
        float lat = vLocal.y * 0.004;
        float wob = sin(vLocal.x * 0.006 + vLocal.z * 0.004) * 0.35;
        float bands = sin(lat * uBandScale + wob) * 0.5 + 0.5;
        float bands2 = sin(lat * uBandScale * 2.2 - wob * 2.0) * 0.5 + 0.5;
        vec3 base = mix(uColorB, uColorA, bands);
        base = mix(base, uColorC, bands2 * 0.18);
        float diff = pow(clamp(dot(normalize(vNormalW), uSunDir), 0.0, 1.0), 0.8);
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fres = pow(1.0 - clamp(dot(viewDir, normalize(vNormalW)), 0.0, 1.0), 2.6);
        vec3 atmo = vec3(0.5, 0.72, 1.0) * fres * (0.25 + diff * 1.15);
        gl_FragColor = vec4(base * (0.03 + diff * 0.9) + atmo, 1.0);
      }
    `,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 28), mat);
  group.add(sphere);

  let ringMat = null;
  if (rings) {
    const ringInner = radius * 1.22, ringOuter = radius * 2.26;
    ringMat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: {
        uInner: { value: ringInner }, uOuter: { value: ringOuter },
        uSunDir: { value: SUN_DIR.clone() },
        uWarm: { value: new THREE.Color(0.86, 0.78, 0.62) },
        uPale: { value: new THREE.Color(0.72, 0.75, 0.82) },
      },
      vertexShader: /* glsl */`
        varying vec2 vXY; varying vec3 vNormalW;
        void main() {
          vXY = position.xy;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uInner; uniform float uOuter; uniform vec3 uSunDir;
        uniform vec3 uWarm; uniform vec3 uPale;
        varying vec2 vXY; varying vec3 vNormalW;
        void main() {
          float r = length(vXY);
          float t = (r - uInner) / (uOuter - uInner);
          float fine = 0.5 + 0.5 * sin(t * 130.0);
          float broad = 0.6 + 0.4 * sin(t * 7.0 + 1.0);
          float dens = mix(fine, 1.0, 0.35) * broad;
          float gap = smoothstep(0.46, 0.49, t) * (1.0 - smoothstep(0.51, 0.54, t));
          dens *= 1.0 - gap * 0.85;
          float edge = smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.95, 1.0, t));
          float lit = 0.35 + 0.65 * clamp(abs(dot(normalize(vNormalW), uSunDir)), 0.0, 1.0);
          gl_FragColor = vec4(mix(uPale, uWarm, broad) * lit, dens * edge * 0.62);
        }
      `,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(ringInner, ringOuter, 180, 2), ringMat);
    ring.rotation.x = -Math.PI / 2 + tilt;
    ring.rotation.z = rng.range(-0.2, 0.2);
    group.add(ring);
  }

  return {
    group,
    mat,
    dispose() {
      sphere.geometry.dispose();
      mat.dispose();
      if (ringMat) ringMat.dispose();
      group.parent?.remove(group);
    },
  };
}

// space palettes for Nova's "Paint the Void"
export const VOID_PALETTES = [
  { name: 'Standard Void', bg: 0x020208, starTint: 0xffffff },
  { name: 'Ember Nebula', bg: 0x0a0305, starTint: 0xffc9a0 },
  { name: 'Rose Drift', bg: 0x0a0212, starTint: 0xf0b8ff },
  { name: 'Abyssal Teal', bg: 0x021010, starTint: 0xa0fff0 },
];

// soft radial blob texture for nebulae / galaxies
function blobTexture(hue0, hue1, seed = 1) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  const rng2 = makeRng(seed * 71 + 3);
  for (let i = 0; i < 22; i++) {
    const x = 128 + rng2.range(-70, 70);
    const y = 128 + rng2.range(-70, 70);
    const r = rng2.range(24, 86);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const h = rng2.chance(0.5) ? hue0 : hue1;
    g.addColorStop(0, `hsla(${h}, 70%, 62%, ${rng2.range(0.05, 0.16)})`);
    g.addColorStop(1, `hsla(${h}, 70%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(cv);
}

function flareTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.4)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  // cross flare
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(0, 62, 128, 4);
  ctx.fillRect(62, 0, 4, 128);
  return new THREE.CanvasTexture(cv);
}

export function createSpace(scene) {
  const rng = makeRng(1969);
  const group = new THREE.Group();
  scene.add(group);

  // --- starfield shells ---
  const starGroup = new THREE.Group();
  group.add(starGroup);
  const shells = [
    { count: 2000, radius: 14000, size: 9, brightness: 1.0 },
    { count: 1500, radius: 9000, size: 6, brightness: 0.65 },
    { count: 1000, radius: 5500, size: 4, brightness: 0.4 },
  ];
  const starMeshes = [];
  for (const shell of shells) {
    const pos = new Float32Array(shell.count * 3);
    const col = new Float32Array(shell.count * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < shell.count; i++) {
      const u = rng.next() * 2 - 1;
      const theta = rng.next() * Math.PI * 2;
      const r = shell.radius * (0.85 + rng.next() * 0.3);
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(theta);
      const roll = rng.next();
      if (roll > 0.97) tint.setHSL(0.08, 0.7, 0.75);
      else if (roll > 0.93) tint.setHSL(0.6, 0.6, 0.8);
      else tint.setHSL(0.62, rng.next() * 0.15, 0.6 + rng.next() * 0.35);
      const b = shell.brightness * (0.4 + rng.next() * 0.6);
      col[i * 3] = tint.r * b; col[i * 3 + 1] = tint.g * b; col[i * 3 + 2] = tint.b * b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: shell.size, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.95, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.userData.fullCount = shell.count;
    starGroup.add(points);
    starMeshes.push(points);
  }

  // --- the living deep field: nebulae, a galaxy band, distant galaxies ---
  const nebulae = [];
  const NEB_HUES = [[168, 190], [320, 275], [200, 250], [15, 340]];
  for (let i = 0; i < 7; i++) {
    const [h0, h1] = NEB_HUES[i % NEB_HUES.length];
    const mat = new THREE.SpriteMaterial({
      map: blobTexture(h0, h1, i + 2), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: rng.range(0.4, 0.75),
    });
    const s = new THREE.Sprite(mat);
    const u = rng.next() * 2 - 1;
    const th = rng.next() * Math.PI * 2;
    const r = rng.range(9000, 13500);
    const sq = Math.sqrt(1 - u * u);
    s.position.set(r * sq * Math.cos(th), r * u * 0.7, r * sq * Math.sin(th));
    s.scale.setScalar(rng.range(4200, 8200));
    group.add(s);
    nebulae.push(s);
  }
  // galaxy band: two long streak sprites crossing the sky
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.SpriteMaterial({
      map: blobTexture(210, 40, 40 + i), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.5,
    });
    const s = new THREE.Sprite(mat);
    s.position.set(i ? 4000 : -3000, 5000 - i * 1500, i ? -9000 : -10000);
    s.scale.set(26000, 5200 - i * 1400, 1);
    s.material.rotation = 0.35;
    group.add(s);
  }
  // distant galaxies: tiny tilted smudges
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.SpriteMaterial({
      map: blobTexture(rng.range(180, 330), rng.range(20, 60), 90 + i),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      opacity: rng.range(0.35, 0.6), rotation: rng.next() * Math.PI,
    });
    const s = new THREE.Sprite(mat);
    const u = rng.next() * 2 - 1;
    const th = rng.next() * Math.PI * 2;
    const r = 14500;
    const sq = Math.sqrt(1 - u * u);
    s.position.set(r * sq * Math.cos(th), r * u, r * sq * Math.sin(th));
    s.scale.set(rng.range(300, 900), rng.range(120, 380), 1);
    group.add(s);
  }
  // hero stars with cross flares
  const flareTex = flareTexture();
  for (let i = 0; i < 22; i++) {
    const c = new THREE.Color().setHSL(rng.chance(0.3) ? 0.08 : 0.58, 0.5, 0.85);
    const mat = new THREE.SpriteMaterial({
      map: flareTex, color: c, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: rng.range(0.7, 1),
    });
    const s = new THREE.Sprite(mat);
    const u = rng.next() * 2 - 1;
    const th = rng.next() * Math.PI * 2;
    const r = rng.range(10000, 14000);
    const sq = Math.sqrt(1 - u * u);
    s.position.set(r * sq * Math.cos(th), r * u, r * sq * Math.sin(th));
    s.scale.setScalar(rng.range(80, 260));
    group.add(s);
  }

  // --- resident celestial bodies (factory-built) ---
  const homePlanet = createPlanet({});
  group.add(homePlanet.group);
  const moon = createPlanet({
    position: new THREE.Vector3(1200, 500, 3600), radius: 320, seed: 7,
    rings: false, palette: { a: 0x9aa0ab, b: 0x5c6068, c: 0xc9ccd2 },
  });
  group.add(moon.group);

  // --- distant traffic ---
  const traffic = [];
  const trafficMat = new THREE.MeshBasicMaterial({ color: 0xcfd8e6 });
  const trafficGlow = new THREE.MeshBasicMaterial({ color: 0x9fd8ff });
  for (let i = 0; i < 7; i++) {
    const ship = new THREE.Group();
    const len = rng.range(14, 40);
    const body = new THREE.Mesh(new THREE.BoxGeometry(len, len * 0.12, len * 0.16), trafficMat);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(len * 0.1, len * 0.09, len * 0.12), trafficGlow);
    engine.position.x = -len * 0.55;
    ship.add(body, engine);
    ship.position.set(rng.range(-3500, 3500), rng.range(-500, 700), rng.range(-2200, 2400));
    ship.userData.speed = rng.range(30, 90) * (rng.chance(0.5) ? 1 : -1);
    ship.rotation.y = ship.userData.speed > 0 ? 0 : Math.PI;
    group.add(ship);
    traffic.push(ship);
  }

  // --- near-field dust ---
  const dustCount = 350;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = rng.range(-600, 600);
    dustPos[i * 3 + 1] = rng.range(-250, 350);
    dustPos[i * 3 + 2] = rng.range(-400, 700);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x8899bb, size: 0.7, sizeAttenuation: true,
    transparent: true, opacity: 0.35, depthWrite: false,
  }));
  dust.position.set(0, 60, 200);
  group.add(dust);

  function update(dt, elapsed) {
    for (const ship of traffic) {
      ship.position.x += ship.userData.speed * dt;
      if (ship.position.x > 3800) ship.position.x = -3800;
      if (ship.position.x < -3800) ship.position.x = 3800;
    }
    dust.rotation.y = elapsed * 0.004;
    homePlanet.group.rotation.y = elapsed * 0.002;
  }

  return {
    group,
    starGroup,
    update,
    homePlanet,
    // quality hook: draw a fraction of each star shell
    setStarFraction(f) {
      for (const p of starMeshes) p.geometry.setDrawRange(0, Math.floor(p.userData.fullCount * f));
    },
    // Paint the Void hook
    applyPalette(p, scene_) {
      scene_.background.setHex(p.bg);
      for (const pts of starMeshes) pts.material.color.setHex(p.starTint);
      dust.material.color.setHex(p.starTint).multiplyScalar(0.6);
    },
    // void-jump hook: every jump nudges the starlight's hue — we moved
    driftStars(amount = 0.05) {
      for (const pts of starMeshes) {
        const hsl = {};
        pts.material.color.getHSL(hsl);
        pts.material.color.setHSL((hsl.h + amount) % 1, Math.min(0.5, hsl.s + 0.05), Math.max(0.75, hsl.l));
      }
    },
    // the Homeworld gate: a hot-edged plane sweeps the hull along x
    hyperspaceSweep({ span = 1700, height = 420, duration = 1.4, mini = false } = {}) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uEdge: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: /* glsl */`
          varying vec2 vUv;
          void main(){
            float edge = smoothstep(0.06, 0.0, abs(vUv.x - 0.5) * 2.0 - 0.9); // hot rim
            float body = smoothstep(1.0, 0.2, abs(vUv.x - 0.5) * 2.0) * 0.25;
            vec3 col = vec3(0.55, 0.85, 1.0) * (body + edge * 2.2);
            gl_FragColor = vec4(col, body + edge);
          }
        `,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(mini ? 60 : 140, height), mat);
      plane.rotation.y = Math.PI / 2;
      plane.position.set(-span / 2, height * 0.25, 0);
      group.add(plane);
      const state = { x: -span / 2 };
      gsap.to(state, {
        x: span / 2, duration, ease: 'power2.inOut',
        onUpdate() { plane.position.x = state.x; },
        onComplete() { group.remove(plane); mat.dispose(); plane.geometry.dispose(); },
      });
      return plane;
    },
  };
}
