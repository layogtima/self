// CHIP REALITY INTERFACE v1.0
// Built by: Amit (Code Uncode) & Amartha (Claude)
// License: GPL-3.0
// Part of: Absurd Industries

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { USDZLoader } from 'three/addons/loaders/USDZLoader.js';

const { createApp } = Vue;

// ============================================
// CONFIGURATION
// ============================================

// HDRI URLs - CHANGE THESE TO YOUR OWN HDRIs!
// Get free HDRIs from: https://polyhaven.com/hdris
const HDRI_URLS = {
  void: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
  xray: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/hospital_room_1k.hdr',
  hologram: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
  shadowPlay: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/photo_studio_01_1k.hdr',
  supernova: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kiara_1_dawn_1k.hdr',
  chrome: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr',
  fracture: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr',
  chaos: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/neon_photostudio_1k.hdr',
};

// Model URL
const MODEL_URL = 'https://threejs.org/examples/models/usdz/saeukkang.usdz';

// ============================================
// VUE APP
// ============================================

createApp({
  data() {
    return {
      // Loading
      loading: true,
      loadingProgress: 0,
      loadingStatus: 'Initializing...',

      // UI State
      sidebarVisible: true,
      mobileMenuVisible: false,
      showPerformancePanel: false,

      // Current Scene
      currentSceneId: 'default',

      // Performance
      performanceLevel: 1, // 0 = potato, 1 = balanced, 2 = NASA
      fps: 60,
      exposure: 1.0,
      pixelRatio: 1,
      autoRotate: true,

      // Scenes Configuration
      scenes: {
        default: {
          name: 'DEFAULT',
          subtitle: 'Clean View',
          controls: false,
        },
        void: {
          name: 'VOID',
          subtitle: 'Darkness Absolute',
          controls: true,
        },
        xray: {
          name: 'X-RAY',
          subtitle: 'Geometric Truth',
          controls: true,
        },
        hologram: {
          name: 'HOLOGRAM',
          subtitle: 'Projected Reality',
          controls: true,
        },
        shadowPlay: {
          name: 'SHADOW PLAY',
          subtitle: 'Dramatic Lighting',
          controls: true,
        },
        supernova: {
          name: 'SUPERNOVA',
          subtitle: 'Stellar Explosion',
          controls: true,
        },
        chrome: {
          name: 'CHROME',
          subtitle: 'Perfect Reflection',
          controls: true,
        },
        fracture: {
          name: 'FRACTURE',
          subtitle: 'Controlled Demolition',
          controls: true,
        },
        chaos: {
          name: 'CHAOS',
          subtitle: 'All at Once',
          controls: true,
        },
      },

      // Scene-specific states
      voidExposure: 0.1,
      xrayWireframe: true,
      xrayOpacity: 0.8,
      hologramGlitch: 0.5,
      hologramScanlines: 1.0,
      shadowLights: {
        top: { enabled: true, intensity: 1.0 },
        bottom: { enabled: false, intensity: 0.5 },
        left: { enabled: true, intensity: 0.7 },
        right: { enabled: true, intensity: 0.7 },
        front: { enabled: true, intensity: 1.0 },
        back: { enabled: false, intensity: 0.3 },
      },
      supernovaGlow: 2.0,
      supernovaBloom: 1.5,
      chromeRoughness: 0.0,
      chromeEnvRotation: 0,
      fractureExplosion: 1.0,
      fractureFragments: 8,
      fractureRotationSpeed: 0.5,
      chaosChipCount: 5,
      chaosIntensity: 1.0,
    };
  },

  methods: {
    switchScene(sceneId) {
      console.log(`Switching to scene: ${sceneId}`);
      this.currentSceneId = sceneId;
      if (window.sceneManager) {
        window.sceneManager.switchTo(sceneId);
      }
    },

    updatePerformance() {
      console.log(`Performance level: ${this.performanceLevel}`);
      if (window.sceneManager) {
        window.sceneManager.setPerformanceLevel(this.performanceLevel);
      }
      
      // Update pixel ratio
      const ratios = [0.5, 1.0, Math.min(window.devicePixelRatio, 2)];
      this.pixelRatio = ratios[this.performanceLevel];
      if (window.renderer) {
        window.renderer.setPixelRatio(this.pixelRatio);
      }
    },

    resetCamera() {
      if (window.sceneManager) {
        window.sceneManager.resetCamera();
      }
    },

    handleKeyPress(e) {
      // S key toggles sidebar
      if (e.key === 's' || e.key === 'S') {
        this.sidebarVisible = !this.sidebarVisible;
      }
      // Space toggles auto-rotate
      if (e.key === ' ') {
        e.preventDefault();
        this.autoRotate = !this.autoRotate;
      }
      // R resets camera
      if (e.key === 'r' || e.key === 'R') {
        this.resetCamera();
      }
      // Number keys 1-8 switch scenes
      const sceneKeys = ['default', 'void', 'xray', 'hologram', 'shadowPlay', 'supernova', 'chrome', 'fracture', 'chaos'];
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && sceneKeys[num - 1]) {
        this.switchScene(sceneKeys[num - 1]);
      }
    },
  },

  mounted() {
    console.log('🚀 CHIP REALITY INTERFACE v1.0');
    console.log('Built by: Amit (Code Uncode) & Amartha (Claude)');
    console.log('Part of: Absurd Industries');

    // Keyboard shortcuts
    window.addEventListener('keydown', this.handleKeyPress);

    // Initialize Three.js
    initThreeJS(this);

    // Mobile menu auto-hide on mobile
    if (window.innerWidth < 768) {
      this.sidebarVisible = false;
      this.mobileMenuVisible = false;
    }
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
}).mount('#app');

// ============================================
// SCENE CONTROL COMPONENTS
// ============================================

// VOID Controls
const VoidControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">VOID CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Exposure: {{ $root.voidExposure.toFixed(2) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          v-model.number="$root.voidExposure"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// X-RAY Controls
const XrayControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">X-RAY CONTROLS</h4>
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase">Wireframe</span>
        <button 
          @click="$root.xrayWireframe = !$root.xrayWireframe"
          class="px-3 py-1 border border-white/30 text-xs"
          :class="{ 'bg-white text-black': $root.xrayWireframe }"
        >
          {{ $root.xrayWireframe ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Opacity: {{ ($root.xrayOpacity * 100).toFixed(0) }}%
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          v-model.number="$root.xrayOpacity"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// HOLOGRAM Controls
const HologramControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">HOLOGRAM CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Glitch: {{ ($root.hologramGlitch * 100).toFixed(0) }}%
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          v-model.number="$root.hologramGlitch"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Scanlines: {{ $root.hologramScanlines.toFixed(1) }}x
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1"
          v-model.number="$root.hologramScanlines"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// SHADOW PLAY Controls
const ShadowPlayControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">SHADOW PLAY CONTROLS</h4>
      <div v-for="(light, name) in $root.shadowLights" :key="name" class="border border-white/20 p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs uppercase">{{ name }}</span>
          <button 
            @click="light.enabled = !light.enabled"
            class="px-3 py-1 border border-white/30 text-xs"
            :class="{ 'bg-white text-black': light.enabled }"
          >
            {{ light.enabled ? 'ON' : 'OFF' }}
          </button>
        </div>
        <input 
          v-if="light.enabled"
          type="range" 
          min="0" 
          max="2" 
          step="0.1"
          v-model.number="light.intensity"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// SUPERNOVA Controls
const SupernovaControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">SUPERNOVA CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Glow: {{ $root.supernovaGlow.toFixed(1) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1"
          v-model.number="$root.supernovaGlow"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Bloom: {{ $root.supernovaBloom.toFixed(1) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.1"
          v-model.number="$root.supernovaBloom"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// CHROME Controls
const ChromeControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">CHROME CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Roughness: {{ $root.chromeRoughness.toFixed(2) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          v-model.number="$root.chromeRoughness"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Env Rotation: {{ $root.chromeEnvRotation.toFixed(0) }}°
        </label>
        <input 
          type="range" 
          min="0" 
          max="360" 
          step="1"
          v-model.number="$root.chromeEnvRotation"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// FRACTURE Controls
const FractureControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">FRACTURE CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Explosion: {{ $root.fractureExplosion.toFixed(1) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1"
          v-model.number="$root.fractureExplosion"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Fragments: {{ $root.fractureFragments }}
        </label>
        <input 
          type="range" 
          min="4" 
          max="20" 
          step="1"
          v-model.number="$root.fractureFragments"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Rotation: {{ $root.fractureRotationSpeed.toFixed(1) }}x
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1"
          v-model.number="$root.fractureRotationSpeed"
          class="w-full accent-white"
        />
      </div>
    </div>
  `,
};

// CHAOS Controls
const ChaosControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">CHAOS CONTROLS</h4>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Chip Count: {{ $root.chaosChipCount }}
        </label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1"
          v-model.number="$root.chaosChipCount"
          class="w-full accent-white"
        />
      </div>
      <div>
        <label class="text-xs uppercase tracking-widest mb-2 block">
          Intensity: {{ $root.chaosIntensity.toFixed(1) }}
        </label>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.1"
          v-model.number="$root.chaosIntensity"
          class="w-full accent-white"
        />
      </div>
      <button 
        @click="window.sceneManager && window.sceneManager.randomizeChaos()"
        class="w-full px-4 py-2 border border-white/30 hover:bg-white hover:text-black transition-all text-xs uppercase tracking-wider"
      >
        RANDOMIZE
      </button>
    </div>
  `,
};

// Register Vue components
const app = createApp.component('void-controls', VoidControls);
app.component('xray-controls', XrayControls);
app.component('hologram-controls', HologramControls);
app.component('shadowPlay-controls', ShadowPlayControls);
app.component('supernova-controls', SupernovaControls);
app.component('chrome-controls', ChromeControls);
app.component('fracture-controls', FractureControls);
app.component('chaos-controls', ChaosControls);

// ============================================
// THREE.JS INITIALIZATION
// ============================================

async function initThreeJS(vueApp) {
  const container = document.getElementById('canvas-container');

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 3);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: vueApp.performanceLevel > 0,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, vueApp.performanceLevel === 2 ? 2 : 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Store globally
  window.renderer = renderer;
  window.scene = scene;
  window.camera = camera;

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.autoRotate = vueApp.autoRotate;
  controls.autoRotateSpeed = 1.0;
  window.controls = controls;

  // Lights (default scene)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Load Model
  vueApp.loadingStatus = 'Loading model...';
  const loader = new USDZLoader();
  
  try {
    const model = await loader.loadAsync(MODEL_URL, (progress) => {
      vueApp.loadingProgress = Math.round((progress.loaded / progress.total) * 80);
    });

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    
    model.position.sub(center);
    model.scale.setScalar(scale);
    
    scene.add(model);
    window.model = model;

    vueApp.loadingStatus = 'Loading HDRIs...';
    vueApp.loadingProgress = 85;

    // Load HDRIs
    const rgbeLoader = new RGBELoader();
    const hdris = {};
    
    for (const [key, url] of Object.entries(HDRI_URLS)) {
      try {
        hdris[key] = await rgbeLoader.loadAsync(url);
        hdris[key].mapping = THREE.EquirectangularReflectionMapping;
      } catch (err) {
        console.warn(`Failed to load HDRI for ${key}:`, err);
      }
    }
    
    window.hdris = hdris;

    vueApp.loadingStatus = 'Initializing scenes...';
    vueApp.loadingProgress = 95;

    // Initialize Scene Manager
    window.sceneManager = new SceneManager(scene, camera, renderer, controls, model, hdris, vueApp);

    vueApp.loadingProgress = 100;
    vueApp.loading = false;

    // Start animation loop
    animate();

  } catch (error) {
    console.error('Failed to load model:', error);
    vueApp.loadingStatus = 'Error loading model';
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update auto-rotate
    controls.autoRotate = vueApp.autoRotate;
    controls.update();

    // Update exposure
    renderer.toneMappingExposure = vueApp.exposure;

    // Update FPS
    vueApp.fps = Math.round(1000 / performance.now());

    // Render
    if (window.sceneManager) {
      window.sceneManager.update();
    }
    
    renderer.render(scene, camera);
  }
}

// ============================================
// SCENE MANAGER
// ============================================

class SceneManager {
  constructor(scene, camera, renderer, controls, model, hdris, vueApp) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.model = model;
    this.hdris = hdris;
    this.vueApp = vueApp;
    
    this.currentScene = 'default';
    this.defaultCameraPosition = camera.position.clone();
    this.defaultCameraTarget = new THREE.Vector3(0, 0, 0);
    
    console.log('✨ Scene Manager initialized');
  }

  switchTo(sceneId) {
    console.log(`Switching to: ${sceneId}`);
    this.currentScene = sceneId;

    // Apply scene-specific settings
    switch (sceneId) {
      case 'default':
        this.setupDefault();
        break;
      case 'void':
        this.setupVoid();
        break;
      case 'xray':
        this.setupXray();
        break;
      case 'hologram':
        this.setupHologram();
        break;
      case 'shadowPlay':
        this.setupShadowPlay();
        break;
      case 'supernova':
        this.setupSupernova();
        break;
      case 'chrome':
        this.setupChrome();
        break;
      case 'fracture':
        this.setupFracture();
        break;
      case 'chaos':
        this.setupChaos();
        break;
    }
  }

  setupDefault() {
    this.scene.background = new THREE.Color(0x222222);
    this.scene.environment = null;
    this.vueApp.exposure = 1.0;
    
    // Reset model material
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.5,
        });
      }
    });
  }

  setupVoid() {
    this.scene.background = new THREE.Color(0x000000);
    if (this.hdris.void) {
      this.scene.environment = this.hdris.void;
    }
    this.vueApp.exposure = this.vueApp.voidExposure;
  }

  setupXray() {
    this.scene.background = new THREE.Color(0x000000);
    if (this.hdris.xray) {
      this.scene.environment = this.hdris.xray;
    }
    
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          wireframe: this.vueApp.xrayWireframe,
          opacity: this.vueApp.xrayOpacity,
          transparent: true,
        });
      }
    });
  }

  setupHologram() {
    this.scene.background = new THREE.Color(0x000000);
    if (this.hdris.hologram) {
      this.scene.environment = this.hdris.hologram;
    }
    
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          wireframe: true,
          opacity: 0.7,
          transparent: true,
        });
      }
    });
  }

  setupShadowPlay() {
    this.scene.background = new THREE.Color(0x111111);
    this.scene.environment = null;
    // TODO: Implement lighting rig
  }

  setupSupernova() {
    this.scene.background = new THREE.Color(0xffffff);
    if (this.hdris.supernova) {
      this.scene.environment = this.hdris.supernova;
    }
    this.vueApp.exposure = 3.0;
    
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: this.vueApp.supernovaGlow,
        });
      }
    });
  }

  setupChrome() {
    this.scene.background = new THREE.Color(0x444444);
    if (this.hdris.chrome) {
      this.scene.environment = this.hdris.chrome;
    }
    
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: this.vueApp.chromeRoughness,
          metalness: 1.0,
          envMapIntensity: 1.5,
        });
      }
    });
  }

  setupFracture() {
    this.scene.background = new THREE.Color(0x000000);
    if (this.hdris.fracture) {
      this.scene.environment = this.hdris.fracture;
    }
    // TODO: Implement fracture logic
  }

  setupChaos() {
    this.scene.background = new THREE.Color(0x000000);
    if (this.hdris.chaos) {
      this.scene.environment = this.hdris.chaos;
    }
    // TODO: Implement multiple chips
  }

  update() {
    // Per-frame updates for current scene
    if (this.currentScene === 'hologram') {
      // Glitch effect
      if (this.vueApp.hologramGlitch > 0 && Math.random() < 0.1) {
        this.model.position.x += (Math.random() - 0.5) * 0.01 * this.vueApp.hologramGlitch;
        this.model.position.y += (Math.random() - 0.5) * 0.01 * this.vueApp.hologramGlitch;
      } else {
        this.model.position.x *= 0.9;
        this.model.position.y *= 0.9;
      }
    }

    if (this.currentScene === 'fracture') {
      // Rotation
      this.model.rotation.y += 0.01 * this.vueApp.fractureRotationSpeed;
    }
  }

  resetCamera() {
    this.camera.position.copy(this.defaultCameraPosition);
    this.controls.target.copy(this.defaultCameraTarget);
    this.controls.update();
  }

  setPerformanceLevel(level) {
    this.renderer.setPixelRatio(
      level === 0 ? 0.5 : level === 1 ? 1.0 : Math.min(window.devicePixelRatio, 2)
    );
  }

  randomizeChaos() {
    console.log('🌀 Randomizing chaos...');
    // TODO: Implement chaos randomization
  }
}