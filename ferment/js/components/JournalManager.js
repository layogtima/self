/**
 * FERMENT - JournalManager Component
 * Fermentation journal: batch tracking, progress, logging, stats
 */

const JournalManagerComponent = {
  name: 'journal-manager',

  props: {
    batches: {
      type: Array,
      default: () => []
    },
    recipes: {
      type: Array,
      default: () => []
    },
    stats: {
      type: Object,
      default: () => ({
        totalBatches: 0,
        completedBatches: 0,
        failedBatches: 0,
        totalFermentDays: 0,
      })
    },
    userLevel: {
      type: Object,
      default: () => ({ level: 0, title: 'Newcomer' })
    }
  },

  emits: ['update:batches', 'open-recipe'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Journal error in', info, err);
    this.journalError = (err && err.message) || 'An error occurred in the journal.';
    return false;
  },

  data() {
    return {
      journalError: null,
      showNewBatchForm: false,
      showLogForm: null,
      showCompleteForm: null,
      showArchive: false,
      newBatch: {
        recipeId: '',
        batchSize: 1,
        startDate: new Date().toISOString().slice(0, 10),
        notes: '',
      },
      logEntry: {
        note: '',
        temperature: '',
        saltLevel: 3,
        acidLevel: 3,
        funkLevel: 3,
        bubbleActivity: 'slight',
        ph: '',
      },
      completeForm: {
        outcome: 'complete',
        notes: '',
        rating: 4,
      },
    };
  },

  computed: {
    activeBatches() {
      return this.batches.filter(b => b.status === 'fermenting' || b.status === 'resting' || b.status === 'planned');
    },

    completedBatches() {
      return this.batches.filter(b => b.status === 'complete' || b.status === 'failed')
        .sort((a, b) => new Date(b.completedAt || b.startDate) - new Date(a.completedAt || a.startDate));
    },

    mostMadeRecipe() {
      if (this.batches.length === 0) return null;
      const counts = {};
      for (const b of this.batches) {
        counts[b.recipeId] = (counts[b.recipeId] || 0) + 1;
      }
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!topId) return null;
      const recipe = this.recipes.find(r => r.id === topId[0]);
      return recipe ? { name: recipe.name, count: topId[1] } : null;
    },

    levelProgress() {
      const thresholds = [0, 5, 1, 3, 10, 25, 25];
      const current = this.userLevel.level;
      if (current >= 6) return 100;
      const completed = this.stats.completedBatches || 0;
      const needed = thresholds[current + 1] || 100;
      return Math.min(100, Math.round((completed / needed) * 100));
    },

    levelEmojis() {
      return ['🌑', '🧂', '💧', '🫙', '🦠', '👑', '🏴‍☠️'];
    }
  },

  methods: {
    getRecipe(recipeId) {
      return this.recipes.find(r => r.id === recipeId);
    },

    recipeName(recipeId) {
      const r = this.getRecipe(recipeId);
      return r ? r.name : 'Unknown Recipe';
    },

    batchProgress(batch) {
      if (batch.status === 'complete' || batch.status === 'failed') return 100;
      if (batch.status === 'planned') return 0;
      const recipe = this.getRecipe(batch.recipeId);
      if (!recipe) return 0;
      const startDate = new Date(batch.startDate);
      const now = new Date();
      const daysSoFar = Math.max(0, FermentFormat.daysBetween(batch.startDate));
      const minDays = recipe.fermentTimeMin || recipe.fermentTime || 7;
      const maxDays = recipe.fermentTimeMax || recipe.fermentTime || 14;
      const avgDays = (minDays + maxDays) / 2;
      return Math.min(100, Math.round((daysSoFar / avgDays) * 100));
    },

    batchDayLabel(batch) {
      const recipe = this.getRecipe(batch.recipeId);
      const daysSoFar = Math.max(0, FermentFormat.daysBetween(batch.startDate));
      const maxDays = recipe ? (recipe.fermentTimeMax || recipe.fermentTime || 14) : 14;
      return 'Day ' + daysSoFar + ' of ~' + maxDays;
    },

    lastCheck(batch) {
      if (!batch.logs || batch.logs.length === 0) return null;
      return batch.logs[batch.logs.length - 1];
    },

    statusColor(status) {
      const colors = {
        planned: 'bg-text-muted/20 text-text-muted',
        fermenting: 'bg-accent-culture/15 text-accent-culture',
        resting: 'bg-accent-brine/15 text-accent-brine',
        complete: 'bg-accent-culture/15 text-accent-culture',
        failed: 'bg-accent-ferment/15 text-accent-ferment',
      };
      return colors[status] || colors.planned;
    },

    progressBarColor(batch) {
      const pct = this.batchProgress(batch);
      if (pct >= 90) return 'bg-accent-culture';
      if (pct >= 50) return 'bg-accent-brine';
      return 'bg-accent-aged';
    },

    startNewBatch() {
      if (!this.newBatch.recipeId) return;
      const batch = {
        id: FermentFormat.uid(),
        recipeId: this.newBatch.recipeId,
        batchSize: parseFloat(this.newBatch.batchSize) || 1,
        startDate: this.newBatch.startDate,
        status: 'fermenting',
        notes: this.newBatch.notes,
        logs: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [...this.batches, batch];
      this.$emit('update:batches', updated);
      this.showNewBatchForm = false;
      this.newBatch = {
        recipeId: '',
        batchSize: 1,
        startDate: new Date().toISOString().slice(0, 10),
        notes: '',
      };
    },

    openLogForm(batchId) {
      this.showLogForm = batchId;
      this.logEntry = {
        note: '',
        temperature: '',
        saltLevel: 3,
        acidLevel: 3,
        funkLevel: 3,
        bubbleActivity: 'slight',
        ph: '',
      };
    },

    submitLog(batchId) {
      const entry = {
        id: FermentFormat.uid(),
        timestamp: new Date().toISOString(),
        note: this.logEntry.note,
        temperature: this.logEntry.temperature ? parseFloat(this.logEntry.temperature) : null,
        saltLevel: this.logEntry.saltLevel,
        acidLevel: this.logEntry.acidLevel,
        funkLevel: this.logEntry.funkLevel,
        bubbleActivity: this.logEntry.bubbleActivity,
        ph: this.logEntry.ph ? parseFloat(this.logEntry.ph) : null,
      };
      const updated = this.batches.map(b => {
        if (b.id === batchId) {
          return { ...b, logs: [...(b.logs || []), entry] };
        }
        return b;
      });
      this.$emit('update:batches', updated);
      this.showLogForm = null;
    },

    openCompleteForm(batchId) {
      this.showCompleteForm = batchId;
      this.completeForm = { outcome: 'complete', notes: '', rating: 4 };
    },

    completeBatch(batchId) {
      const updated = this.batches.map(b => {
        if (b.id === batchId) {
          return {
            ...b,
            status: this.completeForm.outcome,
            completedAt: new Date().toISOString(),
            outcomeNotes: this.completeForm.notes,
            rating: this.completeForm.rating,
          };
        }
        return b;
      });
      this.$emit('update:batches', updated);
      this.showCompleteForm = null;
    },

    updateBatchStatus(batchId, status) {
      const updated = this.batches.map(b => {
        if (b.id === batchId) {
          return { ...b, status };
        }
        return b;
      });
      this.$emit('update:batches', updated);
    },

    deleteBatch(batchId) {
      if (!confirm('Delete this batch? This cannot be undone.')) return;
      const updated = this.batches.filter(b => b.id !== batchId);
      this.$emit('update:batches', updated);
    },

    bubbleEmoji(activity) {
      const map = { none: '😶', slight: '🫧', moderate: '💨', vigorous: '🌋' };
      return map[activity] || '🫧';
    },

    scaleLabel(val) {
      const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
      return labels[val] || '';
    },

    ratingStars(n) {
      return '★'.repeat(n) + '☆'.repeat(5 - n);
    },

    fmtDateShort(dateStr) {
      try { return FermentFormat.formatDateShort(dateStr); } catch (e) { return ''; }
    },

    fmtRelativeDate(dateStr) {
      try { return FermentFormat.formatRelativeDate(dateStr); } catch (e) { return ''; }
    },
  },

  template: `
    <div class="space-y-6">
      <!-- Error state -->
      <div v-if="journalError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong in the journal.</p>
        <p class="text-xs text-text-muted mt-1">{{ journalError }}</p>
        <button @click="journalError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!journalError">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="font-serif text-3xl text-text-primary dark:text-dark-text">Fermentation Journal</h2>
          <p class="text-text-muted dark:text-dark-text-secondary mt-1">
            Track your batches from jar to table
          </p>
        </div>
        <button
          @click="showNewBatchForm = !showNewBatchForm"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-ferment text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <span class="text-lg">🫙</span>
          New Batch
        </button>
      </div>

      <!-- Stats Dashboard -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 text-center">
          <div class="font-mono text-2xl font-medium text-accent-brine">{{ stats.totalBatches }}</div>
          <div class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">Total Batches</div>
        </div>
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 text-center">
          <div class="font-mono text-2xl font-medium text-accent-culture">{{ stats.completedBatches }}</div>
          <div class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">Completed</div>
        </div>
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 text-center">
          <div class="font-mono text-2xl font-medium text-accent-ferment">{{ stats.failedBatches }}</div>
          <div class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">Failed</div>
        </div>
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 text-center">
          <div class="font-mono text-2xl font-medium text-accent-aged">{{ stats.totalFermentDays }}</div>
          <div class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">Ferment Days</div>
        </div>
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 text-center col-span-2 md:col-span-1">
          <div class="text-lg">{{ levelEmojis[userLevel.level] || '🌑' }}</div>
          <div class="text-xs font-medium text-text-primary dark:text-dark-text mt-1">Lvl {{ userLevel.level }}</div>
          <div class="text-xs text-text-muted dark:text-dark-text-secondary">{{ userLevel.title }}</div>
          <div class="mt-2 w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-1.5">
            <div class="bg-accent-brine rounded-full h-1.5 transition-all duration-500" :style="{ width: levelProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Most Made Recipe -->
      <div v-if="mostMadeRecipe" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary px-5 py-3 flex items-center gap-3">
        <span class="text-lg">🏆</span>
        <span class="text-sm text-text-secondary dark:text-dark-text-secondary">
          Most made: <strong class="text-text-primary dark:text-dark-text">{{ mostMadeRecipe.name }}</strong>
          <span class="text-text-muted">({{ mostMadeRecipe.count }}x)</span>
        </span>
      </div>

      <!-- New Batch Form -->
      <transition name="slide">
        <div v-if="showNewBatchForm" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-5 space-y-4">
          <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Start New Batch</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Recipe *</label>
              <select v-model="newBatch.recipeId"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:ring-1 focus:ring-accent-ferment focus:outline-none transition-all"
              >
                <option value="">Select a recipe...</option>
                <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Batch Size (x)</label>
              <input v-model.number="newBatch.batchSize" type="number" step="0.5" min="0.25"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Start Date</label>
              <input v-model="newBatch.startDate" type="date"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Notes (optional)</label>
            <textarea v-model="newBatch.notes" rows="2" placeholder="Any notes about this batch..."
              class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-ferment focus:outline-none transition-all resize-none"
            ></textarea>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="showNewBatchForm = false" class="px-4 py-2 rounded-xl text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">Cancel</button>
            <button @click="startNewBatch" :disabled="!newBatch.recipeId"
              :class="[
                'px-5 py-2 rounded-xl font-medium transition-all duration-300',
                newBatch.recipeId ? 'bg-accent-ferment text-white shadow-warm hover:shadow-warm-lg' : 'bg-bg-secondary text-text-muted cursor-not-allowed dark:bg-dark-secondary'
              ]"
            >Start Fermenting</button>
          </div>
        </div>
      </transition>

      <!-- Active Batches -->
      <div>
        <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-4 flex items-center gap-2">
          <span>🫙</span> Active Batches
          <span v-if="activeBatches.length" class="text-sm font-sans font-medium text-text-muted bg-bg-secondary dark:bg-dark-secondary rounded-full px-2.5 py-0.5">{{ activeBatches.length }}</span>
        </h3>

        <div v-if="activeBatches.length === 0" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-8 text-center">
          <div class="text-4xl mb-3">🫙</div>
          <p class="text-text-muted dark:text-dark-text-secondary">No active batches. Start one above!</p>
        </div>

        <div class="space-y-4">
          <div v-for="batch in activeBatches" :key="batch.id"
            class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-5 space-y-4"
          >
            <!-- Batch Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xl">🫙</span>
                  <h4 class="font-serif text-lg text-text-primary dark:text-dark-text cursor-pointer hover:text-accent-brine transition-colors"
                    @click="$emit('open-recipe', batch.recipeId)"
                  >{{ recipeName(batch.recipeId) }}</h4>
                  <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusColor(batch.status)]">
                    {{ batch.status }}
                  </span>
                </div>
                <p class="text-sm text-text-muted dark:text-dark-text-secondary mt-1">
                  {{ batchDayLabel(batch) }} · Started {{ fmtDateShort(batch.startDate) }}
                  <span v-if="batch.batchSize !== 1"> · {{ batch.batchSize }}x batch</span>
                </p>
              </div>
              <div class="flex gap-1">
                <button v-if="batch.status === 'fermenting'" @click="updateBatchStatus(batch.id, 'resting')"
                  class="p-1.5 rounded-lg text-text-muted hover:text-accent-brine hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all" title="Move to resting">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                </button>
                <button @click="deleteBatch(batch.id)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all" title="Delete batch">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div>
              <div class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-3 overflow-hidden">
                <div :class="['h-3 rounded-full transition-all duration-700', progressBarColor(batch)]"
                  :style="{ width: batchProgress(batch) + '%' }"></div>
              </div>
              <div class="flex justify-between text-xs text-text-muted dark:text-dark-text-secondary mt-1">
                <span>{{ batchProgress(batch) }}%</span>
                <span>{{ batchDayLabel(batch) }}</span>
              </div>
            </div>

            <!-- Last Check -->
            <div v-if="lastCheck(batch)" class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl px-4 py-3">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-text-muted dark:text-dark-text-secondary">Last check: {{ fmtRelativeDate(lastCheck(batch).timestamp) }}</span>
                <span>{{ bubbleEmoji(lastCheck(batch).bubbleActivity) }}</span>
              </div>
              <p v-if="lastCheck(batch).note" class="text-sm text-text-primary dark:text-dark-text">{{ lastCheck(batch).note }}</p>
              <div class="flex gap-3 mt-1 text-xs text-text-muted">
                <span v-if="lastCheck(batch).temperature">{{ lastCheck(batch).temperature }}°</span>
                <span v-if="lastCheck(batch).ph">pH {{ lastCheck(batch).ph }}</span>
                <span>Salt: {{ scaleLabel(lastCheck(batch).saltLevel) }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-wrap">
              <button @click="openLogForm(batch.id)"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-brine/10 text-accent-brine rounded-xl text-sm font-medium hover:bg-accent-brine/20 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Log Check
              </button>
              <button @click="openCompleteForm(batch.id)"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-culture/10 text-accent-culture rounded-xl text-sm font-medium hover:bg-accent-culture/20 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Complete / Fail
              </button>
            </div>

            <!-- Log Check Form -->
            <transition name="slide">
              <div v-if="showLogForm === batch.id" class="border-t border-bg-secondary dark:border-dark-secondary pt-4 space-y-4">
                <h4 class="font-medium text-sm text-text-primary dark:text-dark-text">Log a Check</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-xs text-text-muted mb-1">Notes</label>
                    <textarea v-model="logEntry.note" rows="2" placeholder="How does it look, smell, taste?"
                      class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-brine focus:outline-none transition-all resize-none text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-xs text-text-muted mb-1">Temperature</label>
                    <input v-model="logEntry.temperature" type="number" step="0.1" placeholder="e.g. 22"
                      class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-brine focus:outline-none transition-all text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-text-muted mb-1">pH (optional)</label>
                    <input v-model="logEntry.ph" type="number" step="0.1" min="0" max="14" placeholder="e.g. 3.5"
                      class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-brine focus:outline-none transition-all text-sm font-mono"
                    />
                  </div>
                </div>

                <!-- Taste Scales -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div v-for="scale in [{key:'saltLevel',label:'Salt'},{key:'acidLevel',label:'Acid'},{key:'funkLevel',label:'Funk'}]" :key="scale.key">
                    <label class="block text-xs text-text-muted mb-1">{{ scale.label }}: {{ logEntry[scale.key] }}/5</label>
                    <input type="range" min="1" max="5" step="1" v-model.number="logEntry[scale.key]"
                      class="w-full accent-accent-brine"
                    />
                  </div>
                </div>

                <!-- Bubble Activity -->
                <div>
                  <label class="block text-xs text-text-muted mb-2">Bubble Activity</label>
                  <div class="flex gap-2 flex-wrap">
                    <button v-for="level in ['none','slight','moderate','vigorous']" :key="level"
                      @click="logEntry.bubbleActivity = level"
                      :class="[
                        'px-3 py-1.5 rounded-xl text-sm transition-all border-2',
                        logEntry.bubbleActivity === level
                          ? 'bg-accent-brine/15 border-accent-brine text-accent-brine font-medium'
                          : 'border-transparent bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary'
                      ]"
                    >{{ bubbleEmoji(level) }} {{ level }}</button>
                  </div>
                </div>

                <div class="flex gap-2 justify-end">
                  <button @click="showLogForm = null" class="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">Cancel</button>
                  <button @click="submitLog(batch.id)" class="px-5 py-2 rounded-xl text-sm font-medium bg-accent-brine text-white hover:bg-accent-brine/90 transition-all">Save Log</button>
                </div>
              </div>
            </transition>

            <!-- Complete / Fail Form -->
            <transition name="slide">
              <div v-if="showCompleteForm === batch.id" class="border-t border-bg-secondary dark:border-dark-secondary pt-4 space-y-4">
                <h4 class="font-medium text-sm text-text-primary dark:text-dark-text">Finish Batch</h4>
                <div class="flex gap-3">
                  <button @click="completeForm.outcome = 'complete'"
                    :class="['flex-1 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all', completeForm.outcome === 'complete' ? 'bg-accent-culture/15 border-accent-culture text-accent-culture' : 'border-transparent bg-bg-secondary dark:bg-dark-secondary text-text-secondary']"
                  >✅ Complete</button>
                  <button @click="completeForm.outcome = 'failed'"
                    :class="['flex-1 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all', completeForm.outcome === 'failed' ? 'bg-accent-ferment/15 border-accent-ferment text-accent-ferment' : 'border-transparent bg-bg-secondary dark:bg-dark-secondary text-text-secondary']"
                  >❌ Failed</button>
                </div>
                <div>
                  <label class="block text-xs text-text-muted mb-1">Rating</label>
                  <div class="flex gap-1">
                    <button v-for="n in 5" :key="n" @click="completeForm.rating = n"
                      :class="['text-2xl transition-all', n <= completeForm.rating ? 'text-accent-brine' : 'text-text-muted/30']"
                    >★</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-text-muted mb-1">Outcome Notes</label>
                  <textarea v-model="completeForm.notes" rows="2" placeholder="How did it turn out?"
                    class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-brine focus:outline-none transition-all resize-none text-sm"
                  ></textarea>
                </div>
                <div class="flex gap-2 justify-end">
                  <button @click="showCompleteForm = null" class="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">Cancel</button>
                  <button @click="completeBatch(batch.id)" class="px-5 py-2 rounded-xl text-sm font-medium bg-accent-ferment text-white hover:bg-accent-ferment/90 transition-all">Finish Batch</button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Completed Batches Archive -->
      <div v-if="completedBatches.length > 0">
        <button @click="showArchive = !showArchive"
          class="flex items-center gap-2 font-serif text-xl text-text-primary dark:text-dark-text mb-4 group"
        >
          <span>📜</span> Completed Batches
          <span class="text-sm font-sans font-medium text-text-muted bg-bg-secondary dark:bg-dark-secondary rounded-full px-2.5 py-0.5">{{ completedBatches.length }}</span>
          <svg :class="['w-4 h-4 text-text-muted transition-transform', showArchive ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <div v-show="showArchive" class="space-y-3">
          <div v-for="batch in completedBatches" :key="batch.id"
            class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-4 flex items-center justify-between gap-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span>{{ batch.status === 'complete' ? '✅' : '❌' }}</span>
                <span class="font-serif text-text-primary dark:text-dark-text cursor-pointer hover:text-accent-brine transition-colors"
                  @click="$emit('open-recipe', batch.recipeId)"
                >{{ recipeName(batch.recipeId) }}</span>
                <span v-if="batch.rating" class="text-accent-brine text-sm">{{ ratingStars(batch.rating) }}</span>
              </div>
              <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">
                {{ fmtDateShort(batch.startDate) }} - {{ fmtDateShort(batch.completedAt) }}
                <span v-if="batch.logs"> · {{ batch.logs.length }} check{{ batch.logs.length === 1 ? '' : 's' }}</span>
              </p>
              <p v-if="batch.outcomeNotes" class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{{ batch.outcomeNotes }}</p>
            </div>
            <button @click="deleteBatch(batch.id)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all flex-shrink-0" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>
  `
};
