/**
 * FERMENT - RecipePage Component
 * Full-page recipe view with rich desktop (two-column) and mobile (tabbed vertical) layouts
 */

const RecipePageComponent = {
  name: 'recipe-page',

  props: {
    recipe: { type: Object, required: true },
    pantry: { type: Array, default: () => [] },
    recipeNotes: { type: Object, default: () => ({}) },
    favorites: { type: Array, default: () => [] },
    bookmarks: { type: Array, default: () => [] },
    settings: { type: Object, default: () => ({}) },
    contextualNavActiveTab: { type: String, default: '' },
  },

  emits: ['close', 'toggle-favorite', 'toggle-bookmark', 'update-notes', 'start-batch', 'add-to-pantry', 'set-nav', 'update-nav-active', 'clear-nav'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] RecipePage error in', info, err);
    this.recipeError = (err && err.message) || 'An error occurred.';
    return false;
  },

  data() {
    return {
      recipeError: null,
      mobileTab: 'story',
      batchMultiplier: 1,
      completedSteps: {},
      localNotes: '',
      localRating: 0,
      localTimesMade: 0,
      // Inline editing
      editMode: false,
      editingField: null,
      // Internal flag to prevent watch loop when syncing tab from parent
      _navFromProp: false,
    };
  },

  computed: {
    tier() { return FermentFormat.tierInfo(this.recipe.difficulty || 1); },
    isFavorite() { return this.favorites.includes(this.recipe.id); },
    isBookmarked() { return this.bookmarks.includes(this.recipe.id); },
    notes() { return this.recipeNotes[this.recipe.id] || {}; },

    scaledIngredients() {
      return (this.recipe.ingredients || []).map(ing => ({
        ...ing,
        scaledAmount: ing.amount != null ? FermentFormat.scaleAmount(ing.amount, this.batchMultiplier) : null,
      }));
    },

    mobileTabs() {
      const t = [
        { id: 'story', label: 'Story', icon: '📖' },
        { id: 'recipe', label: 'Recipe', icon: '🧾' },
        { id: 'notes', label: 'Notes', icon: '📝' },
      ];
      if (this.hasDehydrate) t.push({ id: 'dehydrate', label: 'Dehydrate', icon: '☀️' });
      return t;
    },

    hasDehydrate() {
      const d = this.recipe.dehydratorIntegration || this.recipe.dehydrate;
      return d && (d.applicable || d.method || d.temp || d.result);
    },
    dehydrateData() { return this.recipe.dehydratorIntegration || this.recipe.dehydrate || {}; },

    categoryGradient() {
      const g = { vegetable: 'from-green-700 via-emerald-600 to-lime-500', sauce: 'from-red-700 via-orange-600 to-amber-500', paste: 'from-amber-800 via-yellow-700 to-orange-500', condiment: 'from-yellow-700 via-amber-600 to-orange-400', drink: 'from-cyan-700 via-teal-600 to-emerald-500', powder: 'from-purple-700 via-fuchsia-600 to-pink-500', preserve: 'from-orange-700 via-amber-600 to-yellow-500' };
      return g[this.recipe.category] || 'from-stone-700 via-stone-600 to-stone-500';
    },
    categoryEmoji() {
      const e = { vegetable: '🥬', sauce: '🫗', paste: '🫙', condiment: '🧂', drink: '🍵', powder: '✨', preserve: '🍯' };
      return e[this.recipe.category] || '🫙';
    },

    hasPantry() { return this.pantry.length > 0; },
    pantryItemNames() { return new Set(this.pantry.map(p => p.name.toLowerCase().trim())); },

    timeDisplay() {
      if (this.recipe.totalTimeHuman) return this.recipe.totalTimeHuman;
      const t = this.recipe.totalTime || this.recipe.time;
      if (!t) return 'Varies';
      if (typeof t === 'object') {
        const min = t.min || t.days || 0;
        const max = t.max || min;
        if (min === max) return this.fmtDays(min);
        return this.fmtDays(min) + ' – ' + this.fmtDays(max);
      }
      return this.fmtDays(t);
    },

    stepsData() { return this.recipe.steps || this.recipe.instructions || []; },
    stepsProgress() {
      const total = this.stepsData.length;
      if (total === 0) return 0;
      return Math.round((Object.values(this.completedSteps).filter(Boolean).length / total) * 100);
    },
    thingsToAccountFor() { return this.recipe.thingsToAccountFor || this.recipe.accountFor || []; },
    variations() { return this.recipe.variations || []; },
    relatedRecipes() { return this.recipe.relatedRecipes || this.recipe.related || []; },
    culturalContext() { return this.recipe.culturalContext || {}; },

    shelfLife() {
      const d = this.recipe.dehydratorIntegration || this.recipe.dehydrate || {};
      return d.shelfLife || '';
    },

    heroImage() {
      const imgs = this.recipe.images;
      if (!imgs) return null;
      if (Array.isArray(imgs)) {
        const hero = imgs.find(i => i.type === 'hero');
        return hero ? hero.url : null;
      }
      return imgs.hero || null;
    },
  },

  watch: {
    recipe: {
      immediate: true,
      handler(r) {
        if (r) {
          const n = this.recipeNotes[r.id] || {};
          this.localNotes = n.notes || n.text || '';
          this.localRating = n.rating || 0;
          this.localTimesMade = n.timesMade || 0;
          this.completedSteps = {};
          this.mobileTab = 'story';
          this.batchMultiplier = 1;
          this.$nextTick(() => this._registerNav());
        }
      }
    },
    'settings.enableEditing'(enabled) {
      if (!enabled) { this.editMode = false; this.editingField = null; }
    },
    mobileTab(newTab) {
      if (!this._navFromProp) {
        this.$emit('update-nav-active', newTab);
      }
    },
    contextualNavActiveTab(newTab) {
      if (newTab && newTab !== this.mobileTab && this.mobileTabs.some(t => t.id === newTab)) {
        this._navFromProp = true;
        this.mobileTab = newTab;
        this._navFromProp = false;
      }
    },
  },

  mounted() {
    document.addEventListener('keydown', this.onKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this._registerNav();
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKey);
    this.$emit('clear-nav');
  },

  methods: {
    _registerNav() {
      this.$emit('set-nav', { tabs: this.mobileTabs, active: this.mobileTab });
    },
    onKey(e) { if (e.key === 'Escape') this.$emit('close'); },
    fmtDays(d) {
      if (typeof d !== 'number') return String(d);
      if (d >= 365) return Math.round(d / 365) + ' year' + (Math.round(d / 365) > 1 ? 's' : '');
      if (d >= 30) return Math.round(d / 30) + ' month' + (Math.round(d / 30) > 1 ? 's' : '');
      if (d >= 7) return Math.round(d / 7) + ' week' + (Math.round(d / 7) > 1 ? 's' : '');
      return d + ' day' + (d > 1 ? 's' : '');
    },
    toggleStep(k) { this.completedSteps[k] = !this.completedSteps[k]; },
    setRating(n) { this.localRating = n; this.saveNotes(); },
    saveNotes() {
      this.$emit('update-notes', { recipeId: this.recipe.id, notes: this.localNotes, rating: this.localRating, timesMade: this.localTimesMade, updatedAt: new Date().toISOString() });
    },
    incrementTimesMade() { this.localTimesMade++; this.saveNotes(); },
    decrementTimesMade() { if (this.localTimesMade > 0) { this.localTimesMade--; this.saveNotes(); } },
    ingredientStatus(ing) {
      if (!this.hasPantry) return 'unknown';
      if (this.pantryItemNames.has((ing.name || '').toLowerCase().trim())) return 'have';
      const hasSub = (ing.substitutions || []).some(s => this.pantryItemNames.has((s.name || '').toLowerCase().trim()));
      return hasSub ? 'substitute' : 'need';
    },
    severityClass(s) {
      const c = { info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30', important: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30', warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30', critical: 'border-l-red-500 bg-red-50 dark:bg-red-950/30', danger: 'border-l-red-500 bg-red-50 dark:bg-red-950/30', safety: 'border-l-red-500 bg-red-50 dark:bg-red-950/30', tip: 'border-l-green-500 bg-green-50 dark:bg-green-950/30' };
      return c[s] || c.info;
    },
    sevIcon(s) { return ({ info: 'ℹ', important: '⚠', warning: '⚠', critical: '🚨', danger: '🚨', safety: '🚨', tip: '💡' })[s] || 'ℹ'; },
    stepKey(step, i) { return step.step || step.id || i; },
    stepTitle(step) { return step.title || ''; },
    stepText(step) { return typeof step === 'string' ? step : step.instruction || step.text || step.description || ''; },

    // ── Inline Editing ──
    toggleEditMode() {
      this.editMode = !this.editMode;
      this.editingField = null;
    },
    editField(field) {
      if (this.editMode) this.editingField = field;
    },
    getEditedValue(field, original) {
      return FermentEdits.getValue('recipe', this.recipe.id, field, original);
    },
    saveEdit(field, value) {
      FermentEdits.set('recipe', this.recipe.id, field, value);
      this.editingField = null;
    },
    resetEdit(field) {
      FermentEdits.resetField('recipe', this.recipe.id, field);
      this.editingField = null;
    },
    isFieldEdited(field) {
      return FermentEdits.isEdited('recipe', this.recipe.id, field);
    },
    hasAnyEdits() {
      return FermentEdits.hasEdits('recipe', this.recipe.id);
    },
    resetAllEdits() {
      if (confirm('Reset all edits for this recipe? Original data will be restored.')) {
        FermentEdits.resetAll('recipe', this.recipe.id);
        this.editingField = null;
      }
    },
    editCount() {
      return FermentEdits.editCount('recipe', this.recipe.id);
    },
  },

  template: `
    <div class="recipe-page animate-fade-in">
      <div v-if="recipeError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong.</p>
        <p class="text-xs text-text-muted mt-1">{{ recipeError }}</p>
        <button @click="recipeError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!recipeError">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <button @click="$emit('close')"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to recipes
        </button>
        <div v-if="settings.enableEditing" class="flex items-center gap-2">
          <span v-if="hasAnyEdits() && !editMode" class="text-xs text-accent-brine">{{ editCount() }} edits</span>
          <button v-if="editMode && hasAnyEdits()" @click="resetAllEdits"
            class="text-xs text-accent-ferment hover:text-accent-ferment/80 px-2 py-1 rounded transition-colors">
            Reset all
          </button>
          <button @click="toggleEditMode"
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
              editMode ? 'bg-accent-brine/20 text-accent-aged dark:text-accent-brine border border-accent-brine/30' : 'text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary']">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            {{ editMode ? 'Done editing' : 'Edit' }}
          </button>
        </div>
      </div>

      <!-- Hero -->
      <div :class="['relative bg-gradient-to-br text-white overflow-hidden rounded-2xl', categoryGradient]">
        <img v-if="heroImage" :src="heroImage" :alt="recipe.name" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div class="relative px-6 sm:px-10 py-10 sm:py-14">
          <div class="flex items-start gap-5">
            <div class="flex-1 min-w-0">
              <span class="inline-block text-xs text-white/60 mb-3">{{ tier.emoji }} {{ tier.label }}</span>
              <!-- Editable name -->
              <h1 v-if="editMode && editingField === 'name'" class="mb-2">
                <text-editor :model-value="getEditedValue('name', recipe.name)" @update:model-value="saveEdit('name', $event)" @done="editingField = null" placeholder="Recipe name"></text-editor>
              </h1>
              <h1 v-else class="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight" :class="{'cursor-pointer hover:opacity-80': editMode}" @click="editField('name')">
                {{ getEditedValue('name', recipe.name) }}
                <span v-if="isFieldEdited('name')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
              </h1>
              <p v-if="recipe.nameLocal" class="text-xl opacity-80 font-mono mt-2">{{ recipe.nameLocal }}</p>
              <p v-if="recipe.nameRomanized && recipe.nameRomanized !== recipe.name" class="text-sm opacity-70 italic mt-1">{{ recipe.nameRomanized }}</p>
              <!-- Editable subtitle -->
              <p v-if="editMode && editingField === 'subtitle'" class="mt-2">
                <text-editor :model-value="getEditedValue('subtitle', recipe.subtitle)" @update:model-value="saveEdit('subtitle', $event)" @done="editingField = null" placeholder="Subtitle"></text-editor>
              </p>
              <p v-else-if="recipe.subtitle" class="text-base opacity-80 mt-2" :class="{'cursor-pointer hover:opacity-80': editMode}" @click="editField('subtitle')">
                {{ getEditedValue('subtitle', recipe.subtitle) }}
                <span v-if="isFieldEdited('subtitle')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
              </p>
              <p class="text-sm opacity-80 mt-3">
                <span v-if="recipe.country">{{ recipe.country }}</span>
                <span v-if="recipe.country && recipe.region"> &middot; </span>
                <span v-if="recipe.region">{{ recipe.region }}</span>
                <span v-if="recipe.culturalGroup"> &middot; {{ recipe.culturalGroup }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Image/Video Editor (edit mode only) -->
      <div v-if="editMode" class="mt-4 space-y-4">
        <div class="bg-bg-card dark:bg-dark-card border border-accent-brine/20 rounded-xl p-4">
          <h3 class="text-sm font-medium text-text-primary dark:text-dark-text mb-3 flex items-center gap-2">
            📸 Images
            <span v-if="isFieldEdited('images')" class="w-2 h-2 bg-accent-brine rounded-full"></span>
          </h3>
          <media-picker :model-value="getEditedValue('images', recipe.images)" media-type="image"
            @update:model-value="saveEdit('images', $event)"></media-picker>
          <button v-if="isFieldEdited('images')" @click="resetEdit('images')" class="text-xs text-accent-ferment mt-2">Reset images</button>
        </div>
        <div class="bg-bg-card dark:bg-dark-card border border-accent-brine/20 rounded-xl p-4">
          <h3 class="text-sm font-medium text-text-primary dark:text-dark-text mb-3 flex items-center gap-2">
            🎥 Videos
            <span v-if="isFieldEdited('videos')" class="w-2 h-2 bg-accent-brine rounded-full"></span>
          </h3>
          <media-picker :model-value="getEditedValue('videos', recipe.videos || [])" media-type="video"
            @update:model-value="saveEdit('videos', $event)"></media-picker>
          <button v-if="isFieldEdited('videos')" @click="resetEdit('videos')" class="text-xs text-accent-ferment mt-2">Reset videos</button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
        <span class="stat-pill inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ timeDisplay }}
        </span>
        <span class="stat-pill inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          {{ (recipe.ingredients || []).length }} ingredients
        </span>
        <span v-if="recipe.technique" class="stat-pill capitalize inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
          {{ recipe.technique }}
        </span>
        <span v-if="recipe.category" class="stat-pill capitalize inline-flex items-center gap-1.5">{{ categoryEmoji }} {{ recipe.category }}</span>
        <span v-if="recipe.seasonality" class="stat-pill capitalize inline-flex items-center gap-1.5">{{ Array.isArray(recipe.seasonality) ? recipe.seasonality.join(', ') : recipe.seasonality }}</span>
        <span v-if="shelfLife" class="stat-pill inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Keeps {{ shelfLife }}
        </span>
      </div>

      <!-- ========== DESKTOP: Two-column layout (lg+) ========== -->
      <div class="hidden lg:grid lg:grid-cols-12 lg:gap-8 mt-2">

        <!-- LEFT COLUMN: Story, Instructions, Variations, Notes -->
        <div class="lg:col-span-7 space-y-8">

          <!-- Story Section -->
          <section v-if="culturalContext.story || culturalContext.historicalNote || culturalContext.historical || culturalContext.significance">
            <div v-if="culturalContext.story || editMode">
              <h2 class="section-heading">The Story</h2>
              <div v-if="editMode && editingField === 'story'">
                <text-editor :model-value="getEditedValue('culturalContext.story', culturalContext.story)" :multiline="true"
                  @update:model-value="saveEdit('culturalContext.story', $event)" @done="editingField = null" placeholder="The story behind this recipe..."></text-editor>
              </div>
              <p v-else class="text-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-line"
                :class="{'cursor-pointer hover:bg-accent-brine/5 rounded-lg -mx-2 px-2 -my-1 py-1 transition-colors': editMode}"
                @click="editField('story')">
                {{ getEditedValue('culturalContext.story', culturalContext.story) }}
                <span v-if="isFieldEdited('culturalContext.story')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
              </p>
            </div>

            <div v-if="recipe.video && recipe.video.url" class="mt-6">
              <a :href="recipe.video.url" target="_blank" rel="noopener noreferrer"
                class="group flex items-center gap-4 p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">
                <div class="flex-shrink-0 w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                  <svg class="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-text-primary dark:text-dark-text group-hover:text-accent-brine transition-colors truncate">{{ recipe.video.title }}</p>
                  <p class="text-xs text-text-muted mt-0.5">{{ recipe.video.channel }} · YouTube</p>
                </div>
              </a>
            </div>

            <div v-if="culturalContext.historicalNote || culturalContext.historical" class="relative mt-6 pl-6 py-4 border-l-4 border-accent-brine bg-bg-secondary/30 dark:bg-dark-secondary/30 rounded-r-xl">
              <h3 class="font-medium text-sm text-accent-aged dark:text-accent-brine mb-1.5">Historical Note</h3>
              <p class="font-serif text-base italic text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.historicalNote || culturalContext.historical }}</p>
            </div>

            <div v-if="culturalContext.significance" class="mt-6 bg-accent-brine/5 dark:bg-accent-brine/10 rounded-xl p-5">
              <h3 class="font-serif text-base font-medium text-accent-aged dark:text-accent-brine mb-2">Cultural Significance</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.significance }}</p>
            </div>

            <div v-if="culturalContext.relatedTraditions && culturalContext.relatedTraditions.length" class="mt-6">
              <h3 class="font-serif text-base font-medium text-text-primary dark:text-dark-text mb-3">Related Traditions</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="(t, i) in culturalContext.relatedTraditions" :key="i" class="px-3 py-1.5 bg-bg-secondary dark:bg-dark-secondary rounded-full text-xs text-text-secondary dark:text-dark-text-secondary">
                  {{ typeof t === 'string' ? t : t.name || t.text || String(t) }}
                </span>
              </div>
            </div>

            <div v-if="culturalContext.funFact" class="mt-6 p-5 bg-accent-ferment/5 dark:bg-accent-ferment/10 rounded-xl border border-accent-ferment/10">
              <h3 class="font-serif text-base font-medium text-accent-ferment mb-2">Fun Fact</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.funFact }}</p>
            </div>
          </section>

          <div v-else class="text-center py-12 text-text-muted">
            <p class="text-5xl mb-3">📜</p>
            <p class="font-serif text-lg">The story of {{ recipe.name }} is still being written...</p>
          </div>

          <!-- Instructions -->
          <section v-if="stepsData.length > 0 || editMode">
            <div class="flex items-center justify-between mb-4">
              <h2 class="section-heading !mb-0">
                Instructions
                <span v-if="isFieldEdited('steps')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
              </h2>
              <span v-if="!editMode && stepsProgress > 0" class="text-xs text-accent-culture font-medium bg-accent-culture/10 px-2.5 py-1 rounded-full">{{ stepsProgress }}% done</span>
            </div>
            <!-- Edit mode: ListEditor for steps -->
            <list-editor v-if="editMode" :model-value="getEditedValue('steps', recipe.steps || [])" item-type="step"
              @update:model-value="saveEdit('steps', $event)"></list-editor>
            <template v-else>
              <button v-if="isFieldEdited('steps')" @click="resetEdit('steps')" class="text-xs text-accent-ferment mb-2">Reset steps</button>
              <div v-if="stepsProgress > 0" class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-1.5 mb-5">
                <div class="bg-accent-culture rounded-full h-1.5 transition-all duration-500 progress-bar" :style="{ width: stepsProgress + '%' }"></div>
              </div>
              <ol class="space-y-3">
                <li v-for="(step, idx) in stepsData" :key="stepKey(step, idx)"
                  :class="['flex gap-3 p-4 rounded-xl transition-all duration-200', completedSteps[stepKey(step, idx)] ? 'bg-accent-culture/5 dark:bg-accent-culture/10' : 'hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50']">
                  <button @click="toggleStep(stepKey(step, idx))"
                    :class="['flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 mt-0.5',
                      completedSteps[stepKey(step, idx)] ? 'bg-accent-culture text-white' : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:border-accent-culture/50 border-2 border-transparent']">
                    <span v-if="completedSteps[stepKey(step, idx)]">✓</span>
                    <span v-else>{{ step.step || idx + 1 }}</span>
                  </button>
                  <div class="flex-1 min-w-0">
                    <h4 v-if="stepTitle(step)" class="font-medium text-sm text-text-primary dark:text-dark-text" :class="{ 'line-through text-text-muted': completedSteps[stepKey(step, idx)] }">{{ stepTitle(step) }}</h4>
                    <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mt-0.5" :class="{ 'line-through opacity-60': completedSteps[stepKey(step, idx)] }">{{ stepText(step) }}</p>
                    <p v-if="step.duration" class="text-xs text-text-muted mt-1.5">⏱ {{ step.duration }}</p>
                    <div v-if="step.tips && step.tips.length" class="mt-2 space-y-1">
                      <p v-for="(tip, ti) in step.tips" :key="ti" class="text-xs text-accent-brine bg-accent-brine/8 px-3 py-1.5 rounded-lg">{{ tip }}</p>
                    </div>
                    <div v-else-if="step.tip" class="mt-2">
                      <p class="text-xs text-accent-brine bg-accent-brine/8 px-3 py-1.5 rounded-lg">{{ step.tip }}</p>
                    </div>
                    <p v-if="step.checkpoint" class="text-xs text-accent-culture bg-accent-culture/8 px-3 py-1.5 rounded-lg mt-2">{{ step.checkpoint }}</p>
                  </div>
                </li>
              </ol>
            </template>
          </section>

          <!-- Variations -->
          <section v-if="variations.length > 0">
            <h2 class="section-heading">Variations & Regional Twists</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="(v, i) in variations" :key="i" class="p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl">
                <h3 class="font-medium text-sm text-text-primary dark:text-dark-text">
                  {{ typeof v === 'string' ? v : v.name || 'Variation ' + (i + 1) }}
                  <span v-if="v.region" class="text-text-muted font-normal ml-1">&middot; {{ v.region }}</span>
                </h3>
                <p v-if="v.description" class="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 leading-relaxed">{{ v.description }}</p>
              </div>
            </div>
          </section>

          <!-- Notes Section -->
          <section class="bg-bg-card dark:bg-dark-card rounded-2xl border border-bg-secondary dark:border-dark-secondary p-6">
            <h2 class="section-heading">Your Notes</h2>
            <div class="flex items-center gap-6 mb-4">
              <div>
                <p class="text-xs text-text-muted mb-1">Rating</p>
                <div class="flex items-center gap-0.5">
                  <button v-for="star in 5" :key="star" @click="setRating(star === localRating ? 0 : star)"
                    :class="['text-xl transition-all duration-150 hover:scale-125', star <= localRating ? 'text-accent-brine' : 'text-text-muted/30 hover:text-accent-brine/50']">
                    {{ star <= localRating ? '★' : '☆' }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-xs text-text-muted mb-1">Times Made</p>
                <div class="inline-flex items-center gap-2 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-0.5">
                  <button @click="decrementTimesMade" :disabled="localTimesMade <= 0"
                    :class="['w-7 h-7 rounded-lg flex items-center justify-center text-sm', localTimesMade > 0 ? 'hover:bg-bg-card dark:hover:bg-dark-card' : 'text-text-muted/30 cursor-not-allowed']">&minus;</button>
                  <span class="font-mono text-lg font-medium text-accent-brine w-6 text-center">{{ localTimesMade }}</span>
                  <button @click="incrementTimesMade" class="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-bg-card dark:hover:bg-dark-card">+</button>
                </div>
              </div>
            </div>
            <textarea v-model="localNotes" @blur="saveNotes" rows="5"
              class="w-full p-4 rounded-xl border border-bg-secondary dark:border-dark-secondary bg-bg-secondary/30 dark:bg-dark-secondary/30 text-sm text-text-primary dark:text-dark-text resize-y focus:outline-none focus:ring-2 focus:ring-accent-brine/50 placeholder-text-muted"
              placeholder="Your tasting notes, adjustments, what worked, what didn't..."></textarea>
          </section>

          <!-- Related Recipes -->
          <section v-if="relatedRecipes.length > 0">
            <h2 class="section-heading">Related Recipes</h2>
            <div class="flex flex-wrap gap-2">
              <span v-for="(rel, i) in relatedRecipes" :key="i"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-accent-brine/10 hover:text-accent-aged dark:hover:text-accent-brine cursor-pointer transition-colors">
                {{ typeof rel === 'string' ? rel : rel.name || String(rel) }}
              </span>
            </div>
          </section>

          <!-- Tags & Dietary -->
          <div class="pb-4">
            <div v-if="editMode" class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-text-primary dark:text-dark-text mb-2 flex items-center gap-2">
                  Tags <span v-if="isFieldEdited('tags')" class="w-2 h-2 bg-accent-brine rounded-full"></span>
                </h3>
                <tag-editor :model-value="getEditedValue('tags', recipe.tags || [])" :suggestions="['fermented','quick','traditional','spicy','probiotic','vegan','beginner','seasonal']"
                  @update:model-value="saveEdit('tags', $event)"></tag-editor>
                <button v-if="isFieldEdited('tags')" @click="resetEdit('tags')" class="text-xs text-accent-ferment mt-1">Reset tags</button>
              </div>
              <div>
                <h3 class="text-sm font-medium text-text-primary dark:text-dark-text mb-2 flex items-center gap-2">
                  Dietary Flags <span v-if="isFieldEdited('dietaryFlags')" class="w-2 h-2 bg-accent-brine rounded-full"></span>
                </h3>
                <tag-editor :model-value="getEditedValue('dietaryFlags', recipe.dietaryFlags || [])" :suggestions="['vegan','vegetarian','gluten-free','dairy-free','raw','low-sodium']"
                  @update:model-value="saveEdit('dietaryFlags', $event)"></tag-editor>
                <button v-if="isFieldEdited('dietaryFlags')" @click="resetEdit('dietaryFlags')" class="text-xs text-accent-ferment mt-1">Reset dietary flags</button>
              </div>
              <div>
                <h3 class="text-sm font-medium text-text-primary dark:text-dark-text mb-2 flex items-center gap-2">
                  Citations <span v-if="isFieldEdited('citations')" class="w-2 h-2 bg-accent-brine rounded-full"></span>
                </h3>
                <citation-editor :model-value="getEditedValue('citations', recipe.citations || [])"
                  @update:model-value="saveEdit('citations', $event)"></citation-editor>
                <button v-if="isFieldEdited('citations')" @click="resetEdit('citations')" class="text-xs text-accent-ferment mt-1">Reset citations</button>
              </div>
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <span v-for="flag in (recipe.dietaryFlags || [])" :key="'df-'+flag"
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-culture/10 text-accent-culture capitalize">{{ flag }}</span>
              <span v-for="tag in (recipe.tags || [])" :key="'t-'+tag"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-bg-secondary dark:bg-dark-secondary text-text-muted">#{{ tag }}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Sticky sidebar -->
        <div class="lg:col-span-5">
          <div class="lg:sticky lg:top-20 space-y-6">

            <!-- TL;DR -->
            <div v-if="recipe.tldr" class="p-4 bg-accent-brine/10 dark:bg-accent-brine/20 rounded-xl border border-accent-brine/20">
              <h3 class="font-medium text-xs text-accent-brine mb-1 uppercase tracking-wider">TL;DR</h3>
              <p class="text-sm text-text-primary dark:text-dark-text italic leading-relaxed">{{ recipe.tldr }}</p>
            </div>

            <!-- Ingredients -->
            <div class="bg-bg-card dark:bg-dark-card rounded-2xl border border-bg-secondary dark:border-dark-secondary p-5" :class="{'border-accent-brine/20': editMode}">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">
                  Ingredients
                  <span v-if="isFieldEdited('ingredients')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
                </h3>
                <div class="inline-flex items-center gap-0.5 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-0.5">
                  <button v-for="m in [0.5, 1, 2, 4]" :key="m" @click="batchMultiplier = m"
                    :class="['px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all', batchMultiplier === m ? 'bg-accent-brine text-white' : 'text-text-secondary hover:text-text-primary dark:hover:text-dark-text']">
                    {{ m }}x
                  </button>
                </div>
              </div>
              <!-- Edit mode: ListEditor for ingredients -->
              <list-editor v-if="editMode" :model-value="getEditedValue('ingredients', recipe.ingredients || [])" item-type="ingredient"
                @update:model-value="saveEdit('ingredients', $event)"></list-editor>
              <template v-else>
                <button v-if="isFieldEdited('ingredients')" @click="resetEdit('ingredients')" class="text-xs text-accent-ferment mb-2">Reset ingredients</button>
                <ul class="space-y-1">
                  <li v-for="(ing, i) in scaledIngredients" :key="i"
                    :class="['flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors', ingredientStatus(ing) === 'have' ? 'bg-accent-culture/8 dark:bg-accent-culture/15' : 'hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50']">
                    <span v-if="hasPantry" class="flex-shrink-0 w-5 text-center text-sm">
                      <span v-if="ingredientStatus(ing) === 'have'" title="In pantry">✅</span>
                      <span v-else-if="ingredientStatus(ing) === 'substitute'" title="Substitute available">🔄</span>
                      <span v-else title="Not in pantry">❌</span>
                    </span>
                    <span v-if="ing.scaledAmount != null" class="font-mono text-xs text-accent-aged dark:text-accent-brine w-14 text-right flex-shrink-0 font-medium">{{ ing.scaledAmount }} {{ ing.unit || '' }}</span>
                    <span v-else class="w-14 flex-shrink-0"></span>
                    <div class="flex-1 min-w-0">
                      <span class="font-medium text-text-primary dark:text-dark-text">{{ ing.name }}</span>
                      <span v-if="ing.nameLocal" class="text-text-muted text-xs ml-1">({{ ing.nameLocal }})</span>
                      <span v-if="ing.notes" class="text-text-muted text-xs ml-1 italic">– {{ ing.notes }}</span>
                      <span v-if="ing.essential === false" class="text-xs text-text-muted italic ml-1">(optional)</span>
                    </div>
                    <button v-if="hasPantry && ingredientStatus(ing) !== 'have'"
                      @click="$emit('add-to-pantry', { name: ing.name, category: ing.category, quantity: ing.scaledAmount, unit: ing.unit })"
                      class="flex-shrink-0 p-1 rounded hover:bg-accent-brine/20 text-text-muted hover:text-accent-brine transition-colors" title="Add to pantry">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                  </li>
                </ul>
              </template>
            </div>

            <!-- Equipment -->
            <div v-if="(recipe.equipment && recipe.equipment.length) || editMode" class="bg-bg-card dark:bg-dark-card rounded-2xl border border-bg-secondary dark:border-dark-secondary p-5" :class="{'border-accent-brine/20': editMode}">
              <h3 class="font-serif text-lg mb-3 text-text-primary dark:text-dark-text">
                Equipment
                <span v-if="isFieldEdited('equipment')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
              </h3>
              <list-editor v-if="editMode" :model-value="getEditedValue('equipment', recipe.equipment || [])" item-type="equipment"
                @update:model-value="saveEdit('equipment', $event)"></list-editor>
              <template v-else>
                <button v-if="isFieldEdited('equipment')" @click="resetEdit('equipment')" class="text-xs text-accent-ferment mb-2">Reset equipment</button>
                <div class="flex flex-wrap gap-2">
                  <span v-for="eq in recipe.equipment" :key="typeof eq === 'string' ? eq : eq.name"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary">
                    {{ typeof eq === 'string' ? eq : eq.name }}
                    <span v-if="typeof eq === 'object' && !eq.essential" class="text-text-muted text-xs">(optional)</span>
                  </span>
                </div>
              </template>
            </div>

            <!-- Things to Account For -->
            <div v-if="thingsToAccountFor.length > 0" class="space-y-2">
              <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Things to Account For</h3>
              <div v-for="(item, i) in thingsToAccountFor" :key="i"
                :class="['border-l-4 rounded-r-xl px-4 py-3', severityClass(item.severity || item.type || 'info')]">
                <h4 v-if="item.title" class="font-medium text-sm flex items-center gap-2 text-text-primary dark:text-dark-text">{{ sevIcon(item.severity || item.type || 'info') }} {{ item.title }}</h4>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1 leading-relaxed">{{ typeof item === 'string' ? item : item.description || item.text || '' }}</p>
              </div>
            </div>

            <!-- Dehydrate -->
            <div v-if="hasDehydrate" class="bg-accent-aged/5 dark:bg-accent-aged/15 rounded-xl p-5 border border-accent-aged/10">
              <h3 class="font-serif text-lg text-accent-aged dark:text-accent-brine mb-3">Dehydration</h3>
              <div class="space-y-3 text-sm">
                <div v-if="dehydrateData.method"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Method</p><p class="text-text-primary dark:text-dark-text">{{ dehydrateData.method }}</p></div>
                <div class="flex flex-wrap gap-4">
                  <div v-if="dehydrateData.temp"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Temp</p><p class="font-mono text-text-primary dark:text-dark-text">{{ dehydrateData.temp }}</p></div>
                  <div v-if="dehydrateData.time || dehydrateData.duration"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Duration</p><p class="font-mono text-text-primary dark:text-dark-text">{{ dehydrateData.time || dehydrateData.duration }}</p></div>
                </div>
                <div v-if="dehydrateData.result"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Result</p><p class="text-text-primary dark:text-dark-text">{{ dehydrateData.result }}</p></div>
              </div>
            </div>

            <!-- Sources -->
            <div v-if="recipe.sources && recipe.sources.length" class="text-sm">
              <h3 class="font-serif text-base text-text-primary dark:text-dark-text mb-2">Sources</h3>
              <ul class="space-y-1">
                <li v-for="(src, i) in recipe.sources" :key="i">
                  <a v-if="src.url" :href="src.url" target="_blank" rel="noopener noreferrer" class="text-accent-brine hover:underline text-xs">{{ src.title || src.url }}</a>
                  <span v-else class="text-text-muted text-xs">{{ src.title || src }}</span>
                </li>
              </ul>
            </div>

            <!-- Start Batch -->
            <button @click="$emit('start-batch', recipe)"
              class="w-full py-3 bg-accent-culture hover:bg-accent-culture/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              🫙 Start a Batch
            </button>
          </div>
        </div>
      </div>

      <!-- ========== MOBILE: Tabbed vertical layout (<lg) ========== -->
      <!-- The tab navigation is rendered globally as a contextual secondary nav above the main mobile nav -->
      <div class="lg:hidden pb-10">
        <!-- spacer for contextual nav bar above mobile nav -->

        <!-- MOBILE: Story Tab -->
        <div v-if="mobileTab === 'story'" class="space-y-6">
          <div v-if="culturalContext.story">
            <h3 class="font-serif text-xl mb-3 text-accent-aged dark:text-accent-brine">The Story</h3>
            <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-line">{{ culturalContext.story }}</p>
          </div>
          <div v-if="recipe.video && recipe.video.url">
            <a :href="recipe.video.url" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-4 p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl">
              <div class="flex-shrink-0 w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center"><svg class="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              <div class="flex-1 min-w-0"><p class="font-medium text-sm truncate">{{ recipe.video.title }}</p><p class="text-xs text-text-muted mt-0.5">{{ recipe.video.channel }}</p></div>
            </a>
          </div>
          <div v-if="culturalContext.historicalNote || culturalContext.historical" class="relative pl-6 py-4 border-l-4 border-accent-brine bg-bg-secondary/30 dark:bg-dark-secondary/30 rounded-r-xl">
            <h4 class="font-medium text-sm text-accent-aged dark:text-accent-brine mb-1.5">Historical Note</h4>
            <p class="font-serif text-base italic text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.historicalNote || culturalContext.historical }}</p>
          </div>
          <div v-if="culturalContext.significance" class="bg-accent-brine/5 dark:bg-accent-brine/10 rounded-xl p-5">
            <h4 class="font-serif text-base font-medium text-accent-aged dark:text-accent-brine mb-2">Cultural Significance</h4>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.significance }}</p>
          </div>
          <div v-if="culturalContext.funFact" class="p-5 bg-accent-ferment/5 dark:bg-accent-ferment/10 rounded-xl border border-accent-ferment/10">
            <h4 class="font-serif text-base font-medium text-accent-ferment mb-2">Fun Fact</h4>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.funFact }}</p>
          </div>
          <div v-if="!culturalContext.story && !culturalContext.significance" class="text-center py-12 text-text-muted">
            <p class="text-5xl mb-3">📜</p><p class="font-serif text-lg">The story is still being written...</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="flag in (recipe.dietaryFlags || [])" :key="'mdf-'+flag" class="px-3 py-1 rounded-full text-xs font-medium bg-accent-culture/10 text-accent-culture capitalize">{{ flag }}</span>
            <span v-for="tag in (recipe.tags || [])" :key="'mt-'+tag" class="px-2.5 py-0.5 rounded-full text-xs bg-bg-secondary dark:bg-dark-secondary text-text-muted">#{{ tag }}</span>
          </div>
        </div>

        <!-- MOBILE: Recipe Tab -->
        <div v-if="mobileTab === 'recipe'" class="space-y-6">
          <div v-if="recipe.tldr" class="p-4 bg-accent-brine/10 dark:bg-accent-brine/20 rounded-xl border border-accent-brine/20">
            <h4 class="font-medium text-sm text-accent-brine mb-1">TL;DR</h4>
            <p class="text-sm italic leading-relaxed">{{ recipe.tldr }}</p>
          </div>

          <div v-if="recipe.equipment && recipe.equipment.length">
            <h4 class="font-serif text-lg mb-3">Equipment</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="eq in recipe.equipment" :key="'meq-'+(typeof eq === 'string' ? eq : eq.name)" class="px-3 py-1.5 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary">
                {{ typeof eq === 'string' ? eq : eq.name }}
              </span>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-serif text-lg">Ingredients</h4>
              <div class="inline-flex items-center gap-0.5 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-0.5">
                <button v-for="m in [0.5, 1, 2, 4]" :key="'mm-'+m" @click="batchMultiplier = m"
                  :class="['px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all', batchMultiplier === m ? 'bg-accent-brine text-white' : 'text-text-secondary']">{{ m }}x</button>
              </div>
            </div>
            <ul class="space-y-1">
              <li v-for="(ing, i) in scaledIngredients" :key="'mi-'+i" class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm">
                <span v-if="ing.scaledAmount != null" class="font-mono text-xs text-accent-aged dark:text-accent-brine w-14 text-right flex-shrink-0 font-medium">{{ ing.scaledAmount }} {{ ing.unit || '' }}</span>
                <span class="flex-1 min-w-0 font-medium">{{ ing.name }}<span v-if="ing.notes" class="text-text-muted text-xs ml-1 italic font-normal">– {{ ing.notes }}</span></span>
              </li>
            </ul>
          </div>

          <div v-if="stepsData.length > 0">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-serif text-lg">Instructions</h4>
              <span v-if="stepsProgress > 0" class="text-xs text-accent-culture font-medium">{{ stepsProgress }}%</span>
            </div>
            <ol class="space-y-3">
              <li v-for="(step, idx) in stepsData" :key="'ms-'+stepKey(step, idx)" :class="['flex gap-3 p-3 rounded-xl transition-all', completedSteps[stepKey(step, idx)] ? 'bg-accent-culture/5' : '']">
                <button @click="toggleStep(stepKey(step, idx))"
                  :class="['flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                    completedSteps[stepKey(step, idx)] ? 'bg-accent-culture text-white' : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary']">
                  <span v-if="completedSteps[stepKey(step, idx)]">✓</span><span v-else>{{ step.step || idx + 1 }}</span>
                </button>
                <div class="flex-1 min-w-0">
                  <h5 v-if="stepTitle(step)" class="font-medium text-sm" :class="{ 'line-through text-text-muted': completedSteps[stepKey(step, idx)] }">{{ stepTitle(step) }}</h5>
                  <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mt-0.5" :class="{ 'line-through opacity-60': completedSteps[stepKey(step, idx)] }">{{ stepText(step) }}</p>
                  <p v-if="step.duration" class="text-xs text-text-muted mt-1">⏱ {{ step.duration }}</p>
                </div>
              </li>
            </ol>
          </div>

          <div v-if="thingsToAccountFor.length > 0">
            <h4 class="font-serif text-lg mb-3">Things to Account For</h4>
            <div class="space-y-2">
              <div v-for="(item, i) in thingsToAccountFor" :key="'ma-'+i" :class="['border-l-4 rounded-r-xl px-4 py-3', severityClass(item.severity || item.type || 'info')]">
                <h5 v-if="item.title" class="font-medium text-sm">{{ sevIcon(item.severity || item.type) }} {{ item.title }}</h5>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{{ typeof item === 'string' ? item : item.description || item.text || '' }}</p>
              </div>
            </div>
          </div>

          <div v-if="variations.length > 0">
            <h4 class="font-serif text-lg mb-3">Variations</h4>
            <div class="space-y-3">
              <div v-for="(v, i) in variations" :key="'mv-'+i" class="p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl">
                <h5 class="font-medium text-sm">{{ typeof v === 'string' ? v : v.name || 'Variation ' + (i + 1) }}</h5>
                <p v-if="v.description" class="text-xs text-text-secondary mt-1">{{ v.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- MOBILE: Notes Tab -->
        <div v-if="mobileTab === 'notes'" class="space-y-6">
          <div>
            <h4 class="font-serif text-lg mb-2">Your Rating</h4>
            <div class="flex items-center gap-1">
              <button v-for="star in 5" :key="'ms-'+star" @click="setRating(star === localRating ? 0 : star)"
                :class="['text-2xl transition-all hover:scale-125', star <= localRating ? 'text-accent-brine' : 'text-text-muted/30 hover:text-accent-brine/50']">
                {{ star <= localRating ? '★' : '☆' }}
              </button>
            </div>
          </div>
          <div>
            <h4 class="font-serif text-lg mb-2">Times Made</h4>
            <div class="inline-flex items-center gap-3 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-1">
              <button @click="decrementTimesMade" :disabled="localTimesMade <= 0" class="w-9 h-9 rounded-lg flex items-center justify-center text-lg">&minus;</button>
              <span class="font-mono text-2xl font-medium text-accent-brine w-10 text-center">{{ localTimesMade }}</span>
              <button @click="incrementTimesMade" class="w-9 h-9 rounded-lg flex items-center justify-center text-lg">+</button>
            </div>
          </div>
          <div>
            <h4 class="font-serif text-lg mb-2">Personal Notes</h4>
            <textarea v-model="localNotes" @blur="saveNotes" rows="8"
              class="w-full p-4 rounded-xl border border-bg-secondary dark:border-dark-secondary bg-bg-secondary/30 dark:bg-dark-secondary/30 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent-brine/50 placeholder-text-muted"
              placeholder="Your tasting notes, adjustments, what worked..."></textarea>
          </div>
          <div v-if="recipe.sources && recipe.sources.length">
            <h4 class="font-serif text-lg mb-2">Sources</h4>
            <ul class="space-y-1.5">
              <li v-for="(src, i) in recipe.sources" :key="'msrc-'+i" class="text-sm">
                <a v-if="src.url" :href="src.url" target="_blank" class="text-accent-brine hover:underline">{{ src.title || src.url }}</a>
                <span v-else class="text-text-secondary">{{ src.title || src }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- MOBILE: Dehydrate Tab -->
        <div v-if="mobileTab === 'dehydrate' && hasDehydrate" class="space-y-4">
          <div class="bg-accent-aged/5 dark:bg-accent-aged/15 rounded-xl p-5 border border-accent-aged/10">
            <h4 class="font-serif text-lg text-accent-aged dark:text-accent-brine mb-4">Dehydration Method</h4>
            <div class="space-y-4 text-sm">
              <div v-if="dehydrateData.method"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Method</p><p>{{ dehydrateData.method }}</p></div>
              <div class="flex gap-6">
                <div v-if="dehydrateData.temp"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Temp</p><p class="font-mono">{{ dehydrateData.temp }}</p></div>
                <div v-if="dehydrateData.time || dehydrateData.duration"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Duration</p><p class="font-mono">{{ dehydrateData.time || dehydrateData.duration }}</p></div>
              </div>
              <div v-if="dehydrateData.result"><p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Result</p><p>{{ dehydrateData.result }}</p></div>
            </div>
          </div>
        </div>

        <!-- MOBILE: Bottom Action -->
        <div class="mt-6 pb-4">
          <button @click="$emit('start-batch', recipe)"
            class="w-full py-3 bg-accent-culture hover:bg-accent-culture/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            🫙 Start a Batch
          </button>
        </div>
      </div>
      </template>
    </div>
  `
};
