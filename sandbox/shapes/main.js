import { SceneManager } from './SceneManager.js';
import { ShapeFactory } from './ShapeFactory.js';

const { createApp, ref, watch, onMounted, onUnmounted, computed } = Vue;

createApp({
	setup() {
		// Scene manager instance
		let sceneManager = null;
		
		// Reactive state
		const state = ref({
			shape: 'torusKnot',
			material: 'standard',
			ambientIntensity: 1.12,
			lightIntensity: 3.26,
			wireframe: false,
			lightsVisible: true,
			autoRotate: true,
			fps: 60,
			cameraPos: { x: 0, y: 0, z: 3 },
			uiVisible: true,
			bloomEnabled: false,
			bloomStrength: 0.3,
			bloomRadius: 0.4,
			bloomThreshold: 0.85,
			// Accordion sections
			accordion: {
				shape: true,
				lighting: true,
				material: true,
				options: true,
				postProcessing: true
			}
		});
		
		// Computed properties
		const rotationSpeed = computed(() => 0.1);
		
		// FPS tracking
		let fpsFrames = 0;
		let fpsLastTime = performance.now();
		
		// Initialize scene
		onMounted(() => {
			const canvas = document.querySelector('canvas');
			sceneManager = new SceneManager(canvas);
			
			// Create initial mesh
			updateMesh();
			
			// Start render loop
			sceneManager.startRenderLoop((elapsedTime) => {
				// Auto-rotation
				if (state.value.autoRotate && sceneManager.currentMesh) {
					const speed = rotationSpeed.value;
					sceneManager.currentMesh.rotation.x = elapsedTime * speed;
					sceneManager.currentMesh.rotation.y = elapsedTime * speed;
					sceneManager.currentMesh.rotation.z = elapsedTime * speed;
				}
				
				// Update camera position
				state.value.cameraPos = sceneManager.getCameraPosition();
				
				// Calculate FPS
				fpsFrames++;
				const currentTime = performance.now();
				if (currentTime >= fpsLastTime + 1000) {
					state.value.fps = Math.round((fpsFrames * 1000) / (currentTime - fpsLastTime));
					fpsFrames = 0;
					fpsLastTime = currentTime;
				}
			});
			
			// Keyboard shortcut for UI toggle (H key)
			window.addEventListener('keydown', (e) => {
				if (e.key === 'h' || e.key === 'H') {
					state.value.uiVisible = !state.value.uiVisible;
				}
			});
		});
		
		// Cleanup on unmount
		onUnmounted(() => {
			if (sceneManager) {
				sceneManager.dispose();
			}
		});
		
		// Update mesh when shape or material changes
		const updateMesh = () => {
			if (!sceneManager) return;
			
			const mesh = ShapeFactory.createMesh(
				state.value.shape,
				state.value.material,
				{ wireframe: state.value.wireframe }
			);
			
			sceneManager.setMesh(mesh);
		};
		
		// Watch for shape changes
		watch(() => state.value.shape, () => {
			updateMesh();
		});
		
		// Watch for material changes
		watch(() => state.value.material, () => {
			updateMesh();
		});
		
		// Watch for wireframe changes
		watch(() => state.value.wireframe, (newValue) => {
			if (sceneManager && sceneManager.currentMesh) {
				sceneManager.currentMesh.material.wireframe = newValue;
			}
		});
		
		// Watch for ambient light changes
		watch(() => state.value.ambientIntensity, (newValue) => {
			if (sceneManager) {
				sceneManager.setAmbientLightIntensity(newValue);
			}
		});
		
		// Watch for directional light changes
		watch(() => state.value.lightIntensity, (newValue) => {
			if (sceneManager) {
				sceneManager.setDirectionalLightIntensity(newValue);
			}
		});
		
		// Watch for lights visibility
		watch(() => state.value.lightsVisible, (newValue) => {
			if (sceneManager) {
				sceneManager.setLightsVisible(newValue);
			}
		});
		
		// Watch for bloom toggle
		watch(() => state.value.bloomEnabled, (newValue) => {
			if (sceneManager) {
				sceneManager.setBloomEnabled(newValue);
			}
		});
		
		// Watch for bloom strength
		watch(() => state.value.bloomStrength, (newValue) => {
			if (sceneManager) {
				sceneManager.setBloomStrength(newValue);
			}
		});
		
		// Watch for bloom radius
		watch(() => state.value.bloomRadius, (newValue) => {
			if (sceneManager) {
				sceneManager.setBloomRadius(newValue);
			}
		});
		
		// Watch for bloom threshold
		watch(() => state.value.bloomThreshold, (newValue) => {
			if (sceneManager) {
				sceneManager.setBloomThreshold(newValue);
			}
		});
		
		// Methods
		const resetCamera = () => {
			if (sceneManager) {
				sceneManager.resetCamera();
			}
		};
		
		const toggleUI = () => {
			state.value.uiVisible = !state.value.uiVisible;
		};
		
		const toggleSection = (section) => {
			state.value.accordion[section] = !state.value.accordion[section];
		};
		
		// Available options
		const shapes = ShapeFactory.getAvailableShapes().map(s => ({
			value: s,
			label: s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1')
		}));
		
		const materials = ShapeFactory.getAvailableMaterials().map(m => ({
			value: m,
			label: m.charAt(0).toUpperCase() + m.slice(1)
		}));
		
		return {
			state,
			shapes,
			materials,
			resetCamera,
			toggleUI,
			toggleSection,
			rotationSpeed
		};
	}
}).mount('#app');
