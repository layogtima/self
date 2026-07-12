import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Asset pipeline. Drop CC0 files under public/assets/ and load them here:
//   models/  → .glb/.gltf via loadModel() (meshopt-compressed supported)
//   env/     → .hdr via loadEnvironment() (PMREM'd into scene.environment)
// Sources that need zero auth: Poly Haven (API: api.polyhaven.com), Kenney.nl,
// Quaternius, ambientCG. Everything is cached; loads are fire-and-forget.

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const rgbeLoader = new RGBELoader();

const modelCache = new Map();

export function loadModel(url) {
  if (!modelCache.has(url)) {
    modelCache.set(url, new Promise((resolve, reject) => {
      gltfLoader.load(url, (gltf) => {
        gltf.scene.traverse((o) => {
          if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        resolve(gltf);
      }, undefined, reject);
    }));
  }
  return modelCache.get(url);
}

// clone a loaded model for repeated placement (shares geometry/materials)
export async function instantiateModel(url) {
  const gltf = await loadModel(url);
  return gltf.scene.clone(true);
}

export function loadEnvironment(renderer, scene, url, { intensity = 0.35 } = {}) {
  return new Promise((resolve) => {
    rgbeLoader.load(url, (hdr) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      scene.environment = envMap;
      scene.environmentIntensity = intensity;
      resolve(envMap);
    }, undefined, () => resolve(null)); // missing HDRI is fine — fallback lighting stands
  });
}
