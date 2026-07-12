import * as THREE from 'three';

// Exterior rig. The sun rides high so it pours through the oculus crowns —
// interior sunbeams are the whole solarpunk point. Interior light belongs to
// the biomes (one key + accent each) and the Atrium.

export function createLights(scene) {
  const sun = new THREE.DirectionalLight(0xfff2dc, 3.0);
  sun.position.set(300, 1400, -500);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -450; cam.right = 450;
  cam.top = 450; cam.bottom = -450;
  cam.near = 400; cam.far = 2400;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 2.5;
  scene.add(sun, sun.target);

  const fill = new THREE.HemisphereLight(0x35465c, 0x0c0f14, 0.75);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x5c86a8, 0.55);
  rim.position.set(-900, 150, 900);
  rim.target.position.set(0, 50, 0);
  scene.add(rim, rim.target);

  return { sun, rim, fill };
}
