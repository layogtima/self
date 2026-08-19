// Live 3D, kept deliberately small: the hero cloud and the open detail specimen, nothing
// else. Both are single objects in a shared scene drawn into a scissor rect over their DOM
// slot, so they track scrolling exactly. When neither is on screen the loop draws nothing —
// browsing the grid costs no GPU at all.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeMesh } from './specimens.js';

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

const HERO_COUNT = 20; // a cloud, not an inventory

export function createRenderer() {
  const canvas = document.getElementById('gl');
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  // 2x device pixel ratio quadruples the fragment work for very little visible gain here.
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearAlpha(0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(2.5, 3.5, 2.5);
  scene.add(key);

  /** At most two entries: the hero and the open dialog. */
  const views = new Map();
  const nav = document.getElementById('nav');
  let calm = false;
  let dirty = true;
  let running = true;
  let painted = false; // is there anything on the canvas right now?

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = views.get(e.target);
        if (v) v.visible = e.isIntersecting;
      }
      dirty = true;
    },
    { rootMargin: '80px' }
  );

  function addView(el, view) {
    views.set(el, { visible: false, ...view });
    io.observe(el);
    dirty = true;
  }

  function removeView(el) {
    const v = views.get(el);
    if (!v) return;
    v.controls?.dispose();
    io.unobserve(el);
    views.delete(el);
    dirty = true;
  }

  function addHero(materials, el, onPick) {
    if (!el) return;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    const group = new THREE.Group();

    // Curated for texture and colour variety — a shop window, not a sample of the list.
    const WANTED = [
      'gold', 'concrete', 'roundwood', 'copper', 'glass', 'coal', 'iron-ore', 'cotton',
      'steel', 'sulfur', 'brick', 'silicon', 'natural-rubber', 'bauxite', 'fluorspar', 'graphite',
      'mica', 'zircon', 'palm-oil', 'coffee',
    ];
    const byId = new Map(materials.map((m) => [m.id, m]));
    const picks = WANTED.map((id) => byId.get(id)).filter(Boolean);
    for (const m of materials) {
      if (picks.length >= HERO_COUNT) break;
      if (!picks.includes(m)) picks.push(m);
    }
    picks.length = Math.min(picks.length, HERO_COUNT);

    // Each piece keeps its own flattened orbit rather than being frozen onto one rotating
    // shell. Different radii, speeds and directions make them drift past each other, so the
    // cloud churns and changes shape instead of turning as a single rigid ball.
    const golden = Math.PI * (3 - Math.sqrt(5));
    picks.forEach((m, i) => {
      const mesh = makeMesh(m, 'card');
      const scale = 0.46 + (m.specimen.seed % 5) * 0.055;
      mesh.scale.setScalar(scale);
      mesh.userData.id = m.id;
      mesh.userData.name = m.name;
      mesh.userData.baseScale = scale;
      mesh.userData.orbit = {
        radius: 1.9 + (i % 5) * 0.52,
        speed: (0.055 + (i % 4) * 0.028) * (i % 2 ? -1 : 1), // alternate direction
        phase: golden * i,
        squash: 0.42 + (i % 3) * 0.12, // flatten the orbit into an ellipse, for depth
        tilt: ((i % 7) - 3) * 0.14, // incline each orbit so they do not share one plane
        y0: (1 - (i / Math.max(1, picks.length - 1)) * 2) * 3.0,
        yAmp: 0.22 + (i % 4) * 0.11,
        ySpeed: 0.24 + (i % 6) * 0.07,
        spinX: 0.0016 + (m.specimen.seed % 5) * 0.0011,
        spinY: 0.0035 + (m.specimen.seed % 7) * 0.0016,
      };
      group.add(mesh);
    });

    let hovered = null;
    let parallaxX = 0;
    let parallaxY = 0;
    let targetX = 0;
    let targetY = 0;

    addView(el, {
      object: group,
      camera,
      layer: 'hero',
      update: (t) => {
        parallaxX += (targetX - parallaxX) * 0.05;
        parallaxY += (targetY - parallaxY) * 0.05;
        group.rotation.y = parallaxX * 0.3;
        group.rotation.x = parallaxY * 0.2 + Math.sin(t * 0.07) * 0.05;

        for (const mesh of group.children) {
          const o = mesh.userData.orbit;
          const a = o.phase + t * o.speed;
          const depth = Math.sin(a) * o.radius * o.squash;
          mesh.position.set(
            Math.cos(a) * o.radius,
            o.y0 + Math.sin(t * o.ySpeed + o.phase) * o.yAmp + depth * o.tilt,
            depth - 1
          );
          mesh.rotation.x += o.spinX;
          mesh.rotation.y += o.spinY;
          const want = mesh === hovered ? mesh.userData.baseScale * 1.28 : mesh.userData.baseScale;
          mesh.scale.setScalar(mesh.scale.x + (want - mesh.scale.x) * 0.18);
        }
      },
    });

    /** Which specimen is under the pointer, using the rect the camera last projected to. */
    function pick(event) {
      const v = views.get(el);
      if (!v?.screen) return null;
      const { left, top, width, height } = v.screen;
      const x = event.clientX - left;
      const y = event.clientY - top;
      if (x < 0 || y < 0 || x > width || y > height) return null;
      pointerNDC.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
      group.updateMatrixWorld(true);
      raycaster.setFromCamera(pointerNDC, v.camera);
      return raycaster.intersectObjects(group.children, false)[0]?.object ?? null;
    }

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const hit = calm ? null : pick(e);
      if (hit !== hovered) {
        hovered = hit;
        el.style.cursor = hit ? 'pointer' : '';
        el.title = hit ? hit.userData.name : '';
        dirty = true;
      }
    });

    el.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      hovered = null;
      el.style.cursor = '';
      el.title = '';
      dirty = true;
    });

    el.addEventListener('click', (e) => {
      const hit = pick(e);
      if (hit) onPick?.(hit.userData.id);
    });
  }

  let detailEl = null;
  function addDetail(material, el) {
    if (!el) return;
    removeDetail();
    const mesh = makeMesh(material, 'detail');
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0.35, 5.4);
    const controls = new OrbitControls(camera, el);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    controls.addEventListener('change', () => {
      dirty = true;
    });
    detailEl = el;
    addView(el, {
      object: mesh,
      camera,
      layer: 'dialog',
      controls,
      update: (t) => {
        mesh.rotation.y = material.specimen.seed * 0.7 + t * 0.12;
        controls.update();
      },
    });
  }

  function removeDetail() {
    if (detailEl) removeView(detailEl);
    detailEl = null;
    dirty = true;
  }

  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight, false);
    dirty = true;
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', () => {
    dirty = true;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    dirty = true;
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    running = true;
    resize();
  });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!running || document.hidden) return;

    const dialogOpen = !!detailEl && views.has(detailEl);
    const active = [];
    for (const [el, v] of views) {
      if (!v.visible) continue;
      if (dialogOpen ? v.layer !== 'dialog' : v.layer === 'dialog') continue;
      active.push([el, v]);
    }
    // Nothing on screen worth drawing. Clear once so the last specimen does not stay
    // painted over the page after the dialog closes, then idle until something returns.
    if (!active.length) {
      if (painted) {
        renderer.setScissorTest(false);
        renderer.clear();
        painted = false;
      }
      return;
    }
    if (calm && !dirty) return;
    dirty = false;

    const t = now / 1000;
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const height = innerHeight;

    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);

    for (const [el, v] of active) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.bottom <= 0 || r.top >= height) continue;
      const top = Math.max(r.top, v.layer === 'dialog' ? 0 : navBottom);
      const bottom = Math.min(r.bottom, height);
      const h = bottom - top;
      if (h <= 1) continue;

      if (!calm) v.update(t);

      v.camera.aspect = r.width / Math.max(1, r.height);
      v.camera.updateProjectionMatrix();
      v.camera.setViewOffset(r.width, r.height, 0, top - r.top, r.width, h);

      // Remembered for raycasting: this is the region the camera's projection maps to.
      v.screen = { left: r.left, top, width: r.width, height: h };

      scene.add(v.object);
      renderer.setViewport(r.left, height - bottom, r.width, h);
      renderer.setScissor(r.left, height - bottom, r.width, h);
      renderer.render(scene, v.camera);
      scene.remove(v.object);
      painted = true;
    }
    renderer.setScissorTest(false);
  }
  requestAnimationFrame(frame);

  return {
    addHero,
    addDetail,
    removeDetail,
    markDirty() {
      dirty = true;
    },
    setCalm(v) {
      calm = v;
      dirty = true;
    },
    renderer,
    viewCount: () => views.size,
  };
}
