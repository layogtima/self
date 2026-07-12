// The voxel world — a cubic material grid meshed with SURFACE NETS, so the blocky
// data becomes smooth, flowing terrain (the Oort Online / Boundless look) instead
// of hard cubes or prisms. World coords == cell coords. The grid holds real strata
// + karst caves + mineral veins; the mesher reconstructs one smooth, vertex-
// coloured surface with cheap baked AO. Digging edits the grid and remeshes.

import * as THREE from 'three';

export const W = 56, D = 56, H = 30;           // x, y, z cells
export const T = { AIR: 0, GRASS: 1, SOIL: 2, STONE: 3, DEEP: 4, MINERAL: 5 };

// ---- deterministic noise -------------------------------------------------------
export function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = t => t * t * (3 - 2 * t);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * sm(xf) + (c - a) * sm(yf) + (a - b - c + d) * sm(xf) * sm(yf);
}
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const u = sm(xf), v = sm(yf), w = sm(zf), c = (a, b, cc) => hash3(xi + a, yi + b, zi + cc);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

// ---- bright, vibrant palette (Boundless-ish: lush + saturated, not dreary) ------
const C = {
  grassLow: new THREE.Color('#4ca83a'),   // lush valley
  grassHigh: new THREE.Color('#9bd85a'),  // bright hilltop
  soil: new THREE.Color('#8a5a30'),       // warm earth
  stone: new THREE.Color('#bcb39a'),      // light limestone
  deep: new THREE.Color('#5b6272'),       // cool slate (brighter than before)
};
const MINERALS = ['#eef5fb', '#a875e6', '#f2c14e', '#2fbf8f'].map(h => new THREE.Color(h));  // quartz, amethyst, pyrite, malachite

// ---- Surface Nets (naive; after S. Gustavson / M. Lysenko, MIT) ----------------
const CUBE_EDGES = new Int32Array(24);
const EDGE_TABLE = new Int32Array(256);
(function () {
  let k = 0;
  for (let i = 0; i < 8; ++i) for (let j = 1; j <= 4; j <<= 1) { const p = i ^ j; if (i <= p) { CUBE_EDGES[k++] = i; CUBE_EDGES[k++] = p; } }
  for (let i = 0; i < 256; ++i) {
    let em = 0;
    for (let j = 0; j < 24; j += 2) { const a = !!(i & (1 << CUBE_EDGES[j])), b = !!(i & (1 << CUBE_EDGES[j + 1])); em |= a !== b ? (1 << (j >> 1)) : 0; }
    EDGE_TABLE[i] = em;
  }
})();

function surfaceNets(data, dims) {
  const vertices = [], faces = [];
  const R = [1, dims[0] + 1, (dims[0] + 1) * (dims[1] + 1)];
  const grid = new Float32Array(8);
  let buf_no = 1, n = 0;
  const buffer = new Int32Array(R[2] * 2);
  const x = [0, 0, 0];
  for (x[2] = 0; x[2] < dims[2] - 1; ++x[2], n += dims[0], buf_no ^= 1, R[2] = -R[2]) {
    let m = 1 + (dims[0] + 1) * (1 + buf_no * (dims[1] + 1));
    for (x[1] = 0; x[1] < dims[1] - 1; ++x[1], ++n, m += 2)
      for (x[0] = 0; x[0] < dims[0] - 1; ++x[0], ++n, ++m) {
        let mask = 0, g = 0, idx = n;
        for (let k = 0; k < 2; ++k, idx += dims[0] * (dims[1] - 2))
          for (let j = 0; j < 2; ++j, idx += dims[0] - 2)
            for (let i = 0; i < 2; ++i, ++g, ++idx) { const p = data[idx]; grid[g] = p; mask |= (p < 0) ? (1 << g) : 0; }
        if (mask === 0 || mask === 0xff) continue;
        const edge_mask = EDGE_TABLE[mask], v = [0, 0, 0];
        let e_count = 0;
        for (let i = 0; i < 12; ++i) {
          if (!(edge_mask & (1 << i))) continue;
          ++e_count;
          const e0 = CUBE_EDGES[i << 1], e1 = CUBE_EDGES[(i << 1) + 1];
          const g0 = grid[e0], g1 = grid[e1]; let t = g0 - g1;
          if (Math.abs(t) > 1e-6) t = g0 / t; else continue;
          for (let j = 0, k = 1; j < 3; ++j, k <<= 1) { const a = e0 & k, b = e1 & k; if (a !== b) v[j] += a ? 1 - t : t; else v[j] += a ? 1 : 0; }
        }
        const s = 1 / e_count;
        for (let i = 0; i < 3; ++i) v[i] = x[i] + s * v[i];
        buffer[m] = vertices.length;
        vertices.push([v[0], v[1], v[2]]);
        for (let i = 0; i < 3; ++i) {
          if (!(edge_mask & (1 << i))) continue;
          const iu = (i + 1) % 3, iv = (i + 2) % 3;
          if (x[iu] === 0 || x[iv] === 0) continue;
          const du = R[iu], dv = R[iv];
          if (mask & 1) faces.push([buffer[m], buffer[m - du], buffer[m - du - dv], buffer[m - dv]]);
          else faces.push([buffer[m], buffer[m - dv], buffer[m - du - dv], buffer[m - du]]);
        }
      }
  }
  return { vertices, faces };
}

export function makeWorld(scene) {
  const grid = new Uint8Array(W * H * D);
  const surf = new Int16Array(W * D);
  const idx = (x, y, z) => (y * D + z) * W + x;
  const sidx = (x, z) => x * D + z;
  const matAt = (x, y, z) => (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) ? T.AIR : grid[idx(x, y, z)];

  // pass 1 — strata (rolling hills)
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const h = Math.round(15 + (noise2(x / 11, z / 11) - 0.5) * 10 + (noise2(x / 26 + 40, z / 26) - 0.5) * 6);
    const top = Math.max(5, Math.min(H - 5, h));
    surf[sidx(x, z)] = top;
    for (let y = 0; y <= top; y++) {
      let t = T.DEEP;
      if (y === top) t = T.GRASS;
      else if (y >= top - 3) t = T.SOIL;
      else if (y >= top - 10) t = T.STONE;
      grid[idx(x, y, z)] = t;
    }
  }
  // pass 2 — karst caves (keep a crust + floor)
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = surf[sidx(x, z)];
    for (let y = 2; y < top - 3; y++) {
      if (grid[idx(x, y, z)] === T.AIR) continue;
      const warp = noise3(x * 0.08, y * 0.08, z * 0.08) - 0.5;
      const tunnel = Math.abs(noise3(x * 0.06 + warp, y * 0.10, z * 0.06) - 0.5);
      const cavern = noise3(x * 0.05 + 11, y * 0.09 + 5, z * 0.05 + 7);
      if (tunnel < 0.05 || cavern > 0.72) grid[idx(x, y, z)] = T.AIR;
    }
  }
  // pass 3 — mineral veins on cave walls
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = surf[sidx(x, z)];
    for (let y = 1; y < top - 4; y++) {
      const t = grid[idx(x, y, z)];
      if (t !== T.STONE && t !== T.DEEP) continue;
      let wall = matAt(x, y + 1, z) === T.AIR || matAt(x, y - 1, z) === T.AIR
        || matAt(x + 1, y, z) === T.AIR || matAt(x - 1, y, z) === T.AIR || matAt(x, y, z + 1) === T.AIR || matAt(x, y, z - 1) === T.AIR;
      if (wall && hash3(x * 1.3, y * 1.7, z * 1.1) > 0.88) grid[idx(x, y, z)] = T.MINERAL;
    }
  }

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.0, flatShading: false });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.castShadow = true; mesh.receiveShadow = true;
  scene.add(mesh);

  // colour + AO for a surface-nets vertex sitting at world (vx,vy,vz)
  const tmp = new THREE.Color();
  function vertColor(vx, vy, vz, out) {
    const bx = Math.floor(vx), by = Math.floor(vy), bz = Math.floor(vz);
    let material = 0, topY = -1, mineral = false, solid = 0;
    for (let dx = -1; dx <= 0; dx++) for (let dy = -1; dy <= 0; dy++) for (let dz = -1; dz <= 0; dz++) {
      const mm = matAt(bx + dx, by + dy, bz + dz);
      if (mm === T.AIR) continue;
      solid++;
      if (mm === T.MINERAL) mineral = true;
      if (by + dy > topY) { topY = by + dy; material = mm; }   // topmost solid = the surface material
    }
    const t = mineral ? T.MINERAL : (material || T.SOIL);
    if (t === T.GRASS) { const hn = THREE.MathUtils.clamp((by - 8) / 16, 0, 1); tmp.copy(C.grassLow).lerp(C.grassHigh, hn * 0.7 + noise2(bx / 16 + 5, bz / 16 + 2) * 0.3); }
    else if (t === T.SOIL) tmp.copy(C.soil);
    else if (t === T.STONE) tmp.copy(C.stone);
    else if (t === T.DEEP) tmp.copy(C.deep);
    else tmp.copy(MINERALS[(hash2(bx * 4.1, bz * 7.3) * MINERALS.length) | 0]);
    // wider-radius occupancy → soft AO in crevices & caves
    let occ = 0, tot = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { tot++; if (matAt(bx + dx, by + dy, bz + dz) !== T.AIR) occ++; }
    const ao = THREE.MathUtils.clamp(1.12 - (occ / tot) * 0.7, 0.45, 1.0);
    const jit = 0.94 + hash2(bx * 12.9 + by * 3.7, bz * 8.3) * 0.12;
    out.copy(tmp).multiplyScalar(ao * jit);
    return { mineral };
  }

  const world = {
    mesh,
    minerals: [],   // exposed mineral centres [wx,wy,wz] for glow cores

    typeAt: matAt,
    solidAt(x, y, z) { return matAt(x, y, z) !== T.AIR; },

    heightAt(wx, wz) {
      const x = Math.max(0, Math.min(W - 1, Math.floor(wx))), z = Math.max(0, Math.min(D - 1, Math.floor(wz)));
      for (let y = H - 1; y >= 0; y--) if (grid[idx(x, y, z)] !== T.AIR) return y + 1;
      return 0;
    },
    typeColor(t) {
      return t === T.GRASS ? C.grassHigh : t === T.SOIL ? C.soil : t === T.STONE ? C.stone : t === T.DEEP ? C.deep : t === T.MINERAL ? MINERALS[0] : C.soil;
    },

    dig(x, y, z) {
      if (y <= 0 || matAt(x, y, z) === T.AIR) return null;
      const t = grid[idx(x, y, z)]; grid[idx(x, y, z)] = T.AIR; this.rebuild(); return t;
    },
    place(x, y, z, t = T.SOIL) {
      if (x < 0 || x >= W || z < 0 || z >= D || y < 1 || y >= H || matAt(x, y, z) !== T.AIR) return false;
      grid[idx(x, y, z)] = t; this.rebuild(); return true;
    },

    rebuild() {
      // build a padded, air-bordered field so the terrain meshes as a CLOSED island
      const NX = W + 2, NY = H + 2, NZ = D + 2;
      const field = new Float32Array(NX * NY * NZ); field.fill(1);
      for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
        if (grid[idx(x, y, z)] !== T.AIR) field[(x + 1) + (y + 1) * NX + (z + 1) * NX * NY] = -1;

      const { vertices, faces } = surfaceNets(field, [NX, NY, NZ]);
      const pos = new Float32Array(vertices.length * 3), col = new Float32Array(vertices.length * 3);
      const c = new THREE.Color();
      this.minerals.length = 0;
      for (let i = 0; i < vertices.length; i++) {
        const wx = vertices[i][0] - 1, wy = vertices[i][1] - 1, wz = vertices[i][2] - 1;   // undo pad
        pos[i * 3] = wx; pos[i * 3 + 1] = wy; pos[i * 3 + 2] = wz;
        const info = vertColor(wx, wy, wz, c);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        if (info.mineral) this.minerals.push(wx, wy, wz);
      }
      const index = new Uint32Array(faces.length * 6);
      for (let i = 0; i < faces.length; i++) {
        const f = faces[i], o = i * 6;
        index[o] = f[0]; index[o + 1] = f[1]; index[o + 2] = f[2];
        index[o + 3] = f[0]; index[o + 4] = f[2]; index[o + 5] = f[3];
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setIndex(new THREE.BufferAttribute(index, 1));
      geo.computeVertexNormals();   // shared verts → smooth Boundless-style normals
      mesh.geometry.dispose();
      mesh.geometry = geo;
    },

    /** dev: carve everything matching pred(x,y,z) in one remesh */
    _debugCarve(pred) {
      for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
        if (grid[idx(x, y, z)] !== T.AIR && pred(x, y, z)) grid[idx(x, y, z)] = T.AIR;
      this.rebuild();
    },
  };

  world.rebuild();
  return world;
}
