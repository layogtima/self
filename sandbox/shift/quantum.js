// Sound effects using the Web Audio API
const createSound = (() => {
  let audioContext;

  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  };

  return {
    // Quantum collapse sound
    collapse: () => {
      try {
        const ctx = initAudio();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.error("Audio error:", e);
      }
    },

    // Level complete sound
    complete: () => {
      try {
        const ctx = initAudio();
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
        oscillator1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5

        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(523.25 / 2, ctx.currentTime); // C4
        oscillator2.frequency.setValueAtTime(659.25 / 2, ctx.currentTime + 0.2); // E4
        oscillator2.frequency.setValueAtTime(783.99 / 2, ctx.currentTime + 0.4); // G4

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(ctx.currentTime + 0.8);
        oscillator2.stop(ctx.currentTime + 0.8);
      } catch (e) {
        console.error("Audio error:", e);
      }
    },

    // Error sound
    error: () => {
      try {
        const ctx = initAudio();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.error("Audio error:", e);
      }
    },

    // Start game sound
    start: () => {
      try {
        const ctx = initAudio();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime + 0.1); // E4
        oscillator.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.3); // C5

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
      } catch (e) {
        console.error("Audio error:", e);
      }
    },

    // Entanglement sound
    entangle: () => {
      try {
        const ctx = initAudio();
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(440, ctx.currentTime);

        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(443, ctx.currentTime); // Slight beat frequency

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(ctx.currentTime + 0.5);
        oscillator2.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.error("Audio error:", e);
      }
    }
  };
})();

// Create the Vue app
const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // Game state
    const gameState = ref('start'); // start, playing, complete, levelComplete
    const level = ref(1);
    const maxLevel = 10;
    const observationsLeft = ref(0);
    const timer = ref(0);
    const maxTime = ref(60); // seconds
    const timerInterval = ref(null);

    // Game grid
    const gridSize = ref(4); // 4x4 grid
    const grid = ref([]);

    // Wave animation
    const waves = ref([]);

    // Entangled blocks
    const entangledPairs = ref([]);

    // Current level objective
    const objective = ref({
      pattern: [], // Required pattern of states
      description: ''
    });

    // Initialize grid
    const initGrid = () => {
      grid.value = [];
      for (let i = 0; i < gridSize.value; i++) {
        for (let j = 0; j < gridSize.value; j++) {
          // Each block has multiple potential states
          grid.value.push({
            id: `${i}-${j}`,
            row: i,
            col: j,
            // Quantum state: superposition of multiple states until observed
            quantum: true,
            // Possible states: 0 = empty, 1 = filled, 2 = special
            possibleStates: [0, 1, 2],
            // Current state (only defined when quantum = false)
            state: null,
            // Probability weights for each state
            probabilities: [0.33, 0.33, 0.34],
            // Visual properties for animation
            rotation: Math.random() * 360,
            entangled: false,
            entangledWith: null
          });
        }
      }
    };

    // Set level objectives
    const setLevelObjective = () => {
      switch (level.value) {
        case 1:
          objective.value = {
            pattern: [
              [0, 0, 0, 0],
              [0, 1, 1, 0],
              [0, 1, 1, 0],
              [0, 0, 0, 0]
            ],
            description: "Create a 2x2 square of filled blocks in the center"
          };
          observationsLeft.value = 6;
          maxTime.value = 60;
          break;
        case 2:
          objective.value = {
            pattern: [
              [0, 1, 1, 0],
              [1, 0, 0, 1],
              [1, 0, 0, 1],
              [0, 1, 1, 0]
            ],
            description: "Create a hollow square"
          };
          observationsLeft.value = 8;
          maxTime.value = 60;
          break;
        case 3:
          objective.value = {
            pattern: [
              [1, 0, 0, 1],
              [0, 1, 1, 0],
              [0, 1, 1, 0],
              [1, 0, 0, 1]
            ],
            description: "Create a checkerboard pattern of filled blocks"
          };
          observationsLeft.value = 8;
          maxTime.value = 75;
          setupEntanglement(2); // Add entangled pairs
          break;
        case 4:
          objective.value = {
            pattern: [
              [0, 0, 0, 0],
              [0, 2, 2, 0],
              [0, 2, 2, 0],
              [0, 0, 0, 0]
            ],
            description: "Create a 2x2 square of special blocks in the center"
          };
          observationsLeft.value = 6;
          maxTime.value = 60;
          break;
        case 5:
          objective.value = {
            pattern: [
              [1, 1, 1, 1],
              [1, 0, 0, 1],
              [1, 0, 0, 1],
              [1, 1, 1, 1]
            ],
            description: "Create a hollow square with filled blocks"
          };
          observationsLeft.value = 10;
          maxTime.value = 75;
          setupEntanglement(3);
          break;
        default:
          // Generate random objectives for higher levels
          generateRandomObjective();
          break;
      }

      // Adjust probabilities based on objective
      adjustProbabilities();
    };

    // Setup entangled pairs
    const setupEntanglement = (numPairs) => {
      entangledPairs.value = [];

      const availableBlocks = [...grid.value];

      for (let i = 0; i < numPairs; i++) {
        if (availableBlocks.length < 2) break;

        // Select two random blocks
        const idx1 = Math.floor(Math.random() * availableBlocks.length);
        const block1 = availableBlocks.splice(idx1, 1)[0];

        const idx2 = Math.floor(Math.random() * availableBlocks.length);
        const block2 = availableBlocks.splice(idx2, 1)[0];

        // Entangle them
        block1.entangled = true;
        block1.entangledWith = block2.id;

        block2.entangled = true;
        block2.entangledWith = block1.id;

        entangledPairs.value.push([block1, block2]);
      }
    };

    // Generate random objective for higher levels
    const generateRandomObjective = () => {
      const pattern = Array(gridSize.value).fill().map(() => Array(gridSize.value).fill(0));
      let description = "";

      // Increase difficulty with level
      observationsLeft.value = 6 + Math.floor(level.value * 0.7);
      maxTime.value = 60 + level.value * 5;

      // Add entangled pairs
      setupEntanglement(Math.min(3, Math.floor(level.value / 2)));

      // Randomize objective types based on level
      const objectiveType = Math.floor(Math.random() * 5);

      switch (objectiveType) {
        case 0: // Diagonal line
          for (let i = 0; i < gridSize.value; i++) {
            pattern[i][i] = 1;
          }
          description = "Create a diagonal line of filled blocks";
          break;
        case 1: // Cross
          for (let i = 0; i < gridSize.value; i++) {
            pattern[i][i] = 1;
            pattern[i][gridSize.value - 1 - i] = 1;
          }
          description = "Create a cross of filled blocks";
          break;
        case 2: // Checkerboard
          for (let i = 0; i < gridSize.value; i++) {
            for (let j = 0; j < gridSize.value; j++) {
              if ((i + j) % 2 === 0) {
                pattern[i][j] = 1;
              }
            }
          }
          description = "Create a checkerboard pattern";
          break;
        case 3: // Special blocks in corners
          pattern[0][0] = 2;
          pattern[0][gridSize.value - 1] = 2;
          pattern[gridSize.value - 1][0] = 2;
          pattern[gridSize.value - 1][gridSize.value - 1] = 2;
          description = "Create special blocks in all four corners";
          break;
        case 4: // Border
          for (let i = 0; i < gridSize.value; i++) {
            pattern[0][i] = 1;
            pattern[gridSize.value - 1][i] = 1;
            pattern[i][0] = 1;
            pattern[i][gridSize.value - 1] = 1;
          }
          description = "Create a border of filled blocks";
          break;
      }

      objective.value = {
        pattern,
        description
      };
    };

    // Adjust block probabilities based on objective
    const adjustProbabilities = () => {
      // Flatten the objective pattern
      const flatPattern = objective.value.pattern.flat();

      grid.value.forEach((block, index) => {
        const targetState = flatPattern[index];

        // Slightly bias probabilities toward the target state
        // But keep it unpredictable for the player
        const bias = 0.2; // How much to bias toward the correct state

        if (targetState === 0) {
          block.probabilities = [0.33 + bias, 0.33, 0.34 - bias];
        } else if (targetState === 1) {
          block.probabilities = [0.33, 0.33 + bias, 0.34 - bias];
        } else {
          block.probabilities = [0.33, 0.33 - bias, 0.34 + bias];
        }
      });
    };

    // Observe (collapse) a block
    const observeBlock = (block) => {
      if (!block.quantum || gameState.value !== 'playing' || observationsLeft.value <= 0) {
        if (observationsLeft.value <= 0) {
          createSound.error();
        }
        return;
      }

      // Create wave animation
      waves.value.push({
        id: `wave-${Date.now()}`,
        x: block.col * (100 / gridSize.value) + (100 / gridSize.value / 2),
        y: block.row * (100 / gridSize.value) + (100 / gridSize.value / 2),
        time: Date.now()
      });

      // Collapse quantum state
      block.quantum = false;

      // Determine state based on probabilities
      const rand = Math.random();
      let cumulativeProbability = 0;

      for (let i = 0; i < block.possibleStates.length; i++) {
        cumulativeProbability += block.probabilities[i];
        if (rand < cumulativeProbability) {
          block.state = block.possibleStates[i];
          break;
        }
      }

      createSound.collapse();

      // If block is entangled, collapse its partner with opposite state
      if (block.entangled) {
        const partner = grid.value.find(b => b.id === block.entangledWith);
        if (partner && partner.quantum) {
          partner.quantum = false;

          // Entangled blocks have opposite states (0→1, 1→0, 2→2)
          if (block.state === 0) partner.state = 1;
          else if (block.state === 1) partner.state = 0;
          else partner.state = 2;

          setTimeout(() => {
            createSound.entangle();
          }, 150);
        }
      } else {
        // Decrement observations only for non-entangled blocks
        // (You get entangled collapses for "free")
        observationsLeft.value--;
      }

      // Check if level is complete
      checkLevelComplete();
    };

    // Check if the level objective has been met
    const checkLevelComplete = () => {
      // First check if all required blocks have been observed
      const requiredPattern = objective.value.pattern.flat();

      for (let i = 0; i < grid.value.length; i++) {
        const block = grid.value[i];
        const requiredState = requiredPattern[i];

        // If this position requires a non-empty state
        if (requiredState !== 0) {
          // If block is still in quantum state or doesn't match required state
          if (block.quantum || block.state !== requiredState) {
            return; // Level not complete
          }
        }
      }

      // Level complete!
      gameState.value = 'levelComplete';
      clearInterval(timerInterval.value);
      createSound.complete();
    };

    // Start the timer
    const startTimer = () => {
      clearInterval(timerInterval.value);
      timer.value = maxTime.value;

      timerInterval.value = setInterval(() => {
        if (timer.value > 0) {
          timer.value--;
        } else {
          clearInterval(timerInterval.value);
          if (gameState.value === 'playing') {
            gameState.value = 'gameOver';
            createSound.error();
          }
        }
      }, 1000);
    };

    // Start a new level
    const startLevel = () => {
      gameState.value = 'playing';
      initGrid();
      setLevelObjective();
      startTimer();
      createSound.start();
    };

    // Progress to next level
    const nextLevel = () => {
      if (level.value < maxLevel) {
        level.value++;
        startLevel();
      } else {
        gameState.value = 'complete';
      }
    };

    // Restart the game
    const restartGame = () => {
      level.value = 1;
      startLevel();
    };

    // Computed properties
    const flattenedObjective = computed(() => {
      return objective.value.pattern.flat();
    });

    const gridTemplateStyle = computed(() => {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.value}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize.value}, 1fr)`,
        gap: '4px',
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1/1'
      };
    });

    // Clean up waves after they finish animating
    watch(waves, (newWaves) => {
      if (newWaves.length > 0) {
        const now = Date.now();
        waves.value = newWaves.filter(wave => (now - wave.time) < 1000);
      }
    });

    // Initialize
    onMounted(() => {
      // Add keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.key === 'r' && (gameState.value === 'gameOver' || gameState.value === 'levelComplete')) {
          if (gameState.value === 'gameOver') {
            startLevel(); // Restart current level
          } else {
            nextLevel(); // Go to next level
          }
        }
      });
    });

    return {
      gameState,
      level,
      maxLevel,
      observationsLeft,
      timer,
      maxTime,
      grid,
      gridSize,
      objective,
      waves,
      entangledPairs,
      flattenedObjective,
      gridTemplateStyle,
      observeBlock,
      startLevel,
      nextLevel,
      restartGame
    };
  },
  template: `
      <div class="w-full h-full flex flex-col items-center justify-center p-4">
        <!-- Start Screen -->
        <div v-if="gameState === 'start'" class="text-center z-10">
          <h1 class="text-5xl md:text-6xl font-bold mb-6 glow animate-glow">QUANTUM SHIFT</h1>
          <p class="text-xl mb-8 max-w-lg mx-auto">
            Collapse quantum blocks to create patterns, but choose wisely - observation changes reality!
          </p>
          <button @click="startLevel" class="px-8 py-3 text-2xl font-bold bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all duration-300">
            START EXPERIMENT
          </button>
        </div>
        
        <!-- Game Over Screen -->
        <div v-if="gameState === 'gameOver'" class="text-center z-10">
          <h1 class="text-5xl font-bold mb-4 text-neon-pink">EXPERIMENT FAILED</h1>
          <p class="text-xl mb-8">Quantum coherence lost. Time or observations depleted.</p>
          <button @click="startLevel" class="px-6 py-2 text-xl font-bold bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black transition-all duration-300">
            RETRY EXPERIMENT
          </button>
        </div>
        
        <!-- Level Complete Screen -->
        <div v-if="gameState === 'levelComplete'" class="text-center z-10">
          <h1 class="text-5xl font-bold mb-4 text-neon-green glow">PATTERN ACHIEVED</h1>
          <p class="text-xl mb-2">Level {{ level }} Complete</p>
          <p class="text-lg mb-8" v-if="level < maxLevel">Prepare for next quantum challenge</p>
          <button @click="nextLevel" class="px-6 py-2 text-xl font-bold bg-transparent border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black transition-all duration-300">
            {{ level < maxLevel ? 'NEXT LEVEL' : 'COMPLETE!' }}
          </button>
        </div>
        
        <!-- Game Complete Screen -->
        <div v-if="gameState === 'complete'" class="text-center z-10">
          <h1 class="text-5xl font-bold mb-4 text-neon-purple glow">QUANTUM MASTERY</h1>
          <p class="text-xl mb-8">You've mastered all quantum patterns!</p>
          <button @click="restartGame" class="px-6 py-2 text-xl font-bold bg-transparent border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black transition-all duration-300">
            RESTART EXPERIMENTS
          </button>
        </div>
        
        <!-- Game Board -->
        <div v-if="gameState === 'playing'" class="flex flex-col items-center">
          <!-- Level Info -->
          <div class="mb-6 text-center">
            <h2 class="text-2xl font-bold">LEVEL {{ level }}</h2>
            <p class="text-lg mb-2">{{ objective.description }}</p>
            <div class="flex justify-between w-full max-w-md px-4">
              <div><div class="flex justify-between w-full max-w-md px-4">
            <div class="text-neon-yellow">
              <span class="opacity-70">OBSERVATIONS:</span> {{ observationsLeft }}
            </div>
            <div class="text-neon-pink">
              <span class="opacity-70">TIME:</span> {{ timer }}s
            </div>
          </div>
        </div>
        
        <!-- Game Grid -->
        <div class="relative">
          <!-- Wave Animations -->
          <div v-for="wave in waves" :key="wave.id" class="observation-wave absolute z-20"
            :style="{
              left: wave.x + '%',
              top: wave.y + '%',
              transform: 'translate(-50%, -50%)'
            }">
          </div>
          
          <!-- Main Grid -->
          <div :style="gridTemplateStyle" class="relative z-10">
            <div v-for="block in grid" :key="block.id"
              class="quantum-block relative flex items-center justify-center cursor-pointer"
              :class="{
                'quantum-flicker': block.quantum,
                'entangled': block.entangled
              }"
              @click="observeBlock(block)"
              :style="{
                transform: block.quantum ? rotate(${block.rotation}deg) : 'rotate(0deg)',
                backgroundColor: !block.quantum ? (
                  block.state === 0 ? 'transparent' :
                  block.state === 1 ? '#00FFFF' : '#FF00FF'
                ) : 'rgba(0, 255, 255, 0.2)',
                border: block.quantum ? '1px dashed rgba(0, 255, 255, 0.5)' : (
                  block.state === 0 ? '1px solid rgba(255, 255, 255, 0.2)' :
                  block.state === 1 ? '1px solid #00FFFF' : '1px solid #FF00FF'
                )
              }">
              <!-- Quantum State Visualization -->
              <template v-if="block.quantum">
                <div class="absolute h-1/3 w-1/3 opacity-20 bg-neon-blue animate-pulse"></div>
                <div class="absolute h-1/3 w-1/3 opacity-20 bg-neon-pink animate-pulse" style="animation-delay: 0.5s"></div>
                <div class="absolute h-1/3 w-1/3 opacity-20 bg-neon-purple animate-pulse" style="animation-delay: 1s"></div>
              </template>
              
              <!-- Collapsed State Visualization -->
              <template v-else>
                <span v-if="block.state === 1" class="text-xl font-bold">●</span>
                <span v-if="block.state === 2" class="text-xl font-bold text-neon-pink">★</span>
              </template>
            </div>
          </div>
          
          <!-- Objective Pattern Visualization (small overlay) -->
          <div class="absolute top-2 right-2 grid grid-cols-4 gap-1 z-20 opacity-70" style="width: 80px; height: 80px;">
            <div v-for="(state, index) in flattenedObjective" :key="'obj-'+index"
              :style="{
                backgroundColor: state === 0 ? 'transparent' : 
                               state === 1 ? 'rgba(0, 255, 255, 0.4)' : 
                               'rgba(255, 0, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }">
            </div>
          </div>
        </div>
        
        <!-- Entanglement Legend (if applicable) -->
        <div v-if="entangledPairs.length > 0" class="mt-6 text-center">
          <p class="text-sm mb-2">
            <span class="inline-block w-3 h-3 bg-transparent border-2 border-neon-pink"></span>
            Entangled blocks collapse with opposite states
          </p>
        </div>
      </div>
    </div>
  `
}).mount('#app');