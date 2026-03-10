/* THE FERMENT ALCHEMIST — Sandbox Workbench */

const SandboxWorkbench = {
  name: 'SandboxWorkbench',
  props: ['gameStore'],
  emits: ['navigate', 'play-sound', 'save-store'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <button class="game-btn game-btn-ghost" @click="$emit('navigate', 'mode-select')">← Menu</button>
        <h2 class="font-serif text-xl" style="color: var(--ink-primary)">🧪 Sandbox</h2>
        <button class="game-btn game-btn-ghost" @click="resetWorkbench">🗑️</button>
      </div>

      <p class="text-sm mb-4 text-center" style="color: var(--ink-secondary)">
        Free experimentation — all ingredients unlocked, no scoring. Discover what you can create.
      </p>

      <!-- Ingredient Picker -->
      <ingredient-picker
        :selected="choices.ingredients"
        :player-level="25"
        @update:selected="(v) => choices.ingredients = v"
        @play-sound="(s) => $emit('play-sound', s)"
      />

      <!-- Technique Picker (collapsed) -->
      <div class="mt-4">
        <button class="game-btn game-btn-secondary w-full text-left" @click="showTechnique = !showTechnique">
          {{ selectedTechniqueName }} {{ showTechnique ? '▲' : '▼' }}
        </button>
        <div v-if="showTechnique" class="mt-2">
          <technique-picker
            :selected="choices.technique"
            :player-level="25"
            @update:selected="(v) => { choices.technique = v; showTechnique = false; }"
            @play-sound="(s) => $emit('play-sound', s)"
          />
        </div>
      </div>

      <!-- Quick Parameters -->
      <div class="game-card p-3 mt-4">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs block mb-1" style="color: var(--ink-muted)">Salt %</label>
            <input type="number" min="0" max="20" step="0.5" v-model.number="choices.saltPercent"
              class="w-full p-2 rounded text-sm text-center"
              style="background: var(--parchment-bg); border: 1px solid var(--parchment-mid); color: var(--ink-primary)">
          </div>
          <div>
            <label class="text-xs block mb-1" style="color: var(--ink-muted)">Temp °C</label>
            <input type="number" min="0" max="80" step="1" v-model.number="choices.temperature"
              class="w-full p-2 rounded text-sm text-center"
              style="background: var(--parchment-bg); border: 1px solid var(--parchment-mid); color: var(--ink-primary)">
          </div>
          <div>
            <label class="text-xs block mb-1" style="color: var(--ink-muted)">Time (days)</label>
            <input type="number" min="1" max="90" step="1" v-model.number="choices.time"
              class="w-full p-2 rounded text-sm text-center"
              style="background: var(--parchment-bg); border: 1px solid var(--parchment-mid); color: var(--ink-primary)">
          </div>
        </div>
      </div>

      <!-- Find Match Button -->
      <button
        class="game-btn game-btn-primary w-full mt-4"
        :disabled="choices.ingredients.length === 0"
        @click="findMatch"
      >
        🔍 What did I make?
      </button>

      <!-- Match Result -->
      <div v-if="matchResult" class="game-card p-4 mt-4 screen-enter">
        <div class="text-xs uppercase tracking-wider mb-2 font-medium" style="color: var(--accent-brine)">
          Closest Match
        </div>

        <div v-if="matchResult.gameOrder" class="mb-3">
          <div class="font-serif text-lg" style="color: var(--ink-primary)">
            {{ matchResult.gameOrder.order.title }}
          </div>
          <div class="text-sm" style="color: var(--ink-secondary)">
            {{ matchResult.gameOrder.order.customerName }}'s recipe
          </div>
          <div class="text-xs mt-1" style="color: var(--ink-muted)">
            Match strength: {{ matchStrength }}
          </div>
        </div>

        <div v-if="matchResult.realRecipe" class="mt-2 pt-2" style="border-top: 1px solid var(--parchment-mid)">
          <div class="text-xs mb-1" style="color: var(--accent-culture)">Real Recipe Match:</div>
          <div class="text-sm font-medium" style="color: var(--ink-primary)">
            {{ matchResult.realRecipe.recipe.name }}
          </div>
          <div class="text-xs" style="color: var(--ink-secondary)">
            {{ matchResult.realRecipe.recipe.subtitle }}
          </div>
        </div>

        <!-- Cultural context -->
        <div v-if="matchCulture" class="mt-3 pt-2" style="border-top: 1px solid var(--parchment-mid)">
          <div class="text-xs italic" style="color: var(--ink-secondary)">
            {{ matchCulture.flag }} {{ matchCulture.funFact }}
          </div>
        </div>

        <!-- Save discovery -->
        <button class="game-btn game-btn-secondary w-full mt-3 text-sm" @click="saveDiscovery">
          📝 Save Discovery
        </button>
      </div>

      <!-- Past Discoveries -->
      <div v-if="discoveries.length > 0" class="mt-6">
        <div class="text-xs uppercase tracking-wider mb-2 font-medium" style="color: var(--ink-muted)">
          Your Discoveries ({{ discoveries.length }})
        </div>
        <div class="space-y-2">
          <div v-for="(d, i) in discoveries.slice().reverse().slice(0, 5)" :key="i" class="game-card-inset p-2 text-xs">
            <div class="flex justify-between">
              <span style="color: var(--ink-primary)">{{ d.result || 'Unknown creation' }}</span>
              <span style="color: var(--ink-muted)">{{ formatDate(d.timestamp) }}</span>
            </div>
            <div style="color: var(--ink-muted)">
              {{ d.ingredients.map(id => getIngName(id)).join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      choices: {
        ingredients: [],
        technique: 'dry-salt',
        saltPercent: 2.0,
        temperature: 20,
        time: 7,
      },
      matchResult: null,
      showTechnique: false,
    };
  },

  computed: {
    selectedTechniqueName() {
      const t = GameTechniques.getById(this.choices.technique);
      return t ? `${t.icon} ${t.name}` : 'Select Technique';
    },
    matchStrength() {
      if (!this.matchResult?.gameOrder) return '';
      const s = this.matchResult.gameOrder.score;
      if (s >= 50) return 'Strong match!';
      if (s >= 30) return 'Partial match';
      if (s >= 10) return 'Loose match';
      return 'Creative invention!';
    },
    matchCulture() {
      if (!this.matchResult?.gameOrder?.order?.recipeRef) return null;
      return GameCultures.getContext(this.matchResult.gameOrder.order.recipeRef);
    },
    discoveries() {
      return this.gameStore?.sandbox?.discoveries || [];
    },
  },

  methods: {
    findMatch() {
      this.$emit('play-sound', 'btn-tap');
      this.matchResult = GameEngine.findClosestRecipe(this.choices);
    },

    saveDiscovery() {
      const discovery = {
        ingredients: [...this.choices.ingredients],
        technique: this.choices.technique,
        saltPercent: this.choices.saltPercent,
        temperature: this.choices.temperature,
        time: this.choices.time,
        result: this.matchResult?.gameOrder?.order?.title || 'Unknown creation',
        timestamp: Date.now(),
      };

      if (!this.gameStore.sandbox.discoveries) {
        this.gameStore.sandbox.discoveries = [];
      }
      this.gameStore.sandbox.discoveries.push(discovery);
      this.$emit('save-store');
      this.$emit('play-sound', 'level-unlock');
    },

    resetWorkbench() {
      this.choices = { ingredients: [], technique: 'dry-salt', saltPercent: 2.0, temperature: 20, time: 7 };
      this.matchResult = null;
    },

    getIngName(id) {
      const ing = GameIngredients.getById(id);
      return ing ? ing.name : id;
    },

    formatDate(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleDateString();
    },
  },

  mounted() {
    GameData.playMusic('bg-music-sandbox');
  }
};

window.SandboxWorkbench = SandboxWorkbench;
