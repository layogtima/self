/* ============================================
   APP.JS v1.0 - Vue Control Center
   UI meets 3D and they make beautiful chaos
   ============================================ */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // UI State
            sidebarVisible: true,
            
            // Scene Management
            currentSceneIndex: 0,
            scenes: [
                {
                    id: 'default',
                    name: 'DEFAULT',
                    subtitle: 'CLEAN VIEW',
                    description: 'Balanced lighting and neutral presentation. See every detail with smooth, intuitive controls.',
                    renderMode: 'default'
                },
                {
                    id: 'void',
                    name: 'VOID',
                    subtitle: 'LIGHT-DEVOURING SINGULARITY',
                    description: 'Dark HDR environment. The chip becomes a black hole, consuming light itself. Reality bends inward.',
                    renderMode: 'void'
                },
                {
                    id: 'xray',
                    name: 'X-RAY',
                    subtitle: 'MEDICAL PRECISION',
                    description: 'Clinical wireframe analysis. Every vertex exposed. Medical room HDR for that sterile laboratory aesthetic.',
                    renderMode: 'xray'
                },
                {
                    id: 'hologram',
                    name: 'HOLOGRAM',
                    subtitle: 'PROJECTED UNREALITY',
                    description: 'Neon green grid with glitch effects. The chip exists between states, flickering in and out of our dimension.',
                    renderMode: 'hologram'
                },
                {
                    id: 'shadow',
                    name: 'SHADOW PLAY',
                    subtitle: 'DYNAMIC LIGHTBOX',
                    description: 'Interactive lighting control. Toggle lights from all sides. Adjust intensity. Play with shadows. You are the director.',
                    renderMode: 'shadow'
                },
                {
                    id: 'supernova',
                    name: 'SUPERNOVA',
                    subtitle: 'OVERWHELMING RADIANCE',
                    description: 'Pure white void. The chip glows with unearthly emissive energy. Staring into infinity feels like this.',
                    renderMode: 'supernova'
                },
                {
                    id: 'chrome',
                    name: 'CHROME',
                    subtitle: 'PERFECT REFLECTION',
                    description: 'Mirror-finished surface. The chip becomes its environment. Venice sunset reflected infinitely.',
                    renderMode: 'chrome'
                },
                {
                    id: 'fracture',
                    name: 'FRACTURE',
                    subtitle: 'CONTROLLED DEMOLITION',
                    description: 'Floating in deep space. The chip explodes into constituent parts. Pieces drift in zero gravity.',
                    renderMode: 'fracture'
                },
                {
                    id: 'chaos',
                    name: 'CHAOS',
                    subtitle: 'INFINITE MULTIPLICATION',
                    description: 'Multiple chips swarm like electrons around a nucleus. Reality has given up. The singularity is chips.',
                    renderMode: 'chaos'
                }
            ],
            
            // Shadow Play Light Controls
            shadowLights: [
                { name: 'TOP LIGHT', key: 'top', enabled: true, intensity: 5 },
                { name: 'BOTTOM LIGHT', key: 'bottom', enabled: false, intensity: 3 },
                { name: 'LEFT LIGHT', key: 'left', enabled: true, intensity: 4 },
                { name: 'RIGHT LIGHT', key: 'right', enabled: true, intensity: 4 }
            ],
            
            // Control States
            autoRotate: false,
            quality: localStorage.getItem('chipQuality') || 'HIGH',
            
            // Stats
            fps: 0,
            exposure: 0.1
        }
    },
    
    computed: {
        currentScene() {
            return this.scenes[this.currentSceneIndex];
        }
    },
    
    mounted() {
        console.log('🎮 Vue app mounted. UI online.');
        
        // Listen for scene ready
        window.addEventListener('scene-ready', () => {
            console.log('✨ Three.js scene ready. Starting sync.');
            this.switchScene(0); // Initialize first scene
        });
        
        // Listen for stats updates
        window.addEventListener('stats-update', (event) => {
            this.fps = event.detail.fps;
            this.exposure = event.detail.exposure;
        });
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    },
    
    methods: {
        toggleSidebar() {
            this.sidebarVisible = !this.sidebarVisible;
        },
        
        switchScene(index) {
            if (index === this.currentSceneIndex) return;
            
            this.currentSceneIndex = index;
            const scene = this.scenes[index];
            
            console.log(`🎬 Switching to: ${scene.name}`);
            
            // Notify Three.js
            if (window.chipScene) {
                window.chipScene.changeRenderMode(scene.renderMode);
            }
        },
        
        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate;
            
            if (window.chipScene) {
                window.chipScene.setAutoRotate(this.autoRotate);
            }
            
            console.log(`🔄 Auto-rotate: ${this.autoRotate ? 'ON' : 'OFF'}`);
        },
        
        resetChip() {
            if (window.chipScene) {
                window.chipScene.resetPosition();
            }
            
            console.log('↻ Position reset');
        },
        
        setQuality(level) {
            this.quality = level;
            
            if (window.chipScene) {
                window.chipScene.setQuality(level);
            }
            
            console.log(`🎨 Quality set to: ${level}`);
        },
        
        // Shadow Play Light Controls
        toggleLight(key) {
            const light = this.shadowLights.find(l => l.key === key);
            if (light) {
                light.enabled = !light.enabled;
                
                if (window.chipScene) {
                    window.chipScene.setShadowLight(key, light.enabled, light.intensity);
                }
            }
        },
        
        updateLightIntensity(key, intensity) {
            if (window.chipScene) {
                window.chipScene.setShadowLight(key, true, parseFloat(intensity));
            }
        },
        
        setupKeyboardShortcuts() {
            window.addEventListener('keydown', (event) => {
                // H: Toggle sidebar
                if (event.code === 'KeyH') {
                    event.preventDefault();
                    this.toggleSidebar();
                }
                
                // Space: Toggle auto-rotate
                if (event.code === 'Space') {
                    event.preventDefault();
                    this.toggleAutoRotate();
                }
                
                // R: Reset
                if (event.code === 'KeyR') {
                    event.preventDefault();
                    this.resetChip();
                }
                
                // Number keys 1-9: Switch scenes
                if (event.code.startsWith('Digit')) {
                    const num = parseInt(event.code.replace('Digit', ''));
                    if (num >= 1 && num <= this.scenes.length) {
                        this.switchScene(num - 1);
                    }
                }
                
                // Arrow keys: Navigate scenes
                if (event.code === 'ArrowRight') {
                    const nextIndex = (this.currentSceneIndex + 1) % this.scenes.length;
                    this.switchScene(nextIndex);
                }
                if (event.code === 'ArrowLeft') {
                    const prevIndex = (this.currentSceneIndex - 1 + this.scenes.length) % this.scenes.length;
                    this.switchScene(prevIndex);
                }
            });
        }
    }
});

// Mount
app.mount('#app');
window.vueApp = app;

console.log('🎭 Vue app initialized.');
console.log('⌨️  Shortcuts: H (menu) | SPACE (rotate) | R (reset) | 1-9 (scenes) | ← → (navigate)');