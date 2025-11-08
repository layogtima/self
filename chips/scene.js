/* ============================================
   SCENE.JS v1.0 - Three.js Reality Destructor
   9 rendering modes. Each one breaks physics differently.
   ============================================ */

import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'https://threejs.org/examples/jsm/loaders/HDRLoader.js';
import { USDLoader } from 'https://threejs.org/examples/jsm/loaders/USDLoader.js';

/* === HDR CONFIGURATION === */
const HDR_ENVIRONMENTS = {
    venice: 'venice_sunset_1k.hdr',
    royal: 'royal_esplanade_1k.hdr',
    overpass: 'pedestrian_overpass_1k.hdr',
    studio: 'pedestrian_overpass_1k.hdr'
};

const HDR_BASE_PATH = 'https://threejs.org/examples/textures/equirectangular/';

class ChipScene {
    constructor() {
        // Core
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.controls = null;
        
        // Assets
        this.chipModel = null;
        this.hdrTextures = {};
        this.currentHDR = 'venice';
        
        // Quality
        this.qualityLevel = localStorage.getItem('chipQuality') || 'HIGH';
        this.qualitySettings = {
            LOW: { pixelRatio: 1, shadows: false, antialias: false },
            MEDIUM: { pixelRatio: 1.5, shadows: true, antialias: false },
            HIGH: { pixelRatio: 2, shadows: true, antialias: true },
            ULTRA: { pixelRatio: 2, shadows: true, antialias: true }
        };
        
        // State
        this.currentRenderMode = 'default';
        this.autoRotate = false;
        this.isMobile = window.innerWidth < 768;
        
        // Animation
        this.time = 0;
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        // Chip state
        this.originalPosition = new THREE.Vector3(0, 0, 0);
        this.originalRotation = new THREE.Euler(0, 0, 0);
        
        // Lights
        this.lights = {};
        this.shadowLights = {}; // For Shadow Play mode
        
        // Materials
        this.materials = {};
        this.originalMaterial = null;
        
        // Fracture mode
        this.fracturedPieces = [];
        this.isFractured = false;
        
        // Chaos mode
        this.chaosChips = [];
        
        // Hologram glitch
        this.glitchTimer = 0;
        
        this.init();
    }
    
    async init() {
        console.log('🎬 Initializing scene...');
        
        this.showLoading();
        
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        
        await this.loadAssets();
        
        this.setupMaterials();
        this.setupEventListeners();
        
        this.animate();
        this.hideLoading();
        
        window.dispatchEvent(new CustomEvent('scene-ready'));
        
        console.log('✨ Scene ready!');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0.5, 2);
    }
    
    setupRenderer() {
        const quality = this.qualitySettings[this.qualityLevel];
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: quality.antialias,
            alpha: false,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        this.renderer.shadowMap.enabled = quality.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        console.log(`🎨 Renderer: ${this.qualityLevel} quality`);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 10;
        this.controls.enablePan = false;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
        this.controls.enabled = true; // Always enabled now (fixes Chrome mode)
    }
    
    setupLights() {
        // Main key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 3);
        keyLight.position.set(3, 3, 3);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        // Fill lights
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        fillLight1.position.set(-3, 1, 2);
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
        fillLight2.position.set(0, -2, 3);
        this.scene.add(fillLight2);
        
        // Ambient
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        this.lights = { key: keyLight, fill1: fillLight1, fill2: fillLight2, ambient: ambientLight };
        
        // Shadow Play lights (initially hidden)
        this.shadowLights = {
            top: this.createShadowLight(new THREE.Vector3(0, 5, 0), 5),
            bottom: this.createShadowLight(new THREE.Vector3(0, -5, 0), 3),
            left: this.createShadowLight(new THREE.Vector3(-5, 0, 0), 4),
            right: this.createShadowLight(new THREE.Vector3(5, 0, 0), 4)
        };
        
        Object.values(this.shadowLights).forEach(light => {
            light.visible = false;
            this.scene.add(light);
        });
    }
    
    createShadowLight(position, intensity) {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.copy(position);
        light.castShadow = true;
        return light;
    }
    
    async loadAssets() {
        const hdrLoader = new HDRLoader().setPath(HDR_BASE_PATH);
        const usdzLoader = new USDLoader()
            .setPath('https://threejs.org/examples/models/usdz/');
        
        try {
            // Load chip
            const model = await usdzLoader.loadAsync('saeukkang.usdz');
            
            // Load HDRIs
            const hdrPromises = Object.entries(HDR_ENVIRONMENTS).map(async ([key, filename]) => {
                const texture = await hdrLoader.loadAsync(filename);
                texture.mapping = THREE.EquirectangularReflectionMapping;
                return [key, texture];
            });
            
            const hdrResults = await Promise.all(hdrPromises);
            hdrResults.forEach(([key, texture]) => {
                this.hdrTextures[key] = texture;
            });
            
            this.scene.environment = this.hdrTextures[this.currentHDR];
            
            // Setup chip
            this.chipModel = model;
            this.chipModel.position.copy(this.originalPosition);
            this.chipModel.rotation.copy(this.originalRotation);
            this.scene.add(this.chipModel);
            
            // Store original material
            this.chipModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    this.originalMaterial = child.material.clone();
                    child.material.metalness = 0.7;
                    child.material.roughness = 0.3;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            console.log(`✅ Assets loaded: ${Object.keys(this.hdrTextures).length} HDRIs`);
        } catch (error) {
            console.error('💥 Loading failed:', error);
        }
    }
    
    setupMaterials() {
        // Default
        this.materials.default = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Void (black hole - absorbs light)
        this.materials.void = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.0,
            roughness: 1.0,
            emissive: 0x000000
        });
        
        // X-Ray (wireframe)
        this.materials.xray = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        
        // Hologram (neon green, transparent)
        this.materials.hologram = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6,
            wireframe: false,
            side: THREE.DoubleSide
        });
        
        // Shadow (dark for dramatic shadows)
        this.materials.shadow = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.3,
            roughness: 0.8
        });
        
        // Supernova (glowing white)
        this.materials.supernova = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2.0,
            metalness: 0.5,
            roughness: 0.1
        });
        
        // Chrome (perfect mirror)
        this.materials.chrome = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.0,
            envMapIntensity: 2.0
        });
    }
    
    
    changeRenderMode(mode) {
        console.log(`🎨 Mode: ${mode.toUpperCase()}`);
        this.currentRenderMode = mode;
        
        // Clean up previous mode
        this.cleanupCurrentMode();
        
        // Apply new mode
        switch(mode) {
            case 'default': this.applyDefaultMode(); break;
            case 'void': this.applyVoidMode(); break;
            case 'xray': this.applyXRayMode(); break;
            case 'hologram': this.applyHologramMode(); break;
            case 'shadow': this.applyShadowMode(); break;
            case 'supernova': this.applySupernovaMode(); break;
            case 'chrome': this.applyChromeMode(); break;
            case 'fracture': this.applyFractureMode(); break;
            case 'chaos': this.applyChaosMode(); break;
        }
    }
    
    cleanupCurrentMode() {
        // Reassemble if fractured
        if (this.isFractured) {
            this.reassembleChip();
        }
        
        // Remove chaos chips
        if (this.chaosChips.length > 0) {
            this.chaosChips.forEach(chip => this.scene.remove(chip.mesh));
            this.chaosChips = [];
        }
        
        // Make sure main chip is visible
        if (this.chipModel) {
            this.chipModel.visible = true;
        }
        
        // Hide shadow lights
        Object.values(this.shadowLights).forEach(light => light.visible = false);
        
        // Show main lights
        Object.values(this.lights).forEach(light => light.visible = true);
    }
    
    /* === RENDERING MODES === */
    
    applyDefaultMode() {
        this.renderer.toneMappingExposure = 1.5;
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.currentHDR = 'venice';
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 3;
        this.lights.key.position.set(3, 3, 3); // Reset position
        this.lights.fill1.intensity = 1.5;
        this.lights.fill2.intensity = 1.5;
        this.lights.ambient.intensity = 0.3;
        
        // Make sure chip is visible
        if (this.chipModel) this.chipModel.visible = true;
        
        this.applyMaterialToChip(this.materials.default);
    }
    
    applyVoidMode() {
        // VOID: Black hole that devours light
        this.renderer.toneMappingExposure = 0.3; // Increased from 0.05
        this.scene.background = new THREE.Color(0x000000);
        this.currentHDR = 'royal'; // Dark HDR
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        // Stronger rim lighting to see edges
        this.lights.key.intensity = 1.5; // Increased
        this.lights.key.position.set(5, 3, -2);
        this.lights.fill1.intensity = 1.0; // Increased
        this.lights.fill2.intensity = 0.5; // Added some
        this.lights.ambient.intensity = 0.05;
        
        // Make chip visible
        if (this.chipModel) this.chipModel.visible = true;
        
        this.applyMaterialToChip(this.materials.void);
    }
    
    applyXRayMode() {
        // X-RAY: Medical wireframe
        this.renderer.toneMappingExposure = 2.0;
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.currentHDR = 'studio'; // Interior HDR for medical feel
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 2;
        this.lights.fill1.intensity = 2;
        this.lights.fill2.intensity = 2;
        this.lights.ambient.intensity = 0.8;
        
        this.applyMaterialToChip(this.materials.xray);
    }
    
    applyHologramMode() {
        // HOLOGRAM: Neon green grid with glitch
        this.renderer.toneMappingExposure = 1.8;
        this.scene.background = new THREE.Color(0x000000);
        this.currentHDR = 'royal';
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 1;
        this.lights.fill1.intensity = 0.5;
        this.lights.fill2.intensity = 0.5;
        this.lights.ambient.intensity = 0.2;
        
        this.applyMaterialToChip(this.materials.hologram);
        this.glitchTimer = 0; // Reset glitch timer
    }
    
    applyShadowMode() {
        // SHADOW PLAY: Interactive lightbox
        this.renderer.toneMappingExposure = 0.8;
        this.scene.background = new THREE.Color(0x000000);
        this.scene.environment = null;
        
        // Hide main lights
        Object.values(this.lights).forEach(light => light.visible = false);
        
        // Show shadow lights (controlled by UI)
        this.shadowLights.top.visible = true;
        this.shadowLights.left.visible = true;
        this.shadowLights.right.visible = true;
        
        this.applyMaterialToChip(this.materials.shadow);
    }
    
    applySupernovaMode() {
        // SUPERNOVA: Overwhelming white with glow
        this.renderer.toneMappingExposure = 4.0; // Reduced from 8.0
        this.scene.background = new THREE.Color(0xeeeeee); // Slightly less white
        this.currentHDR = 'venice';
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 8; // Reduced
        this.lights.fill1.intensity = 6;
        this.lights.fill2.intensity = 6;
        this.lights.ambient.intensity = 2;
        
        // Make chip visible
        if (this.chipModel) this.chipModel.visible = true;
        
        this.applyMaterialToChip(this.materials.supernova);
    }
    
    applyChromeMode() {
        // CHROME: Perfect reflection (controls work!)
        this.renderer.toneMappingExposure = 2.5;
        this.scene.background = this.hdrTextures.venice;
        this.currentHDR = 'venice';
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 2;
        this.lights.fill1.intensity = 2;
        this.lights.fill2.intensity = 2;
        this.lights.ambient.intensity = 0.5;
        
        this.applyMaterialToChip(this.materials.chrome);
    }
    
    applyFractureMode() {
        // FRACTURE: Exploded in space
        this.renderer.toneMappingExposure = 1.2;
        this.scene.background = new THREE.Color(0x000000);
        this.scene.environment = this.hdrTextures.royal;
        
        this.lights.key.intensity = 3;
        this.lights.ambient.intensity = 0.3;
        
        this.fractureChip();
    }
    
    applyChaosMode() {
        // CHAOS: Multiple chips swarming
        this.renderer.toneMappingExposure = 2.0;
        this.scene.background = new THREE.Color(0x000000);
        this.currentHDR = 'venice';
        this.scene.environment = this.hdrTextures[this.currentHDR];
        
        this.lights.key.intensity = 4;
        this.lights.ambient.intensity = 0.8;
        
        this.createChaosChips();
    }
    
    applyMaterialToChip(material) {
        if (!this.chipModel) return;
        
        this.chipModel.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    }
    
    /* === FRACTURE MODE === */
    
    fractureChip() {
        if (this.isFractured || !this.chipModel) return;
        
        console.log('💥 Fracturing...');
        this.isFractured = true;
        
        const pieces = [];
        this.chipModel.traverse((child) => {
            if (child.isMesh) {
                const piece = child.clone();
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 1.0,
                    (Math.random() - 0.5) * 1.0,
                    (Math.random() - 0.5) * 1.0
                );
                piece.userData.targetOffset = offset;
                piece.userData.currentOffset = new THREE.Vector3(0, 0, 0);
                piece.userData.rotationSpeed = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                );
                this.scene.add(piece);
                pieces.push(piece);
            }
        });
        
        this.fracturedPieces = pieces;
        this.chipModel.visible = false;
    }
    
    reassembleChip() {
        if (!this.isFractured) return;
        
        this.fracturedPieces.forEach(piece => this.scene.remove(piece));
        this.fracturedPieces = [];
        
        if (this.chipModel) {
            this.chipModel.visible = true;
        }
        
        this.isFractured = false;
    }
    
    updateFractureMode() {
        if (!this.isFractured) return;
        
        this.fracturedPieces.forEach((piece, index) => {
            const offset = piece.userData.targetOffset;
            const current = piece.userData.currentOffset;
            const rotSpeed = piece.userData.rotationSpeed;
            
            // Lerp to target
            current.lerp(offset, 0.02);
            
            // Floating motion
            const bob = Math.sin(this.time * 1 + index * 0.5) * 0.1;
            piece.position.x = this.originalPosition.x + current.x;
            piece.position.y = this.originalPosition.y + current.y + bob;
            piece.position.z = this.originalPosition.z + current.z;
            
            // Rotate
            piece.rotation.x += rotSpeed.x;
            piece.rotation.y += rotSpeed.y;
            piece.rotation.z += rotSpeed.z;
        });
    }
    
    /* === CHAOS MODE === */
    
    createChaosChips() {
        const count = this.isMobile ? 5 : 12;
        
        for (let i = 0; i < count; i++) {
            const chip = this.chipModel.clone();
            const radius = 2 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            chip.position.x = radius * Math.sin(phi) * Math.cos(theta);
            chip.position.y = radius * Math.sin(phi) * Math.sin(theta);
            chip.position.z = radius * Math.cos(phi);
            
            chip.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(chip);
            
            this.chaosChips.push({
                mesh: chip,
                angle: theta,
                phi: phi,
                speed: 0.3 + Math.random() * 0.5,
                radius: radius
            });
        }
        
        // Hide original
        this.chipModel.visible = false;
    }
    
    updateChaosMode() {
        if (this.chaosChips.length === 0) return;
        
        this.chaosChips.forEach((chip, index) => {
            chip.angle += 0.01 * chip.speed;
            chip.phi += 0.005 * chip.speed;
            
            const r = chip.radius + Math.sin(this.time + index) * 0.5;
            
            chip.mesh.position.x = r * Math.sin(chip.phi) * Math.cos(chip.angle);
            chip.mesh.position.y = r * Math.sin(chip.phi) * Math.sin(chip.angle);
            chip.mesh.position.z = r * Math.cos(chip.phi);
            
            chip.mesh.rotation.y += 0.01 * chip.speed;
        });
    }
    
    /* === HOLOGRAM GLITCH === */
    
    updateHologramGlitch() {
        if (this.currentRenderMode !== 'hologram') return;
        
        this.glitchTimer += 0.016;
        
        // Random glitch every ~2 seconds
        if (this.glitchTimer > 2.0 && Math.random() > 0.95) {
            this.glitchTimer = 0;
            
            // Brief visibility flicker
            if (this.chipModel) {
                this.chipModel.visible = !this.chipModel.visible;
                setTimeout(() => {
                    if (this.chipModel) this.chipModel.visible = true;
                }, 50);
            }
        }
    }
    
    /* === SHADOW PLAY CONTROLS === */
    
    setShadowLight(key, enabled, intensity) {
        if (this.shadowLights[key]) {
            this.shadowLights[key].visible = enabled;
            this.shadowLights[key].intensity = intensity;
        }
    }
    
    /* === PUBLIC METHODS === */
    
    setAutoRotate(enabled) {
        this.autoRotate = enabled;
        this.controls.autoRotate = enabled;
    }
    
    setQuality(level) {
        this.qualityLevel = level;
        localStorage.setItem('chipQuality', level);
        
        const quality = this.qualitySettings[level];
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
        this.renderer.shadowMap.enabled = quality.shadows;
        
        console.log(`🎨 Quality: ${level}`);
    }
    
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.isMobile = window.innerWidth < 768;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= this.lastFrameTime + 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            window.dispatchEvent(new CustomEvent('stats-update', {
                detail: {
                    fps: this.fps,
                    exposure: this.renderer.toneMappingExposure
                }
            }));
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016;
        
        this.controls.update();
        this.updateFractureMode();
        this.updateChaosMode();
        this.updateHologramGlitch();
        this.updateStats();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-text">LOADING</div>
            <div class="loading-bar"></div>
        `;
        document.body.appendChild(loading);
    }
    
    hideLoading() {
        setTimeout(() => {
            const loading = document.querySelector('.loading');
            if (loading) {
                loading.classList.add('hidden');
                setTimeout(() => loading.remove(), 500);
            }
        }, 500);
    }
}

// Initialize
const chipScene = new ChipScene();
window.chipScene = chipScene;

export default chipScene;