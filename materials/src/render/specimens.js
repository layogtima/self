// Procedural specimens. Every chunk of every material is generated here at load time —
// no textures are downloaded, no models are fetched.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm, rng } from './noise.js';

const geometryCache = new Map();
const materialCache = new Map();
const textureCache = new Map();

/* ---- canvas textures ------------------------------------------------ */

function makeTexture(key, size, draw, { srgb = false, repeat = 1 } = {}) {
  // The colour space and repeat are part of the identity: a roughness map decoded as
  // sRGB reads far darker than it should, so it cannot share a cache slot with the map.
  const cacheKey = `${key}|${srgb ? 'srgb' : 'linear'}|${repeat}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, tex);
  return tex;
}

const grey = (v) => `rgb(${(v * 255) | 0},${(v * 255) | 0},${(v * 255) | 0})`;

function drawSpeckle(ctx, size) {
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = 0.62 + fbm(x / 14, y / 14, 3.1, 4) * 0.9 + fbm(x / 3.5, y / 3.5, 9.7, 2) * 0.35;
      const v = Math.max(0, Math.min(1, n)) * 255;
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const rand = rng(4242);
  for (let i = 0; i < 700; i++) {
    const r = 0.5 + rand() * 2.4;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrain(ctx, size) {
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wobble = fbm(x / 40, y / 90, 1.7, 3) * 1.3;
      const ring = Math.abs(((y / size) * 11 + wobble) % 1 - 0.5) * 2;
      const streak = fbm(x / 2.2, y / 55, 6.3, 2) * 0.16;
      const v = Math.max(0, Math.min(1, 0.55 + ring * 0.42 + streak));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawEndGrain(ctx, size) {
  const cx = size * 0.5, cy = size * 0.5;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy) / size;
      const ring = Math.abs(((d * 22 + fbm(x / 30, y / 30, 5.5, 3) * 1.2) % 1) - 0.5) * 2;
      const v = Math.max(0, Math.min(1, 0.5 + ring * 0.45));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawWeave(ctx, size) {
  const tow = size / 8;
  ctx.fillStyle = grey(0.12);
  ctx.fillRect(0, 0, size, size);
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      // 2x2 twill: whether the warp or the weft is on top
      const warpOnTop = ((tx + ty) % 4) < 2;
      const x = tx * tow, y = ty * tow;
      const g = ctx.createLinearGradient(x, y, warpOnTop ? x : x + tow, warpOnTop ? y + tow : y);
      g.addColorStop(0, grey(0.16));
      g.addColorStop(0.5, grey(0.55));
      g.addColorStop(1, grey(0.16));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, tow, tow);
    }
  }
}

function drawBrushed(ctx, size) {
  ctx.fillStyle = grey(0.42);
  ctx.fillRect(0, 0, size, size);
  const rand = rng(77);
  for (let i = 0; i < size * 5; i++) {
    const y = rand() * size;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
}

function drawFibre(ctx, size) {
  ctx.fillStyle = grey(0.7);
  ctx.fillRect(0, 0, size, size);
  const rand = rng(1234);
  for (let i = 0; i < 900; i++) {
    const x = rand() * size, y = rand() * size;
    const a = rand() * Math.PI * 2, len = 6 + rand() * 26;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.6 + rand() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}

const TEX = {
  speckle: () => makeTexture('speckle', 256, drawSpeckle, { srgb: true }),
  speckleRough: () => makeTexture('speckle', 256, drawSpeckle),
  grain: () => makeTexture('grain', 512, drawGrain, { srgb: true }),
  endGrain: () => makeTexture('endGrain', 512, drawEndGrain, { srgb: true }),
  weave: () => makeTexture('weave', 256, drawWeave, { srgb: true, repeat: 3 }),
  weaveRough: () => makeTexture('weave', 256, drawWeave, { repeat: 3 }),
  brushed: () => makeTexture('brushed', 256, drawBrushed),
  fibre: () => makeTexture('fibre', 256, drawFibre, { srgb: true }),
  fibreRough: () => makeTexture('fibre', 256, drawFibre),
};

/* ---- geometry ------------------------------------------------------- */

/** An irregular lump: an icosahedron pushed around by noise. */
function chunkGeometry(seed, detail, silhouette = 0.3, micro = 0.05) {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, detail));
  const pos = geo.attributes.position;
  const off = seed * 17.3;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const scale =
      1 +
      silhouette * fbm(v.x * 1.3 + off, v.y * 1.3 + off, v.z * 1.3 + off, 3) +
      micro * fbm(v.x * 7 + off, v.y * 7 + off, v.z * 7 + off, 2);
    v.multiplyScalar(scale);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Scatter copies of one shape into a shallow heap: grain, powder, pellets, bubbles. */
function scatter(seed, count, make, { spread = 1.05, flatten = 0.42, jitter = 0.55 } = {}) {
  const rand = rng(seed * 977 + 13);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = make(i, rand);
    // Phyllotaxis keeps the heap even, the jitter stops it looking machined.
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.5) / count) * spread;
    const m = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28))
      .setPosition(
        Math.cos(a) * r + (rand() - 0.5) * jitter * 0.35,
        (0.9 - r * 0.75) * flatten + (rand() - 0.5) * jitter * 0.3,
        Math.sin(a) * r + (rand() - 0.5) * jitter * 0.35
      );
    parts.push(g.applyMatrix4(m));
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose?.());
  merged.computeVertexNormals();
  return merged;
}

/** A sphere squeezed and tapered along Y: eggs, droplets, seeds. */
function taperedSphere(seg, { top = 1, bottom = 1, point = 0 }) {
  const geo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + 1) / 2; // 0 at the bottom, 1 at the top
    const k = bottom + (top - bottom) * t;
    const pinch = point ? 1 - point * Math.pow(Math.max(0, t), 3) : 1;
    pos.setXYZ(i, v.x * k * pinch, v.y, v.z * k * pinch);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A hexagonal crystal prism with a pointed cap. */
function prism(sides = 6, height = 1.5, radius = 0.55, tip = 0.5) {
  const body = new THREE.CylinderGeometry(radius, radius, height, sides);
  const cap = new THREE.ConeGeometry(radius, tip, sides).translate(0, height / 2 + tip / 2, 0);
  const base = new THREE.ConeGeometry(radius, tip * 0.6, sides).rotateX(Math.PI).translate(0, -height / 2 - tip * 0.3, 0);
  return mergeGeometries([body, cap, base], false);
}

function buildGeometry(material, detail) {
  const { recipe, shape, seed } = material.specimen;
  const s = shape || DEFAULT_SHAPE[recipe] || 'nugget';
  const lo = Math.max(0, detail - 2); // heaps and clusters carry many parts, so keep each cheap
  switch (s) {
    // ---- solid stock -------------------------------------------------
    case 'ingot':
      return new RoundedBoxGeometry(1.5, 0.75, 0.95, 4, 0.09);
    case 'block':
      return new RoundedBoxGeometry(1.6, 0.8, 0.8, 2, 0.03);
    case 'plank':
      return new RoundedBoxGeometry(2.0, 0.22, 0.85, 2, 0.02);
    case 'slab':
      return new RoundedBoxGeometry(1.7, 0.4, 1.15, 3, 0.08);
    case 'sheet':
      return new RoundedBoxGeometry(1.7, 0.09, 1.1, 3, 0.04);
    case 'pane':
      return new RoundedBoxGeometry(1.5, 0.07, 1.5, 2, 0.02);
    case 'stack':
      return new RoundedBoxGeometry(1.4, 0.5, 1.0, 2, 0.02);
    case 'flake':
      return mergeVertices(new THREE.IcosahedronGeometry(1, 1)).scale(1.25, 0.1, 1.25);

    // ---- round stock -------------------------------------------------
    case 'torus':
      return new THREE.TorusGeometry(0.78, 0.3, 20, Math.max(36, detail * 12));
    case 'coil':
      return new THREE.TorusKnotGeometry(0.66, 0.19, 96, 12, 2, 3);
    case 'skein':
      return new THREE.TorusKnotGeometry(0.62, 0.24, 110, 14, 3, 5);
    case 'wafer':
      return new THREE.CylinderGeometry(0.95, 0.95, 0.07, 48);
    case 'plate':
      return new THREE.CylinderGeometry(1.05, 1.05, 0.16, 40);
    case 'log':
      return new THREE.CylinderGeometry(0.6, 0.6, 1.7, 32);
    case 'roll':
      return new THREE.CylinderGeometry(0.62, 0.62, 1.4, 40).rotateZ(Math.PI / 2);
    case 'rod':
      return new THREE.CylinderGeometry(0.22, 0.22, 1.9, 20);

    // ---- crystals ----------------------------------------------------
    case 'prism':
      return prism(6, 1.4, 0.5, 0.5);
    case 'cube':
      return new RoundedBoxGeometry(1.1, 1.1, 1.1, 2, 0.04);
    case 'cluster':
      return scatter(seed, 5, (i, rand) => prism(6, 0.8 + rand() * 0.7, 0.24 + rand() * 0.14, 0.3), {
        spread: 0.62,
        flatten: 0.5,
        jitter: 0.5,
      });
    case 'facet':
      return chunkGeometry(seed, 1, 0.34, 0);

    // ---- heaps and scatters -----------------------------------------
    case 'grain':
      return scatter(seed, 26, (i, rand) => taperedSphere(8 + lo * 2, { top: 0.62, bottom: 0.78 })
        .scale(0.2 + rand() * 0.07, 0.3 + rand() * 0.09, 0.2 + rand() * 0.07));
    case 'powder':
      return scatter(seed, 30, (i, rand) => new THREE.IcosahedronGeometry(0.13 + rand() * 0.07, lo ? 1 : 0), {
        spread: 1.0,
        flatten: 0.34,
      });
    case 'pellet':
      return scatter(seed, 15, (i, rand) => new THREE.CapsuleGeometry(0.19, 0.16, 3, 10 + lo * 4)
        .scale(1, 0.85 + rand() * 0.3, 1), { spread: 0.95, flatten: 0.46 });
    case 'gravel':
      return scatter(seed, 17, (i, rand) => chunkGeometry(seed + i * 3.1, Math.max(1, detail - 1), 0.34, 0.06)
        .scale(0.24 + rand() * 0.16, 0.2 + rand() * 0.12, 0.24 + rand() * 0.16), { spread: 1.0, flatten: 0.4 });
    case 'bubbles':
      return scatter(seed, 9, (i, rand) => new THREE.SphereGeometry(0.24 + rand() * 0.2, 18, 14), {
        spread: 0.95,
        flatten: 0.85,
        jitter: 0.9,
      });

    // ---- soft things -------------------------------------------------
    case 'egg':
      return taperedSphere(30, { top: 0.78, bottom: 0.92, point: 0.28 }).scale(0.78, 1.15, 0.78);
    case 'droplet':
      return taperedSphere(30, { top: 0.5, bottom: 1.0, point: 0.85 }).scale(0.92, 1.1, 0.92);
    case 'tuft':
      return chunkGeometry(seed, Math.min(4, detail + 1), 0.22, 0.3);
    case 'bubble':
      return new THREE.SphereGeometry(1, 32, 24);

    default:
      return chunkGeometry(seed, detail, recipe === 'fibre' ? 0.17 : 0.32, recipe === 'fibre' ? 0.12 : detail >= 4 ? 0.075 : 0.05);
  }
}

const DEFAULT_SHAPE = {
  metal: 'nugget',
  glass: 'pane',
  stone: 'nugget',
  ceramic: 'plate',
  wood: 'log',
  paper: 'stack',
  polymer: 'pellet',
  rubber: 'nugget',
  carbon: 'sheet',
  fibre: 'tuft',
  crystal: 'prism',
  semiconductor: 'wafer',
  gas: 'bubbles',
  liquid: 'droplet',
};

/* ---- materials ------------------------------------------------------ */

function buildMaterial(m) {
  const { recipe, color, params = {} } = m.specimen;
  const base = { color: new THREE.Color(color), envMapIntensity: 1.1 };

  const make = (extra) => new THREE.MeshPhysicalMaterial({ ...base, ...extra, ...numericOverrides(params) });

  switch (recipe) {
    case 'metal':
      return make({
        metalness: 1,
        roughness: params.roughness ?? 0.4,
        roughnessMap: params.brushed ? TEX.brushed() : null,
      });
    // Real refraction (three's `transmission`) costs an extra full render pass per material
    // per frame. At these sizes a polished transparent surface with strong reflections is
    // indistinguishable, so `specimen.params.translucency` drives plain opacity instead.
    case 'glass':
      return make({
        metalness: 0,
        roughness: 0.06,
        transparent: true,
        opacity: 0.62,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        ior: 1.5,
        envMapIntensity: 2.4,
        flatShading: true,
      });
    case 'stone':
      return make({
        metalness: params.metalness ?? 0,
        roughness: params.roughness ?? 0.95,
        map: TEX.speckle(),
        roughnessMap: TEX.speckleRough(),
        bumpMap: TEX.speckleRough(),
        bumpScale: 0.03,
      });
    case 'ceramic':
      return make({ metalness: 0, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.15 });
    case 'wood':
      return [
        make({ metalness: 0, roughness: 0.72, map: TEX.grain(), sheen: 0.2 }),
        make({ metalness: 0, roughness: 0.8, map: TEX.endGrain() }),
        make({ metalness: 0, roughness: 0.8, map: TEX.endGrain() }),
      ];
    case 'paper':
      return make({ metalness: 0, roughness: 0.92, map: TEX.fibre(), sheen: 0.3 });
    case 'polymer':
      return make({
        metalness: 0,
        roughness: params.translucency ? 0.12 : 0.38,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        transparent: !!params.translucency,
        opacity: params.translucency ? 0.8 : 1,
        ior: 1.45,
      });
    case 'rubber':
      return make({ metalness: 0, roughness: params.roughness ?? 0.85, sheen: 0.35, sheenColor: new THREE.Color('#555') });
    case 'carbon':
      return make({
        metalness: 0.15,
        roughness: 0.35,
        map: TEX.weave(),
        roughnessMap: TEX.weaveRough(),
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: params.iridescence ?? 0,
        iridescenceIOR: 1.9,
      });
    case 'fibre':
      return make({
        metalness: 0,
        roughness: 1,
        map: TEX.fibre(),
        sheen: 1,
        sheenRoughness: 0.85,
        sheenColor: new THREE.Color('#ffffff'),
      });
    case 'crystal': {
      const t = params.translucency ?? 0.4;
      return make({
        metalness: params.metalness ?? 0,
        roughness: params.roughness ?? 0.22,
        ior: 1.55,
        transparent: t > 0,
        opacity: t > 0 ? 1 - t * 0.55 : 1,
        envMapIntensity: 1.6,
        flatShading: true,
      });
    }
    case 'semiconductor':
      return make({ metalness: 0.85, roughness: 0.14, iridescence: 0.65, iridescenceIOR: 1.8 });
    // On a dark backdrop a nearly-transparent sphere disappears; the rim highlight is the
    // only thing that reads, so lean hard on reflections.
    case 'gas':
      return make({ metalness: 0, roughness: 0.02, transparent: true, opacity: 0.45, clearcoat: 1, clearcoatRoughness: 0, ior: 1.08, envMapIntensity: 3.2 });
    case 'liquid':
      return make({ metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 });
    default:
      return make({ roughness: 0.6 });
  }
}

// Only let the data override things that are safe to override.
function numericOverrides(params) {
  const out = {};
  for (const key of ['roughness', 'metalness', 'clearcoat', 'iridescence']) {
    if (typeof params[key] === 'number') out[key] = params[key];
  }
  return out;
}

/* ---- public API ----------------------------------------------------- */

/**
 * A mesh for one material. `quality` picks the tessellation:
 * 'card' for the grid and hero, 'detail' for the panel.
 */
// Flat forms present far less area than a lump of the same bounding radius, so they get a
// little extra size to sit at the same visual weight in the frame.
const FLAT_SHAPES = { pane: 1.3, sheet: 1.28, plank: 1.2, slab: 1.18, flake: 1.35, wafer: 1.2, plate: 1.18 };

/** Normalise to a bounding radius of 1 so every specimen fills its frame the same way. */
function normalise(geo, shape) {
  geo.computeBoundingSphere();
  const r = geo.boundingSphere?.radius;
  if (r && Number.isFinite(r) && r > 0) {
    geo.scale(1 / r, 1 / r, 1 / r);
    const boost = FLAT_SHAPES[shape];
    if (boost) geo.scale(boost, boost, boost);
    geo.computeBoundingSphere();
  }
  return geo;
}

export function makeMesh(material, quality = 'card') {
  const detail = quality === 'detail' ? 4 : 2;
  const gkey = `${material.id}:${detail}`;
  if (!geometryCache.has(gkey)) {
    geometryCache.set(gkey, normalise(buildGeometry(material, detail), material.specimen.shape));
  }
  if (!materialCache.has(material.id)) materialCache.set(material.id, buildMaterial(material));

  const mesh = new THREE.Mesh(geometryCache.get(gkey), materialCache.get(material.id));
  mesh.rotation.set(0.35, material.specimen.seed * 0.7, 0.12);
  mesh.userData.seed = material.specimen.seed;
  return mesh;
}

export function disposeAll() {
  for (const g of geometryCache.values()) g.dispose();
  for (const m of materialCache.values()) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
  for (const t of textureCache.values()) t.dispose();
  geometryCache.clear();
  materialCache.clear();
  textureCache.clear();
}
