import * as THREE from 'three';
import { makeRng } from './rng.js';

// The habitat block at the bow: x ∈ [10, 330], y ∈ [-25, 145], z ∈ [-95, 95].
// BOTH long faces (+Z and -Z) carry a giant chamfered-octagon viewport, so the
// park is see-through from either side. The −X / +X walls have doorways that
// connect to the walkable ship concourse (see interior.js). Interior floor y=0.
// Glass is a cheap fresnel shader — transmission would murder the frame budget.

export const HABITAT = {
  min: new THREE.Vector3(10, -25, -95),
  max: new THREE.Vector3(330, 145, 95),
  floorY: 0,
  ceilY: 130,
  wallT: 8,
  // viewport opening (wall-plane coords = world x/y)
  vp: { x0: 50, x1: 300, y0: 8, y1: 106, chamfer: 26 },
  // doorway opening in the X walls (z / y)
  door: { z0: -15, z1: 15, yTop: 30 },
};

function octagonShape({ x0, x1, y0, y1, chamfer: c }) {
  const s = new THREE.Shape();
  s.moveTo(x0 + c, y0);
  s.lineTo(x1 - c, y0);
  s.lineTo(x1, y0 + c);
  s.lineTo(x1, y1 - c);
  s.lineTo(x1 - c, y1);
  s.lineTo(x0 + c, y1);
  s.lineTo(x0, y1 - c);
  s.lineTo(x0, y0 + c);
  s.closePath();
  return s;
}

export function createHabitat(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const H = HABITAT;
  const rng = makeRng(808);

  const matShell = new THREE.MeshStandardMaterial({ color: 0xc8cdd4, roughness: 0.62, metalness: 0.28 });
  const matFrame = new THREE.MeshStandardMaterial({ color: 0x23282f, roughness: 0.7, metalness: 0.5 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0x8b94a0, roughness: 0.85, metalness: 0.05 });

  const glassMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 1.0 } },
    vertexShader: /* glsl */`
      varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float fres = pow(1.0 - abs(dot(viewDir, normalize(vNormalW))), 3.0);
        vec3 tint = mix(vec3(0.5, 0.72, 0.95), vec3(0.9, 0.97, 1.0), fres);
        float alpha = (0.035 + fres * 0.42) * uOpacity;
        gl_FragColor = vec4(tint, alpha);
      }
    `,
  });

  // --- both viewport walls (+Z outward, −Z outward) ---
  function buildViewportWall(sign) {
    // sign = +1 for the +Z wall, −1 for the −Z wall
    const wallShape = new THREE.Shape();
    wallShape.moveTo(H.min.x, H.min.y);
    wallShape.lineTo(H.max.x, H.min.y);
    wallShape.lineTo(H.max.x, H.max.y);
    wallShape.lineTo(H.min.x, H.max.y);
    wallShape.closePath();
    wallShape.holes.push(octagonShape(H.vp));

    const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: H.wallT, bevelEnabled: false });
    const wall = new THREE.Mesh(wallGeo, matShell);
    // extrude runs +Z from the shape plane; place the inner face at ±(max.z - wallT)
    wall.position.z = sign > 0 ? (H.max.z - H.wallT) : (H.min.z);
    wall.castShadow = true; wall.receiveShadow = true;
    group.add(wall);

    const frameShape = octagonShape({
      x0: H.vp.x0 - 7, x1: H.vp.x1 + 7, y0: H.vp.y0 - 7, y1: H.vp.y1 + 7,
      chamfer: H.vp.chamfer + 5,
    });
    frameShape.holes.push(octagonShape(H.vp));
    const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: H.wallT + 5, bevelEnabled: false });
    const frame = new THREE.Mesh(frameGeo, matFrame);
    frame.position.z = sign > 0 ? (H.max.z - H.wallT - 1) : (H.min.z - 4);
    frame.castShadow = true; frame.receiveShadow = true;
    group.add(frame);

    const glass = new THREE.Mesh(new THREE.ShapeGeometry(octagonShape(H.vp), 4), glassMat);
    glass.position.z = sign > 0 ? (H.max.z - H.wallT / 2) : (H.min.z + H.wallT / 2);
    glass.renderOrder = 50;
    group.add(glass);

    // greeble bands + crew windows around this viewport (exterior dressing)
    const bands = [
      { x0: 14, x1: 326, y0: 110, y1: 142 },
      { x0: 14, x1: 326, y0: -22, y1: 4 },
      { x0: 12, x1: 46, y0: -20, y1: 140 },
      { x0: 304, x1: 328, y0: -20, y1: 140 },
    ];
    const dummy = new THREE.Object3D();
    const outerZ = sign > 0 ? H.max.z : H.min.z;
    for (const [mat, count] of [[panelMat, 150], [panelDarkMat, 110]]) {
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, count);
      inst.castShadow = true;
      for (let i = 0; i < count; i++) {
        const b = rng.pick(bands);
        const sz = rng.range(0.5, 2.2);
        dummy.position.set(rng.range(b.x0, b.x1), rng.range(b.y0, b.y1), outerZ + sign * (sz / 2 - 0.1));
        dummy.scale.set(rng.range(4, 22), rng.range(3, 12), sz);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      group.add(inst);
    }
    // lit crew windows below the viewport
    const cw = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 1.2), crewWinMat, 90);
    let ci = 0;
    for (let row = 0; row < 2 && ci < 90; row++) {
      const y = -16 + row * 7;
      for (let px = 60; px < 300 && ci < 90; px += rng.range(4, 9)) {
        if (rng.chance(0.25)) continue;
        dummy.position.set(px, y, outerZ + sign * 0.15);
        dummy.rotation.set(0, sign > 0 ? 0 : Math.PI, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        cw.setMatrixAt(ci++, dummy.matrix);
      }
    }
    cw.count = ci;
    group.add(cw);
  }

  const panelMat = new THREE.MeshStandardMaterial({ color: 0xaab1ba, roughness: 0.62, metalness: 0.32 });
  const panelDarkMat = new THREE.MeshStandardMaterial({ color: 0x565e68, roughness: 0.75, metalness: 0.4 });
  const crewWinMat = new THREE.MeshBasicMaterial({});
  crewWinMat.color.setRGB(2.0, 1.6, 1.05);

  buildViewportWall(1);
  buildViewportWall(-1);

  // --- floor + ceiling slabs (full-width boxes) ---
  const box = (cx, cy, cz, sx, sy, sz, mat, name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(cx, cy, cz);
    m.castShadow = true; m.receiveShadow = true;
    if (name) m.name = name;
    group.add(m);
    return m;
  };
  const cxH = (H.min.x + H.max.x) / 2;
  const depth = H.max.z - H.min.z;
  box(cxH, (H.min.y + 0) / 2, 0, H.max.x - H.min.x, 25, depth, matShell);            // floor
  box(cxH, (H.ceilY + H.max.y) / 2, 0, H.max.x - H.min.x, H.max.y - H.ceilY, depth, matShell); // ceiling

  // --- X walls WITH doorways (jambs + lintel + under-floor) ---
  function buildXWall(xFace) {
    const cx2 = xFace + (xFace < cxH ? H.wallT / 2 : -H.wallT / 2);
    const D = H.door;
    // side jambs (full height) beside the doorway
    box(cx2, (H.min.y + H.max.y) / 2, (H.min.z + D.z0) / 2, H.wallT, H.max.y - H.min.y, D.z0 - H.min.z, matShell);
    box(cx2, (H.min.y + H.max.y) / 2, (H.max.z + D.z1) / 2, H.wallT, H.max.y - H.min.y, H.max.z - D.z1, matShell);
    // lintel above the doorway
    box(cx2, (D.yTop + H.max.y) / 2, 0, H.wallT, H.max.y - D.yTop, D.z1 - D.z0, matShell);
    // under-floor plug below the doorway
    box(cx2, (H.min.y + 0) / 2, 0, H.wallT, 0 - H.min.y, D.z1 - D.z0, matShell);
    // glowing doorway frame
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x8fd6ff });
    const fr = new THREE.Mesh(new THREE.BoxGeometry(H.wallT + 1, 0.5, D.z1 - D.z0 + 1), frameMat);
    fr.position.set(cx2, D.yTop, 0);
    group.add(fr);
  }
  buildXWall(H.min.x);
  buildXWall(H.max.x);

  // --- interior liner (side + ceiling only; both Z faces are glass now) ---
  const linerBoxes = [
    [H.min.x + H.wallT + 0.5, (0 + H.ceilY) / 2, 0, 1, H.ceilY, depth - 2 * H.wallT],
    [H.max.x - H.wallT - 0.5, (0 + H.ceilY) / 2, 0, 1, H.ceilY, depth - 2 * H.wallT],
    [cxH, H.ceilY - 0.5, 0, H.max.x - H.min.x - 2 * H.wallT, 1, depth - 2 * H.wallT],
  ];
  for (const [cx, cy, cz, sx, sy, sz] of linerBoxes) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), matInner);
    m.position.set(cx, cy, cz);
    m.receiveShadow = true;
    group.add(m);
  }

  // --- top-deck greebles (kept from before) ---
  {
    const dummy = new THREE.Object3D();
    for (const [mat, count] of [[panelMat, 180], [panelDarkMat, 120]]) {
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, count);
      inst.castShadow = true;
      for (let i = 0; i < count; i++) {
        const sy = rng.range(1, 5);
        dummy.position.set(rng.range(14, 326), H.max.y + sy / 2 - 0.1, rng.range(-92, 92));
        dummy.scale.set(rng.range(4, 24), sy, rng.range(4, 18));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      group.add(inst);
    }
  }

  // --- warm ceiling light strips (cross the roof; sell "bright inside") ---
  const stripMat = new THREE.MeshBasicMaterial({});
  stripMat.color.setRGB(1.9, 1.55, 1.05);
  const stripGeo = new THREE.BoxGeometry(250, 0.8, 3.2);
  for (let i = 0; i < 5; i++) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(cxH, H.ceilY - 1.6, -64 + i * 32);
    group.add(strip);
  }

  return { group, glassMat };
}
