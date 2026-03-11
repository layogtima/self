/**
 * FERMENT - BatchScaler Component
 * Scale recipe ingredients up or down
 */

const BatchScalerComponent = {
  name: 'batch-scaler',

  props: {
    recipes: {
      type: Array,
      default: () => []
    }
  },

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Scaler error in', info, err);
    return false; // Let ToolsView handle display
  },

  data() {
    return {
      selectedRecipeId: '',
      multiplier: 1,
      customMultiplier: '',
      useCustom: false,
    };
  },

  computed: {
    selectedRecipe() {
      return this.recipes.find(r => r.id === this.selectedRecipeId) || null;
    },

    activeMultiplier() {
      if (this.useCustom && this.customMultiplier) {
        return parseFloat(this.customMultiplier) || 1;
      }
      return this.multiplier;
    },

    scaledIngredients() {
      if (!this.selectedRecipe || !this.selectedRecipe.ingredients) return [];
      return this.selectedRecipe.ingredients.map(ing => ({
        ...ing,
        originalAmount: ing.amount,
        scaledAmount: FermentFormat.scaleAmount(ing.amount, this.activeMultiplier),
      }));
    },

    presetMultipliers() {
      return [0.25, 0.5, 1, 2, 4];
    },

    scalingNotes() {
      const notes = [];
      const m = this.activeMultiplier;
      if (m >= 4) {
        notes.push({ icon: '🧂', text: 'Salt may not scale linearly for very large batches. Consider using 90-95% of calculated salt and adjusting to taste.' });
        notes.push({ icon: '🫙', text: 'You may need multiple fermentation vessels. Ensure adequate headspace in each.' });
      }
      if (m >= 2) {
        notes.push({ icon: '⏱️', text: 'Larger batches may take slightly longer to ferment. Monitor closely.' });
      }
      if (m <= 0.5) {
        notes.push({ icon: '🌡️', text: 'Smaller batches are more sensitive to temperature fluctuations.' });
      }
      if (m !== 1) {
        notes.push({ icon: '📐', text: 'Culture/starter amounts typically scale proportionally, but taste and adjust.' });
      }
      return notes;
    },
  },

  methods: {
    setMultiplier(m) {
      this.multiplier = m;
      this.useCustom = false;
    },

    enableCustom() {
      this.useCustom = true;
    },
  },

  template: `
    <div class="space-y-6">
      <!-- Scaler Card -->
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
        <!-- Header -->
        <div class="bg-accent-aged/10 dark:bg-accent-aged/5 px-6 py-4 border-b border-accent-aged/20">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📐</span>
            <div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Batch Scaler</h3>
              <p class="text-sm text-text-muted dark:text-dark-text-secondary">Scale any recipe up or down</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Recipe Selector -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Select Recipe</label>
            <select v-model="selectedRecipeId"
              class="w-full px-4 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-aged focus:ring-1 focus:ring-accent-aged focus:outline-none transition-all"
            >
              <option value="">Choose a recipe...</option>
              <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option>
            </select>
          </div>

          <!-- Multiplier Buttons -->
          <div v-if="selectedRecipe">
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Multiplier</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="m in presetMultipliers" :key="m"
                @click="setMultiplier(m)"
                :class="[
                  'px-4 py-2.5 rounded-xl font-mono font-medium text-sm transition-all duration-300 border-2',
                  !useCustom && multiplier === m
                    ? 'bg-accent-aged text-white border-accent-aged shadow-warm'
                    : 'border-transparent bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary hover:border-accent-aged/30'
                ]"
              >{{ m }}x</button>
              <div class="flex items-center gap-1">
                <input type="number" v-model="customMultiplier" step="0.25" min="0.1"
                  placeholder="Custom"
                  @focus="enableCustom"
                  @input="enableCustom"
                  :class="[
                    'w-24 px-3 py-2.5 rounded-xl font-mono text-sm border-2 transition-all bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted focus:outline-none',
                    useCustom ? 'border-accent-aged focus:ring-1 focus:ring-accent-aged' : 'border-transparent focus:border-accent-aged'
                  ]"
                />
                <span class="text-sm text-text-muted">x</span>
              </div>
            </div>
            <p class="text-sm text-text-muted mt-2">
              Scaling to <span class="font-mono font-medium text-accent-aged">{{ activeMultiplier }}x</span> the original recipe
            </p>
          </div>

          <!-- Scaled Ingredients -->
          <div v-if="selectedRecipe && scaledIngredients.length > 0" class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-2xl overflow-hidden">
            <div class="px-5 py-3 border-b border-bg-secondary dark:border-dark-secondary">
              <div class="grid grid-cols-12 gap-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                <div class="col-span-5">Ingredient</div>
                <div class="col-span-3 text-right">Original</div>
                <div class="col-span-1 text-center"></div>
                <div class="col-span-3 text-right">Scaled</div>
              </div>
            </div>
            <div class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary">
              <div v-for="ing in scaledIngredients" :key="ing.name"
                class="px-5 py-3 grid grid-cols-12 gap-2 items-center"
              >
                <div class="col-span-5">
                  <span class="text-sm text-text-primary dark:text-dark-text">{{ ing.name }}</span>
                  <span v-if="!ing.essential" class="text-xs text-text-muted ml-1">(optional)</span>
                </div>
                <div class="col-span-3 text-right font-mono text-sm text-text-muted">
                  {{ ing.originalAmount }} {{ ing.unit }}
                </div>
                <div class="col-span-1 text-center text-text-muted">
                  <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </div>
                <div class="col-span-3 text-right">
                  <span :class="[
                    'font-mono text-sm font-medium',
                    activeMultiplier !== 1 ? 'text-accent-aged' : 'text-text-primary dark:text-dark-text'
                  ]">{{ ing.scaledAmount }} {{ ing.unit }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!selectedRecipe" class="text-center py-12">
            <div class="text-4xl mb-3">📐</div>
            <p class="text-text-muted dark:text-dark-text-secondary">Select a recipe above to scale its ingredients</p>
          </div>
        </div>
      </div>

      <!-- Scaling Notes -->
      <div v-if="scalingNotes.length > 0 && selectedRecipe" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-5">
        <h4 class="font-serif text-base text-text-primary dark:text-dark-text mb-3">Scaling Notes</h4>
        <div class="space-y-2">
          <div v-for="(note, i) in scalingNotes" :key="i" class="flex items-start gap-2">
            <span class="text-sm mt-0.5">{{ note.icon }}</span>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary">{{ note.text }}</p>
          </div>
        </div>
      </div>
    </div>
  `
};
