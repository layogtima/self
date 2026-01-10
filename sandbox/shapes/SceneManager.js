import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/**
 * SceneManager - Abstracts THREE.js scene setup and management
 */
export class SceneManager {
	constructor(canvas) {
		this.canvas = canvas;
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.controls = null;
		this.ambientLight = null;
		this.directionalLight = null;
		this.pointLight = null;
		this.currentMesh = null;
		this.animationId = null;
		this.clock = new THREE.Clock();
		
		// Post-processing
		this.composer = null;
		this.bloomPass = null;
		this.renderPass = null;
		this.usePostProcessing = false;
		
		// Callbacks
		this.onRenderCallback = null;
		
		this.init();
	}
	
	init() {
		THREE.ColorManagement.enabled = false;
		
		// Scene setup
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);
		
		// Camera setup
		const aspect = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
		this.camera.position.set(0, 0, 3);
		this.scene.add(this.camera);
		
		// Lights - Enhanced for better material differentiation
		this.ambientLight = new THREE.AmbientLight(0xffffff, 1.12);
		this.scene.add(this.ambientLight);
		
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 3.26);
		this.directionalLight.position.set(5, 5, 5);
		this.scene.add(this.directionalLight);
		
		// Add point light for better material highlights
		this.pointLight = new THREE.PointLight(0xffffff, 1.5);
		this.pointLight.position.set(-3, 3, 3);
		this.scene.add(this.pointLight);
		
		// Renderer
		this.renderer = new THREE.WebGLRenderer({ 
			canvas: this.canvas,
			antialias: true 
		});
		this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		
		// Controls
		this.controls = new OrbitControls(this.camera, this.canvas);
		
		// Post-processing setup
		this.setupPostProcessing();
		
		// Window resize handler
		window.addEventListener('resize', () => this.onWindowResize());
	}
	
	setMesh(mesh) {
		// Remove old mesh
		if (this.currentMesh) {
			this.scene.remove(this.currentMesh);
			this.currentMesh.geometry.dispose();
		}
		
		// Add new mesh
		this.currentMesh = mesh;
		this.scene.add(this.currentMesh);
	}
	
	setAmbientLightIntensity(intensity) {
		this.ambientLight.intensity = intensity;
	}
	
	setDirectionalLightIntensity(intensity) {
		this.directionalLight.intensity = intensity;
	}
	
	setLightsVisible(visible) {
		this.ambientLight.visible = visible;
		this.directionalLight.visible = visible;
		this.pointLight.visible = visible;
	}
	
	setupPostProcessing() {
		// Create composer
		this.composer = new EffectComposer(this.renderer);
		
		// Render pass
		this.renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(this.renderPass);
		
		// Bloom pass
		this.bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.3,  // strength
			0.4,  // radius
			0.85  // threshold
		);
		this.composer.addPass(this.bloomPass);
		
		// Output pass
		const outputPass = new OutputPass();
		this.composer.addPass(outputPass);
	}
	
	setBloomEnabled(enabled) {
		this.bloomPass.enabled = enabled;
		this.usePostProcessing = enabled;
	}
	
	setBloomStrength(value) {
		this.bloomPass.strength = value;
	}
	
	setBloomRadius(value) {
		this.bloomPass.radius = value;
	}
	
	setBloomThreshold(value) {
		this.bloomPass.threshold = value;
	}
	
	resetCamera() {
		this.camera.position.set(0, 0, 3);
		this.controls.reset();
	}
	
	getCameraPosition() {
		return {
			x: this.camera.position.x,
			y: this.camera.position.y,
			z: this.camera.position.z
		};
	}
	
	onWindowResize() {
		// Update camera
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		
		// Update renderer
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		
		// Update composer
		if (this.composer) {
			this.composer.setSize(window.innerWidth, window.innerHeight);
		}
	}
	
	startRenderLoop(callback) {
		this.onRenderCallback = callback;
		this.animate();
	}
	
	animate() {
		this.animationId = window.requestAnimationFrame(() => this.animate());
		
		const elapsedTime = this.clock.getElapsedTime();
		
		// Update controls
		this.controls.update();
		
		// Call custom callback if provided
		if (this.onRenderCallback) {
			this.onRenderCallback(elapsedTime);
		}
		
		// Render
		if (this.usePostProcessing) {
			this.composer.render();
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}
	
	stopRenderLoop() {
		if (this.animationId) {
			window.cancelAnimationFrame(this.animationId);
		}
	}
	
	dispose() {
		this.stopRenderLoop();
		
		if (this.currentMesh) {
			this.currentMesh.geometry.dispose();
			this.currentMesh.material.dispose();
		}
		
		this.renderer.dispose();
		this.controls.dispose();
	}
}
