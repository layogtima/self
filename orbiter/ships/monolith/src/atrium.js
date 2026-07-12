import * as THREE from 'three';
import { ATRIUM } from './config.js';
import { MATS, lathePortal, stemColumnGeometry, seedLampGeometry } from './orokin.js';
import { makeOctagonPiece } from './cells.js';
import { vineCascade } from './flora.js';
import { makeRng } from './rng.js';

// The Atrium — the seed the station grows from. Shell comes from the piece
// kit (starmap floor, mushroom-cap dome, gill ribs); this module adds the
// heart: the Wondergate, the ring pool with its eight bridges, stem columns
// wearing vine cascades, and the spore-lamp constellation.

export function createAtrium(scene) {
  const rng = makeRng(777);
  const piece = makeOctagonPiece(scene, { col: 0, row: 0, spec: ATRIUM, kind: 'atrium', floorSeed: 7 });
  const group = piece.group; // dressing lives in the piece's local space (0,0)

  // ── the Wondergate ──
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(20, 23, 2.2, 8, 1, false, Math.PI / 2 - Math.PI / 8), MATS.porcelainDark);
  plinth.position.y = 1.1;
  plinth.receiveShadow = true;
  group.add(plinth);
  const gate = lathePortal(16);
  gate.position.y = 20;
  group.add(gate);

  // ── ring pool + eight bridges ──
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float d = length(p);
        float w = sin(d * 70.0 - uTime * 1.3) * 0.5 + 0.5;
        float w2 = sin(dot(p, vec2(38.0, 29.0)) + uTime * 0.9) * 0.5 + 0.5;
        gl_FragColor = vec4(mix(vec3(0.12, 0.32, 0.3), vec3(0.35, 0.62, 0.56), w * 0.5 + w2 * 0.3), 0.8);
      }
    `,
  });
  const pool = new THREE.Mesh(new THREE.RingGeometry(28, 46, 8, 1, Math.PI / 2 - Math.PI / 8), waterMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.4;
  pool.renderOrder = 20;
  group.add(pool);
  const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(47.5, 48.5, 1.4, 8, 1, true, Math.PI / 2 - Math.PI / 8), MATS.verdigris);
  poolRim.position.y = 0.7;
  group.add(poolRim);

  const bridges = new THREE.InstancedMesh(new THREE.BoxGeometry(7, 1, 22), MATS.porcelainDark, 8);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    dummy.position.set(Math.cos(a) * 37, 0.85, Math.sin(a) * 37);
    dummy.rotation.set(0, Math.atan2(Math.cos(a), Math.sin(a)), 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bridges.setMatrixAt(i, dummy.matrix);
  }
  bridges.receiveShadow = true;
  group.add(bridges);

  // ── stem columns (mushroom profile) with vine cascades ──
  const columns = new THREE.InstancedMesh(stemColumnGeometry(), MATS.porcelain, 8);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    dummy.position.set(Math.cos(a) * 62, 0, Math.sin(a) * 62);
    dummy.scale.set(6, ATRIUM.h - 8, 6);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    columns.setMatrixAt(i, dummy.matrix);
  }
  columns.castShadow = true;
  group.add(columns);
  for (let i = 0; i < 8; i += 2) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    group.add(vineCascade(
      new THREE.Vector3(Math.cos(a) * 62, ATRIUM.h * 0.62, Math.sin(a) * 62),
      { drop: ATRIUM.h * 0.4, sway: 7, seed: 90 + i }
    ));
  }

  // ── spore lamps ──
  const N_LAMPS = 30;
  const lamps = new THREE.InstancedMesh(seedLampGeometry(), MATS.glowWarm, N_LAMPS);
  for (let i = 0; i < N_LAMPS; i++) {
    const a = rng.next() * Math.PI * 2;
    const r = rng.range(20, 62);
    dummy.position.set(Math.cos(a) * r, rng.range(24, 76), Math.sin(a) * r);
    dummy.scale.setScalar(rng.range(0.9, 2));
    dummy.rotation.set(Math.PI, 0, 0);
    dummy.updateMatrix();
    lamps.setMatrixAt(i, dummy.matrix);
  }
  group.add(lamps);

  // ── lights ──
  for (const [lx, lz] of [[-34, -34], [34, 34]]) {
    const p = new THREE.PointLight(0xffdfb0, 1300, 220, 1.5);
    p.position.set(lx, ATRIUM.h - 20, lz);
    group.add(p);
  }
  const gateGlow = new THREE.PointLight(0x9fe8e0, 550, 110, 1.8);
  gateGlow.position.set(0, 22, 0);
  group.add(gateGlow);

  const obstacles = [{ x: 0, z: 0, r: 24 }];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    obstacles.push({ x: Math.cos(a) * 62, z: Math.sin(a) * 62, r: 6.5 });
  }

  function update(dt, elapsed) {
    waterMat.uniforms.uTime.value = elapsed;
  }

  return {
    piece, group, update, obstacles,
    spawn: new THREE.Vector3(0, 1.75, 52),
    spawnLook: new THREE.Vector3(0, 18, 0),
    gatePosition: new THREE.Vector3(0, 20, 0),
  };
}
