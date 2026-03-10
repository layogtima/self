/* THE FERMENT ALCHEMIST — Main Game Screen (Phase Orchestrator) */

const GameScreen = {
  name: 'GameScreen',
  props: ['gameState', 'gameStore'],
  emits: ['update:gameState', 'navigate', 'play-sound', 'complete-order'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-4">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <button class="game-btn game-btn-ghost" @click="handleBack">
          ← {{ canGoBack ? 'Back' : 'Quit' }}
        </button>
        <div class="text-center">
          <div class="text-xs" style="color: var(--ink-muted)">{{ modeLabel }}</div>
          <div class="text-sm font-medium" style="color: var(--ink-primary)">{{ phaseLabel }}</div>
        </div>
        <button class="game-btn game-btn-ghost" @click="showHint = !showHint" v-if="gs.currentOrder?.hint">
          💡
        </button>
      </div>

      <!-- Phase Progress -->
      <div class="flex gap-1 mb-5 max-w-md mx-auto">
        <div
          v-for="(phase, idx) in phases"
          :key="phase"
          class="flex-1 h-1.5 rounded-full"
          :style="{
            background: idx <= currentPhaseIndex ? 'var(--accent-brine)' : 'var(--parchment-mid)',
            transition: 'background 0.3s ease'
          }"
        ></div>
      </div>

      <!-- Phase Content -->
      <div class="max-w-lg mx-auto">
        <!-- ORDER PHASE -->
        <order-card
          v-if="gs.phase === 'order' && gs.currentOrder"
          :order="gs.currentOrder"
          :show-hint="showHint"
          @accept="advancePhase"
          @play-sound="(s) => $emit('play-sound', s)"
        />

        <!-- INGREDIENTS PHASE -->
        <div v-else-if="gs.phase === 'ingredients'">
          <ingredient-picker
            :selected="gs.playerChoices.ingredients"
            :player-level="effectivePlayerLevel"
            :order="gs.currentOrder"
            @update:selected="(v) => updateChoice('ingredients', v)"
            @play-sound="(s) => $emit('play-sound', s)"
          />
          <button
            class="game-btn game-btn-primary w-full mt-4"
            :disabled="gs.playerChoices.ingredients.length === 0"
            @click="advancePhase"
          >
            Confirm Ingredients ({{ gs.playerChoices.ingredients.length }}) →
          </button>
        </div>

        <!-- TECHNIQUE PHASE -->
        <div v-else-if="gs.phase === 'technique'">
          <technique-picker
            :selected="gs.playerChoices.technique"
            :player-level="effectivePlayerLevel"
            @update:selected="(v) => { updateChoice('technique', v); advancePhase(); }"
            @play-sound="(s) => $emit('play-sound', s)"
          />
        </div>

        <!-- PARAMETERS PHASE -->
        <div v-else-if="gs.phase === 'parameters'" class="screen-enter">
          <div class="text-xs uppercase tracking-wider mb-4 font-medium" style="color: var(--ink-muted)">
            Set Your Parameters
          </div>

          <!-- Salt Slider -->
          <div class="game-card p-4 mb-3" v-if="showSaltParam">
            <div class="flex justify-between mb-2">
              <span class="text-sm" style="color: var(--ink-secondary)">🧂 Salt Concentration</span>
              <span class="text-sm font-medium" style="color: var(--ink-primary)">{{ gs.playerChoices.saltPercent.toFixed(1) }}%</span>
            </div>
            <input
              type="range"
              class="game-slider"
              :min="selectedTechnique?.saltRange?.[0] || 0"
              :max="selectedTechnique?.saltRange?.[1] || 10"
              step="0.1"
              :value="gs.playerChoices.saltPercent"
              @input="updateChoice('saltPercent', parseFloat($event.target.value))"
            >
            <div class="flex justify-between text-xs mt-1" style="color: var(--ink-muted)">
              <span>{{ selectedTechnique?.saltRange?.[0] || 0 }}%</span>
              <span>{{ selectedTechnique?.saltRange?.[1] || 10 }}%</span>
            </div>
          </div>

          <!-- Temperature Slider -->
          <div class="game-card p-4 mb-3">
            <div class="flex justify-between mb-2">
              <span class="text-sm" style="color: var(--ink-secondary)">🌡️ Temperature</span>
              <span class="text-sm font-medium" style="color: var(--ink-primary)">{{ gs.playerChoices.temperature }}°C</span>
            </div>
            <input
              type="range"
              class="game-slider"
              :min="selectedTechnique?.tempRange?.[0] || 15"
              :max="selectedTechnique?.tempRange?.[1] || 35"
              step="1"
              :value="gs.playerChoices.temperature"
              @input="updateChoice('temperature', parseInt($event.target.value))"
            >
            <div class="flex justify-between text-xs mt-1" style="color: var(--ink-muted)">
              <span>{{ selectedTechnique?.tempRange?.[0] || 15 }}°C</span>
              <span>{{ selectedTechnique?.tempRange?.[1] || 35 }}°C</span>
            </div>
          </div>

          <!-- Time Slider -->
          <div class="game-card p-4 mb-3">
            <div class="flex justify-between mb-2">
              <span class="text-sm" style="color: var(--ink-secondary)">⏱️ Fermentation Time</span>
              <span class="text-sm font-medium" style="color: var(--ink-primary)">{{ gs.playerChoices.time }} {{ gs.currentOrder?.timeUnit || 'days' }}</span>
            </div>
            <input
              type="range"
              class="game-slider"
              :min="selectedTechnique?.timeRange?.[0] || 1"
              :max="selectedTechnique?.timeRange?.[1] || 30"
              step="1"
              :value="gs.playerChoices.time"
              @input="updateChoice('time', parseInt($event.target.value))"
            >
            <div class="flex justify-between text-xs mt-1" style="color: var(--ink-muted)">
              <span>{{ selectedTechnique?.timeRange?.[0] || 1 }}</span>
              <span>{{ selectedTechnique?.timeRange?.[1] || 30 }} {{ gs.currentOrder?.timeUnit || 'days' }}</span>
            </div>
          </div>

          <!-- Vessel Picker -->
          <vessel-picker
            :selected="gs.playerChoices.vessel"
            :player-level="effectivePlayerLevel"
            :technique="gs.playerChoices.technique"
            @update:selected="(v) => updateChoice('vessel', v)"
            @play-sound="(s) => $emit('play-sound', s)"
          />

          <button
            class="game-btn game-btn-primary w-full mt-4"
            :disabled="!gs.playerChoices.vessel"
            @click="advancePhase"
          >
            Begin Fermentation →
          </button>
        </div>

        <!-- FERMENTING PHASE -->
        <fermentation-monitor
          v-else-if="gs.phase === 'fermenting'"
          :progress="gs.fermentProgress"
          :technique="gs.playerChoices.technique"
          :vessel="gs.playerChoices.vessel"
          :salt-percent="gs.playerChoices.saltPercent"
          :temperature="gs.playerChoices.temperature"
          :time="gs.playerChoices.time"
          :time-unit="gs.currentOrder?.timeUnit"
          @complete="advancePhase"
          @play-sound="(s) => $emit('play-sound', s)"
        />

        <!-- SERVING PHASE -->
        <div v-else-if="gs.phase === 'serving'" class="text-center screen-enter">
          <div class="text-6xl mb-4 gentle-bob">✨</div>
          <div class="font-serif text-2xl mb-2" style="color: var(--ink-primary)">Ready to Serve!</div>
          <p class="text-sm mb-6" style="color: var(--ink-secondary)">
            Your creation is complete. Let's see how it turned out...
          </p>
          <button class="game-btn game-btn-primary" @click="$emit('play-sound', 'serve-whoosh'); $emit('complete-order')">
            🍽️ Serve to Customer
          </button>
        </div>
      </div>

      <!-- Hint Toast -->
      <div v-if="showHint && gs.currentOrder?.hint && gs.phase !== 'order'" class="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50">
        <div class="game-card p-3 text-sm" style="background: var(--accent-brine); color: #FDF8F0; border-color: var(--accent-brine);">
          💡 {{ gs.currentOrder.hint }}
          <button class="ml-2 opacity-70 hover:opacity-100" @click="showHint = false">✕</button>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      showHint: false,
      fermentTimer: null,
    };
  },

  computed: {
    gs() { return this.gameState; },
    phases() { return GameEngine.phases; },
    currentPhaseIndex() { return this.phases.indexOf(this.gs.phase); },
    modeLabel() {
      const labels = { story: 'Story Mode', endless: 'Endless Mode', sandbox: 'Sandbox' };
      return labels[this.gs.mode] || this.gs.mode;
    },
    phaseLabel() {
      const labels = {
        order: 'New Order', ingredients: 'Select Ingredients', technique: 'Choose Technique',
        parameters: 'Set Parameters', fermenting: 'Fermenting...', serving: 'Ready!'
      };
      return labels[this.gs.phase] || this.gs.phase;
    },
    canGoBack() {
      return this.currentPhaseIndex > 0 && this.gs.phase !== 'fermenting' && this.gs.phase !== 'serving';
    },
    effectivePlayerLevel() {
      if (this.gs.mode === 'sandbox') return 25;
      return this.gameStore?.player?.level || this.gs.storyLevel || 1;
    },
    selectedTechnique() {
      return this.gs.playerChoices.technique ? GameTechniques.getById(this.gs.playerChoices.technique) : null;
    },
    showSaltParam() {
      if (!this.selectedTechnique) return true;
      return this.selectedTechnique.saltRange[1] > 0;
    },
  },

  methods: {
    updateChoice(key, value) {
      const newState = { ...this.gs };
      newState.playerChoices = { ...newState.playerChoices, [key]: value };
      this.$emit('update:gameState', newState);
    },

    advancePhase() {
      const newState = { ...this.gs };
      GameEngine.nextPhase(newState);
      this.$emit('update:gameState', newState);

      if (newState.phase === 'fermenting') {
        this.startFermentAnimation();
      }
    },

    handleBack() {
      if (this.canGoBack) {
        const newState = { ...this.gs };
        GameEngine.previousPhase(newState);
        this.$emit('play-sound', 'btn-back');
        this.$emit('update:gameState', newState);
      } else {
        this.$emit('play-sound', 'btn-back');
        this.$emit('navigate', 'mode-select');
      }
    },

    startFermentAnimation() {
      if (this.fermentTimer) clearInterval(this.fermentTimer);
      const newState = { ...this.gs, fermentProgress: 0 };
      this.$emit('update:gameState', newState);

      this.fermentTimer = setInterval(() => {
        const updated = { ...this.gameState };
        updated.fermentProgress = Math.min(100, (updated.fermentProgress || 0) + 2);
        this.$emit('update:gameState', updated);
        if (updated.fermentProgress >= 100) {
          clearInterval(this.fermentTimer);
          this.fermentTimer = null;
        }
      }, 60);
    },
  },

  beforeUnmount() {
    if (this.fermentTimer) clearInterval(this.fermentTimer);
  }
};

window.GameScreen = GameScreen;
