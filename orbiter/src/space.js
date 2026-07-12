import * as THREE from 'three';
import { makeRng } from './rng.js';

// Deep space backdrop: layered starfield shells, a ringed gas giant with a
// fresnel atmosphere rim, a moon visible through the park viewport, distant
// traffic ships, and near-field dust motes for parallax scale.

export function createSpace(scene) {
  const rng = makeRng(1969);
  const group = new THREE.Group();
  scene.add(group);

  // --- starfield: three depth shells, brighter/larger up close ---
  const shells = [
    { count: 2000, radius: 14000, size: 9, brightness: 1.0 },
    { count: 1500, radius: 9000, size: 6, brightness: 0.65 },
    { count: 1000, radius: 5500, size: 4, brightness: 0.4 },
  ];
  for (const shell of shells) {
    const pos = new Float32Array(shell.count * 3);
    const col = new Float32Array(shell.count * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < shell.count; i++) {
      // uniform on sphere
      const u = rng.next() * 2 - 1;
      const theta = rng.next() * Math.PI * 2;
      const r = shell.radius * (0.85 + rng.next() * 0.3);
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(theta);
      // subtle temperature variation, a few hot blue and amber stars
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
    group.add(points);
  }

  // --- gas giant, far off the stern quarter so exterior shots frame it ---
  const planetGroup = new THREE.Group();
  planetGroup.position.set(-1200, 1100, -5200);
  group.add(planetGroup);

  const planetMat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: new THREE.Vector3(0.55, 0.5, 0.67).normalize() },
      uColorA: { value: new THREE.Color(0x6f8bb8) },
      uColorB: { value: new THREE.Color(0x2c3d5e) },
      uColorC: { value: new THREE.Color(0xc9d6e8) },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vLocal;
      // cheap banded gas giant with wobble
      void main() {
        float lat = vLocal.y * 0.004;
        float wob = sin(vLocal.x * 0.006 + vLocal.z * 0.004) * 0.35;
        float bands = sin(lat * 14.0 + wob) * 0.5 + 0.5;
        float bands2 = sin(lat * 31.0 - wob * 2.0) * 0.5 + 0.5;
        vec3 base = mix(uColorB, uColorA, bands);
        base = mix(base, uColorC, bands2 * 0.18);
        float diff = clamp(dot(normalize(vNormalW), uSunDir), 0.0, 1.0);
        diff = pow(diff, 0.8);
        // fresnel atmosphere rim
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fres = pow(1.0 - clamp(dot(viewDir, normalize(vNormalW)), 0.0, 1.0), 2.6);
        vec3 atmo = vec3(0.5, 0.72, 1.0) * fres * (0.25 + diff * 1.15);
        vec3 col = base * (0.03 + diff * 0.9) + atmo;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1350, 40, 28), planetMat);
  planetGroup.add(planet);

  // rings: a proper Saturn-style disc encircling the planet's equator, tilted
  // ~26° off edge-on so it reads unmistakably as rings, with a Cassini gap.
  const ringInner = 1650, ringOuter = 3050;
  const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 220, 2);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: {
      uInner: { value: ringInner }, uOuter: { value: ringOuter },
      uSunDir: { value: new THREE.Vector3(0.55, 0.5, 0.67).normalize() },
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
      varying vec2 vXY; varying vec3 vNormalW;
      void main() {
        float r = length(vXY);
        float t = (r - uInner) / (uOuter - uInner);
        // fine ring striations + a couple of broad density bands
        float fine = 0.5 + 0.5 * sin(t * 130.0);
        float broad = 0.6 + 0.4 * sin(t * 7.0 + 1.0);
        float dens = mix(fine, 1.0, 0.35) * broad;
        // Cassini gap around t≈0.5
        float gap = smoothstep(0.46, 0.49, t) * (1.0 - smoothstep(0.51, 0.54, t));
        dens *= 1.0 - gap * 0.85;
        float edge = smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.95, 1.0, t));
        float lit = 0.35 + 0.65 * clamp(abs(dot(normalize(vNormalW), uSunDir)), 0.0, 1.0);
        vec3 warm = vec3(0.86, 0.78, 0.62);
        vec3 pale = vec3(0.72, 0.75, 0.82);
        vec3 col = mix(pale, warm, broad) * lit;
        gl_FragColor = vec4(col, dens * edge * 0.62);
      }
    `,
  });
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = -Math.PI / 2 + 0.46; // lay flat around the equator, then tilt up ~26°
  rings.rotation.z = 0.15;
  planetGroup.add(rings);

  // --- moon: sits off the +Z bow quarter, visible through the viewport ---
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0ab, roughness: 1.0, metalness: 0.0,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(320, 48, 32), moonMat);
  moon.position.set(1200, 500, 3600);
  group.add(moon);

  // --- distant traffic: tiny elongated ships gliding on lanes ---
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
    const laneY = rng.range(-500, 700);
    const laneZ = rng.range(-2200, 2400);
    ship.position.set(rng.range(-3500, 3500), laneY, laneZ);
    ship.userData.speed = rng.range(30, 90) * (rng.chance(0.5) ? 1 : -1);
    ship.rotation.y = ship.userData.speed > 0 ? 0 : Math.PI;
    group.add(ship);
    traffic.push(ship);
  }

  // --- near-field dust motes for parallax; follows camera loosely ---
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
    planetGroup.rotation.y = elapsed * 0.002;
  }

  return { group, update, sunDirUniform: planetMat.uniforms.uSunDir };
}
