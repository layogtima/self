// MONO VALLEY - Collaborative Zen Garden Application
const { createApp, ref, computed, onMounted, onUnmounted, nextTick } = Vue;

// Mock WebSocket for collaborative features (replace with real implementation)
class MockCollaborativeService {
  constructor() {
    this.listeners = new Map();
    this.seedBank = [
      { type: 'flower', geneticHue: 45, collaborativeData: { harmonyScore: 0.8 } },
      { type: 'tree', geneticHue: 120, collaborativeData: { harmonyScore: 0.9 } },
      { type: 'grass', geneticHue: 90, collaborativeData: { harmonyScore: 0.7 } },
      { type: 'vine', geneticHue: 60, collaborativeData: { harmonyScore: 0.85 } }
    ];
  }

  connect(callback) {
    this.callback = callback;
    // Simulate receiving collaborative seeds
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every interval
        const randomSeed = this.seedBank[Math.floor(Math.random() * this.seedBank.length)];
        this.callback('collaborative_seed', randomSeed);
      }
    }, 8000);
  }

  sendSeed(seedData) {
    // In real implementation, this would send to server
    console.log('Sharing seed with the world:', seedData);
  }

  disconnect() {
    this.callback = null;
  }
}

// Advanced Audio Engine for ASMR Experience
class ZenAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.soundEnabled = true;
    this.ambientNodes = [];
    this.zenLevel = 0;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      
      // Start ambient soundscape
      this.createAmbientLayer();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  createAmbientLayer() {
    if (!this.audioContext) return;

    // Ultra-subtle field recording simulation
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

    const noise = this.audioContext.createBufferSource();
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const ambientGain = this.audioContext.createGain();
    ambientGain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    
    noise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(this.masterGain);
    
    if (this.soundEnabled) {
      noise.start();
      this.ambientNodes.push({ node: noise, gain: ambientGain });
    }
  }

  playPlantSound(action, intensity = 1, plantType = 'flower') {
    if (!this.audioContext || !this.soundEnabled) return;

    const now = this.audioContext.currentTime;
    
    const soundConfigs = {
      plant: {
        frequency: 220 + (plantType.length * 20),
        duration: 0.3,
        type: 'sine',
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.15 }
      },
      grow: {
        frequency: 330 + (Math.random() * 100),
        duration: 0.8,
        type: 'triangle',
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.5 }
      },
      harvest: {
        frequencies: [440, 554, 659], // Beautiful major chord
        duration: 0.6,
        type: 'sine',
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }
      },
      zen: {
        frequency: 528, // Healing frequency
        duration: 2.0,
        type: 'sine',
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0 }
      },
      collaborative: {
        frequencies: [396, 528, 741], // Sacred frequencies
        duration: 1.5,
        type: 'triangle',
        envelope: { attack: 0.3, decay: 0.3, sustain: 0.7, release: 0.7 }
      }
    };

    const config = soundConfigs[action] || soundConfigs.plant;
    
    if (config.frequencies) {
      config.frequencies.forEach((freq, i) => {
        setTimeout(() => {
          this.createTone(freq, config.duration, config.type, config.envelope, intensity);
        }, i * 150);
      });
    } else {
      this.createTone(config.frequency, config.duration, config.type, config.envelope, intensity);
    }
  }

  createTone(frequency, duration, type, envelope, intensity = 1) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Create warm, analog-like tone
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    // Add subtle detuning for organic feel
    const detune = (Math.random() - 0.5) * 10;
    oscillator.detune.setValueAtTime(detune, this.audioContext.currentTime);

    // Warm low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
    filter.Q.setValueAtTime(1, this.audioContext.currentTime);

    // ADSR Envelope
    const now = this.audioContext.currentTime;
    const { attack, decay, sustain, release } = envelope;
    const maxGain = 0.15 * intensity;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + attack);
    gainNode.gain.linearRampToValueAtTime(maxGain * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(maxGain * sustain, now + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect audio graph
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  setZenLevel(level) {
    this.zenLevel = Math.max(0, Math.min(1, level));
    
    if (this.ambientNodes.length > 0) {
      const ambientVolume = 0.02 + (this.zenLevel * 0.03);
      this.ambientNodes.forEach(({ gain }) => {
        gain.gain.linearRampToValueAtTime(ambientVolume, this.audioContext.currentTime + 1);
      });
    }
  }

  toggle() {
    this.soundEnabled = !this.soundEnabled;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.soundEnabled ? 0.3 : 0, 
        this.audioContext.currentTime
      );
    }
    return this.soundEnabled;
  }

  cleanup() {
    this.ambientNodes.forEach(({ node }) => {
      try {
        node.stop();
      } catch (e) {
        // Node might already be stopped
      }
    });
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Main Application
createApp({
  setup() {
    // Core State
    const selectedSeed = ref(null);
    const soundEnabled = ref(true);
    const zenMode = ref(false);
    const notifications = ref([]);
    const floatingSeeds = ref([]);
    const garden = ref([]);
    const gameTime = ref(0);
    const zenScore = ref(0);

    // Services
    let audioEngine = null;
    let collaborativeService = null;
    let gameInterval = null;
    let zenInterval = null;

    // Seed Types Configuration
    const seedTypes = {
      flower: { icon: '🌸', growthTime: 6, harvestYield: 'beauty' },
      tree: { icon: '🌳', growthTime: 12, harvestYield: 'wisdom' },
      grass: { icon: '🌱', growthTime: 4, harvestYield: 'peace' },
      vine: { icon: '🍃', growthTime: 8, harvestYield: 'connection' }
    };

    // Computed Properties
    const plantsInGarden = computed(() => {
      return garden.value.filter(plot => plot.plant).length;
    });

    const harmonyScore = computed(() => {
      if (plantsInGarden.value === 0) return 0;
      
      const plantTypes = new Set();
      const collaborativePlants = garden.value.filter(plot => 
        plot.plant && plot.plant.isCollaborative
      ).length;
      
      garden.value.forEach(plot => {
        if (plot.plant) plantTypes.add(plot.plant.type);
      });
      
      const diversity = plantTypes.size / Object.keys(seedTypes).length;
      const collaboration = collaborativePlants / plantsInGarden.value;
      
      return Math.round((diversity * 0.6 + collaboration * 0.4) * 100);
    });

    // Initialize Game
    const initializeGame = async () => {
      // Create 8x8 garden grid
      garden.value = Array.from({ length: 64 }, (_, index) => ({
        id: index,
        plant: null,
        canPlant: true,
        isHovered: false,
        soilQuality: Math.random() * 0.3 + 0.7, // 0.7-1.0
        lastActivity: null
      }));

      // Add some initial variety to soil
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * 64);
        garden.value[randomIndex].soilQuality = Math.random() * 0.2 + 0.9; // Premium soil
      }

      // Initialize audio
      audioEngine = new ZenAudioEngine();
      await audioEngine.initialize();

      // Initialize collaborative service
      collaborativeService = new MockCollaborativeService();
      collaborativeService.connect((event, data) => {
        if (event === 'collaborative_seed') {
          receiveCollaborativeSeed(data);
        }
      });

      // Start game loops
      startGameLoop();
      startZenTracking();
      
      // Initial floating seeds
      generateFloatingSeeds();
    };

    // Game Loop Management
    const startGameLoop = () => {
      gameInterval = setInterval(() => {
        gameTime.value++;
        updatePlantGrowth();
        updateFloatingSeeds();
        checkZenState();
      }, 2000); // Every 2 seconds
    };

    const startZenTracking = () => {
      zenInterval = setInterval(() => {
        const currentHarmony = harmonyScore.value;
        const plantDiversity = new Set(
          garden.value.filter(p => p.plant).map(p => p.plant.type)
        ).size;
        
        // Zen calculation based on harmony and engagement
        if (currentHarmony > 70 && plantDiversity >= 3) {
          zenScore.value = Math.min(100, zenScore.value + 2);
        } else {
          zenScore.value = Math.max(0, zenScore.value - 1);
        }
        
        // Update zen mode
        const newZenMode = zenScore.value > 60;
        if (newZenMode !== zenMode.value) {
          zenMode.value = newZenMode;
          if (newZenMode) {
            showNotification('✨ Flow state activated', 'zen');
            audioEngine?.playPlantSound('zen');
            audioEngine?.setZenLevel(zenScore.value / 100);
          }
        }
      }, 5000); // Every 5 seconds
    };

    // Plant Management
    const selectSeed = (seedType) => {
      selectedSeed.value = selectedSeed.value === seedType ? null : seedType;
      audioEngine?.playPlantSound('click');
      
      if (selectedSeed.value) {
        showNotification(`Selected ${seedType} seed 🌱`, 'info');
      } else {
        showNotification('Seed deselected', 'info');
      }
    };
    const handlePlotClick = async (plotIndex) => {
      const plot = garden.value[plotIndex];
      
      if (plot.plant && plot.plant.stage >= 3) {
        // Harvest mature plant
        harvestPlant(plotIndex);
      } else if (selectedSeed.value && plot.canPlant && !plot.plant) {
        // Plant new seed
        await plantSeed(plotIndex);
      } else if (plot.plant) {
        // Show plant info for growing plants
        showNotification(`${plot.plant.type} is growing... Stage ${plot.plant.stage}/3`, 'info');
      } else if (!selectedSeed.value) {
        // No seed selected
        showNotification('Select a seed first! (1-4 keys)', 'info');
      }
    };

    const plantSeed = async (plotIndex) => {
      if (!selectedSeed.value) return;
      
      const plot = garden.value[plotIndex];
      if (!plot.canPlant || plot.plant) return;

      const seedConfig = seedTypes[selectedSeed.value];
      const newPlant = {
        type: selectedSeed.value,
        stage: 0,
        plantTime: gameTime.value,
        geneticHue: Math.random() * 360,
        isSwaying: false,
        isCollaborative: false,
        growthRate: plot.soilQuality * (0.8 + Math.random() * 0.4),
        id: `plant_${Date.now()}_${plotIndex}`
      };

      plot.plant = newPlant;
      plot.canPlant = false;
      plot.lastActivity = gameTime.value;

      audioEngine?.playPlantSound('plant', 1, selectedSeed.value);
      
      // Create planting particle effect
      createPlantingEffect(plotIndex);
      
      // Show confirmation
      showNotification(`Planted ${selectedSeed.value}! 🌱`, 'success');
      
      selectedSeed.value = null;
      
      await nextTick();
      
      // Check for beautiful arrangements and share seeds
      setTimeout(() => {
        checkForSeedSharing(plotIndex);
      }, 1000);
    };

    const updatePlantGrowth = () => {
      garden.value.forEach(plot => {
        if (!plot.plant) return;

        const plant = plot.plant;
        const timeSincePlanting = gameTime.value - plant.plantTime;
        const baseGrowthTime = seedTypes[plant.type].growthTime;
        
        // Calculate growth progress with soil quality and zen bonuses
        let growthMultiplier = plot.soilQuality;
        if (zenMode.value) growthMultiplier *= 1.3;
        
        const growthProgress = (timeSincePlanting * growthMultiplier) / baseGrowthTime;
        const newStage = Math.min(3, Math.floor(growthProgress * 3));

        if (newStage > plant.stage) {
          plant.stage = newStage;
          plant.isSwaying = true;
          
          audioEngine?.playPlantSound('grow', plant.stage / 3, plant.type);
          
          // Growth particle effect
          setTimeout(() => {
            plant.isSwaying = false;
          }, 2000);

          if (plant.stage === 3) {
            // Plant is ready for harvest
            showNotification(`${plant.type} is ready! ✨`, 'success');
          }
        }
      });
    };

    const harvestPlant = async (plotIndex) => {
      const plot = garden.value[plotIndex];
      if (!plot.plant || plot.plant.stage < 3) return;

      const plant = plot.plant;
      
      // Create harvest effects
      createHarvestEffect(plotIndex, plant);
      
      // Share beautiful plants with the world
      if (harmonyScore.value > 50) {
        shareSeedWithWorld(plant);
      }

      audioEngine?.playPlantSound('harvest', 1, plant.type);
      
      // Remove plant and reset plot
      plot.plant = null;
      plot.canPlant = true;
      plot.lastActivity = gameTime.value;

      showNotification(`Harvested ${plant.type} ✨`, 'success');
    };

    // Collaborative Features
    const receiveCollaborativeSeed = (seedData) => {
      // Add to floating seeds with special collaborative marker
      const collaborativeSeed = {
        id: `collab_${Date.now()}`,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20,
        type: 'collaborative',
        seedData: seedData,
        delay: Math.random() * 2,
        duration: 15 + Math.random() * 5
      };

      floatingSeeds.value.push(collaborativeSeed);
      
      showNotification('🌟 Inspiration from another gardener', 'collaborative');
      audioEngine?.playPlantSound('collaborative');

      // Auto-remove after animation
      setTimeout(() => {
        const index = floatingSeeds.value.findIndex(s => s.id === collaborativeSeed.id);
        if (index > -1) floatingSeeds.value.splice(index, 1);
      }, (collaborativeSeed.duration * 1000));
    };

    const shareSeedWithWorld = (plant) => {
      if (!collaborativeService) return;

      const seedData = {
        type: plant.type,
        geneticHue: plant.geneticHue,
        harmonyScore: harmonyScore.value,
        zenLevel: zenScore.value,
        aesthetic: calculateAestheticScore(plant)
      };

      collaborativeService.sendSeed(seedData);
      showNotification('🌍 Shared beauty with the world', 'collaborative');
    };

    const checkForSeedSharing = (plotIndex) => {
      // Check if this new plant creates a beautiful pattern
      const surroundingPlots = getSurroundingPlots(plotIndex);
      const diversity = new Set(surroundingPlots
        .filter(p => p.plant)
        .map(p => p.plant.type)
      ).size;

      if (diversity >= 3 && harmonyScore.value > 60) {
        // This arrangement is beautiful, share it
        const centerPlant = garden.value[plotIndex].plant;
        if (centerPlant) {
          setTimeout(() => shareSeedWithWorld(centerPlant), 2000);
        }
      }
    };

    // Visual Effects
    const createPlantingEffect = (plotIndex) => {
      // This would create particle effects in a real implementation
      const plot = garden.value[plotIndex];
      plot.lastActivity = gameTime.value;
    };

    const createHarvestEffect = (plotIndex, plant) => {
      // Create floating harvest particles
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const particle = {
            id: `harvest_${Date.now()}_${i}`,
            x: (plotIndex % 8) * (window.innerWidth / 8) + Math.random() * 50,
            y: Math.floor(plotIndex / 8) * 50 + 200,
            type: 'harvest',
            delay: i * 0.2,
            duration: 2
          };
          
          floatingSeeds.value.push(particle);
          
          setTimeout(() => {
            const index = floatingSeeds.value.findIndex(s => s.id === particle.id);
            if (index > -1) floatingSeeds.value.splice(index, 1);
          }, 2500);
        }, i * 200);
      }
    };

    // Utility Functions
    const getSurroundingPlots = (plotIndex) => {
      const row = Math.floor(plotIndex / 8);
      const col = plotIndex % 8;
      const surrounding = [];

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 0 && r < 8 && c >= 0 && c < 8 && !(r === row && c === col)) {
            surrounding.push(garden.value[r * 8 + c]);
          }
        }
      }

      return surrounding;
    };

    const calculateAestheticScore = (plant) => {
      // Simple aesthetic calculation based on plant properties
      return Math.round((plant.stage / 3) * 50 + (plant.growthRate * 50));
    };

    const generateFloatingSeeds = () => {
      // Generate ambient floating seeds
      setInterval(() => {
        if (floatingSeeds.value.length < 5) {
          const seed = {
            id: `ambient_${Date.now()}`,
            x: Math.random() * window.innerWidth,
            type: 'ambient',
            delay: Math.random() * 3,
            duration: 20 + Math.random() * 10
          };
          
          floatingSeeds.value.push(seed);
          
          setTimeout(() => {
            const index = floatingSeeds.value.findIndex(s => s.id === seed.id);
            if (index > -1) floatingSeeds.value.splice(index, 1);
          }, seed.duration * 1000);
        }
      }, 5000);
    };

    const updateFloatingSeeds = () => {
      // Clean up expired seeds
      floatingSeeds.value = floatingSeeds.value.filter(seed => {
        const age = Date.now() - parseInt(seed.id.split('_')[1]);
        return age < seed.duration * 1000;
      });
    };

    const checkZenState = () => {
      // Update zen level based on garden harmony
      if (audioEngine) {
        audioEngine.setZenLevel(zenScore.value / 100);
      }
    };

    // Event Handlers
    const handlePlotHover = (plotIndex) => {
      garden.value[plotIndex].isHovered = true;
    };

    const handlePlotLeave = (plotIndex) => {
      garden.value[plotIndex].isHovered = false;
    };

    const toggleSound = () => {
      if (audioEngine) {
        soundEnabled.value = audioEngine.toggle();
      }
    };

    // Notification System
    const showNotification = (message, type = 'info') => {
      const notification = {
        id: Date.now(),
        message,
        type
      };

      notifications.value.push(notification);

      setTimeout(() => {
        const index = notifications.value.findIndex(n => n.id === notification.id);
        if (index > -1) notifications.value.splice(index, 1);
      }, type === 'zen' ? 5000 : 3000);
    };

    // Visual Helpers
    const getPlotBackground = (plot) => {
      if (plot.plant) return '';
      
      const quality = plot.soilQuality;
      if (quality > 0.9) return 'bg-amber-50';
      if (quality > 0.8) return 'bg-green-50';
      return 'bg-gray-50';
    };

    const getPlantVisual = (plant) => {
      const config = seedTypes[plant.type];
      if (plant.stage === 0) return '🌱';
      if (plant.stage === 1) return config.icon.replace(/[🌸🌳🌱🍃]/, '🌿');
      if (plant.stage === 2) return config.icon;
      return config.icon + (plant.isCollaborative ? '✨' : '');
    };

    // Lifecycle
    onMounted(async () => {
      await initializeGame();

      // Keyboard shortcuts
      const handleKeyDown = (event) => {
        switch(event.key) {
          case '1': selectSeed('flower'); break;
          case '2': selectSeed('tree'); break;
          case '3': selectSeed('grass'); break;
          case '4': selectSeed('vine'); break;
          case 'Escape': selectedSeed.value = null; break;
          case ' ': 
            event.preventDefault();
            toggleSound(); 
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    });

    onUnmounted(() => {
      if (gameInterval) clearInterval(gameInterval);
      if (zenInterval) clearInterval(zenInterval);
      if (audioEngine) audioEngine.cleanup();
      if (collaborativeService) collaborativeService.disconnect();
    });

    // Return reactive state and methods
    return {
      // State
      selectedSeed,
      soundEnabled,
      zenMode,
      notifications,
      floatingSeeds,
      garden,
      seedTypes,
      harmonyScore,
      zenScore,
      
      // Methods
      selectSeed,
      handlePlotClick,
      handlePlotHover,
      handlePlotLeave,
      toggleSound,
      getPlotBackground,
      getPlantVisual,
      
      // Computed
      plantsInGarden
    };
  }
}).mount('#app');