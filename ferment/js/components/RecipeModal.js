/**
 * FERMENT -- Recipe Modal Component
 * Full recipe detail view with tabs: Story, Recipe, Notes, Dehydrate
 */

const RecipeModalComponent = {
  name: 'recipe-modal',

  props: {
    recipe: { type: Object, required: true },
    pantry: { type: Array, default: () => [] },
    recipeNotes: { type: Object, default: () => ({}) },
    favorites: { type: Array, default: () => [] },
    bookmarks: { type: Array, default: () => [] },
    settings: { type: Object, default: () => ({}) },
  },

  emits: ['close', 'toggle-favorite', 'toggle-bookmark', 'update-notes', 'start-batch', 'add-to-pantry'],

  data() {
    return {
      activeTab: 'story',
      batchMultiplier: 1,
      completedSteps: {},
      localNotes: '',
      localRating: 0,
      localTimesMade: 0,
    };
  },

  computed: {
    tier() {
      return FermentFormat.tierInfo(this.recipe.difficulty || 1);
    },

    isFavorite() {
      return this.favorites.includes(this.recipe.id);
    },

    isBookmarked() {
      return this.bookmarks.includes(this.recipe.id);
    },

    notes() {
      return this.recipeNotes[this.recipe.id] || {};
    },

    scaledIngredients() {
      return (this.recipe.ingredients || []).map(ing => ({
        ...ing,
        scaledAmount: ing.amount != null ? FermentFormat.scaleAmount(ing.amount, this.batchMultiplier) : null,
      }));
    },

    tabs() {
      const t = [
        { id: 'story', label: 'Story' },
        { id: 'recipe', label: 'Recipe' },
        { id: 'notes', label: 'Notes' },
      ];
      if (this.hasDehydrate) {
        t.push({ id: 'dehydrate', label: 'Dehydrate' });
      }
      return t;
    },

    hasDehydrate() {
      const d = this.recipe.dehydratorIntegration || this.recipe.dehydrate;
      return d && (d.applicable || d.method || d.temp || d.result);
    },

    dehydrateData() {
      return this.recipe.dehydratorIntegration || this.recipe.dehydrate || {};
    },

    categoryGradient() {
      const gradients = {
        vegetable: 'from-green-700 via-emerald-600 to-lime-500',
        sauce: 'from-red-700 via-orange-600 to-amber-500',
        paste: 'from-amber-800 via-yellow-700 to-orange-500',
        condiment: 'from-yellow-700 via-amber-600 to-orange-400',
        drink: 'from-cyan-700 via-teal-600 to-emerald-500',
        powder: 'from-purple-700 via-fuchsia-600 to-pink-500',
        preserve: 'from-orange-700 via-amber-600 to-yellow-500',
      };
      return gradients[this.recipe.category] || 'from-stone-700 via-stone-600 to-stone-500';
    },

    categoryEmoji() {
      const emojis = {
        vegetable: '🥬', sauce: '🫗', paste: '🫙',
        condiment: '🧂', drink: '🍵', powder: '✨', preserve: '🍯'
      };
      return emojis[this.recipe.category] || '🫙';
    },

    hasPantry() {
      return this.pantry.length > 0;
    },

    pantryMatch() {
      if (!this.hasPantry || typeof FermentMatching === 'undefined') return null;
      return FermentMatching.matchRecipe(this.recipe, this.pantry, this.settings.region);
    },

    pantryItemNames() {
      return new Set(this.pantry.map(p => p.name.toLowerCase().trim()));
    },

    timeDisplay() {
      if (this.recipe.totalTimeHuman) return this.recipe.totalTimeHuman;
      const t = this.recipe.totalTime || this.recipe.time;
      if (!t) return 'Varies';
      if (typeof t === 'object') {
        const min = t.min || t.days || 0;
        const max = t.max || min;
        if (min === max) return this.formatDays(min);
        return this.formatDays(min) + ' - ' + this.formatDays(max);
      }
      return this.formatDays(t);
    },

    stepsData() {
      return this.recipe.steps || this.recipe.instructions || [];
    },

    stepsProgress() {
      const total = this.stepsData.length;
      if (total === 0) return 0;
      const done = Object.values(this.completedSteps).filter(Boolean).length;
      return Math.round((done / total) * 100);
    },

    thingsToAccountFor() {
      return this.recipe.thingsToAccountFor || this.recipe.accountFor || [];
    },

    variations() {
      return this.recipe.variations || [];
    },

    relatedRecipes() {
      return this.recipe.relatedRecipes || this.recipe.related || [];
    },

    culturalContext() {
      return this.recipe.culturalContext || {};
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
          this.activeTab = 'story';
          this.batchMultiplier = 1;
        }
      }
    }
  },

  mounted() {
    document.addEventListener('keydown', this.onKeydown);
    document.body.style.overflow = 'hidden';
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
    document.body.style.overflow = '';
  },

  methods: {
    onKeydown(e) {
      if (e.key === 'Escape') this.$emit('close');
    },

    close() {
      this.$emit('close');
    },

    formatDays(d) {
      if (typeof d !== 'number') return String(d);
      if (d >= 365) return Math.round(d / 365) + ' year' + (Math.round(d / 365) > 1 ? 's' : '');
      if (d >= 30) return Math.round(d / 30) + ' month' + (Math.round(d / 30) > 1 ? 's' : '');
      if (d >= 7) return Math.round(d / 7) + ' week' + (Math.round(d / 7) > 1 ? 's' : '');
      return d + ' day' + (d > 1 ? 's' : '');
    },

    toggleStep(stepKey) {
      this.completedSteps[stepKey] = !this.completedSteps[stepKey];
    },

    setRating(n) {
      this.localRating = n;
      this.saveNotes();
    },

    saveNotes() {
      this.$emit('update-notes', {
        recipeId: this.recipe.id,
        notes: this.localNotes,
        rating: this.localRating,
        timesMade: this.localTimesMade,
        updatedAt: new Date().toISOString(),
      });
    },

    incrementTimesMade() {
      this.localTimesMade++;
      this.saveNotes();
    },

    decrementTimesMade() {
      if (this.localTimesMade > 0) {
        this.localTimesMade--;
        this.saveNotes();
      }
    },

    ingredientStatus(ing) {
      if (!this.hasPantry) return 'unknown';
      if (this.pantryItemNames.has((ing.name || '').toLowerCase().trim())) return 'have';
      const hasSub = (ing.substitutions || []).some(s =>
        this.pantryItemNames.has((s.name || '').toLowerCase().trim())
      );
      return hasSub ? 'substitute' : 'need';
    },

    severityClass(s) {
      const classes = {
        info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
        important: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
        warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
        critical: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
        danger: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
        safety: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
        tip: 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
      };
      return classes[s] || classes.info;
    },

    severityIcon(s) {
      const icons = { info: 'i', important: '!', warning: '!', critical: '!!', danger: '!!', safety: '!!', tip: '*' };
      return icons[s] || 'i';
    },

    getStepKey(step, index) {
      return step.step || step.id || index;
    },

    getStepTitle(step) {
      return step.title || '';
    },

    getStepText(step) {
      if (typeof step === 'string') return step;
      return step.instruction || step.text || step.description || '';
    },
  },

  template: `
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @keydown.escape="close">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 modal-backdrop" @click="close"></div>

      <!-- Modal Container: full-screen on mobile, centered on desktop -->
      <div class="relative w-full h-full sm:h-auto sm:max-w-3xl sm:mx-4 sm:max-h-[90vh] bg-bg-card dark:bg-dark-card sm:rounded-2xl border border-bg-secondary dark:border-dark-secondary overflow-y-auto custom-scrollbar z-10" @click.stop>

        <!-- Hero Section with gradient background -->
        <div :class="['relative bg-gradient-to-br text-white overflow-hidden', categoryGradient]">
          <!-- Pattern overlay -->
          <div class="absolute inset-0 opacity-15" style="background-image: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.2) 0%, transparent 40%);"></div>

          <!-- Hero image if available -->
          <img v-if="recipe.images && recipe.images.hero" :src="recipe.images.hero" :alt="recipe.name" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <!-- Top bar: Close / Favorite / Bookmark -->
          <div class="relative flex items-center justify-between px-4 pt-4 pb-2">
            <button
              @click="close"
              class="p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="flex items-center gap-2">
              <button
                @click="$emit('toggle-favorite', recipe)"
                :class="['p-2 rounded-full backdrop-blur-sm transition-all duration-200', isFavorite ? 'bg-accent-ferment' : 'bg-black/20 hover:bg-black/40']"
                :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              >
                <svg class="w-5 h-5" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                @click="$emit('toggle-bookmark', recipe)"
                :class="['p-2 rounded-full backdrop-blur-sm transition-all duration-200', isBookmarked ? 'bg-accent-brine' : 'bg-black/20 hover:bg-black/40']"
                :aria-label="isBookmarked ? 'Remove bookmark' : 'Bookmark'"
              >
                <svg class="w-5 h-5" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Recipe Title Area -->
          <div class="relative px-6 pb-6 pt-2">
            <div class="flex items-start gap-4">
              <span class="text-5xl opacity-80 flex-shrink-0 hidden sm:block">{{ categoryEmoji }}</span>
              <div class="flex-1 min-w-0">
                <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ', 'bg-tier-' + tier.name]">
                  {{ tier.emoji }} {{ tier.label }} &middot; {{ tier.tagline }}
                </span>
                <h2 class="font-serif text-2xl sm:text-3xl leading-tight">{{ recipe.name }}</h2>
                <p v-if="recipe.nameLocal" class="text-lg opacity-80 font-mono mt-1">{{ recipe.nameLocal }}</p>
                <p v-if="recipe.nameRomanized && recipe.nameRomanized !== recipe.name" class="text-sm opacity-70 italic mt-0.5">{{ recipe.nameRomanized }}</p>
                <p v-if="recipe.subtitle" class="text-sm opacity-80 mt-1">{{ recipe.subtitle }}</p>
                <p class="text-sm opacity-80 mt-2">
                  <span v-if="recipe.country">{{ recipe.country }}</span>
                  <span v-if="recipe.country && recipe.region"> &middot; </span>
                  <span v-if="recipe.region">{{ recipe.region }}</span>
                  <span v-if="recipe.culturalGroup"> &middot; {{ recipe.culturalGroup }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats Bar -->
        <div class="flex items-center gap-1 px-4 py-3 bg-bg-secondary/50 dark:bg-dark-secondary/50 overflow-x-auto scrollbar-hide border-b border-bg-secondary dark:border-dark-secondary">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary whitespace-nowrap ">
            {{ timeDisplay }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary whitespace-nowrap ">
            {{ (recipe.ingredients || []).length }} ingr.
          </span>
          <span v-if="recipe.technique" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary whitespace-nowrap  capitalize">
            {{ recipe.technique }}
          </span>
          <span v-if="recipe.category" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary whitespace-nowrap  capitalize">
            {{ recipe.category }}
          </span>
          <span v-if="recipe.seasonality" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg-card dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary whitespace-nowrap  capitalize">
            {{ Array.isArray(recipe.seasonality) ? recipe.seasonality.join(', ') : recipe.seasonality }}
          </span>
        </div>

        <!-- Tab Navigation -->
        <div class="flex border-b border-bg-secondary dark:border-dark-secondary px-2 overflow-x-auto scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 py-3 px-4 text-sm font-medium text-center transition-all duration-200 border-b-2 -mb-px whitespace-nowrap',
              activeTab === tab.id
                ? 'border-accent-brine text-accent-aged dark:text-accent-brine'
                : 'border-transparent text-text-muted hover:text-text-secondary dark:hover:text-dark-text-secondary'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->

          <!-- ==================== STORY TAB ==================== -->
          <div v-if="activeTab === 'story'" class="p-6 space-y-6">

            <div v-if="culturalContext.story || culturalContext.historicalNote || culturalContext.historical || culturalContext.significance">

              <!-- Main Story -->
              <div v-if="culturalContext.story">
                <h3 class="font-serif text-xl mb-3 text-accent-aged dark:text-accent-brine">The Story</h3>
                <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-line">{{ culturalContext.story }}</p>
              </div>

              <!-- Watch Video -->
              <div v-if="recipe.video && recipe.video.url" class="mt-6">
                <a :href="recipe.video.url" target="_blank" rel="noopener noreferrer"
                  class="group flex items-center gap-4 p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">
                  <div class="flex-shrink-0 w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                    <svg class="w-8 h-8 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-text-primary dark:text-dark-text group-hover:text-accent-brine transition-colors truncate">{{ recipe.video.title }}</p>
                    <p class="text-xs text-text-muted mt-0.5">{{ recipe.video.channel }} · YouTube</p>
                  </div>
                  <svg class="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              </div>

              <!-- Historical Note as Pull Quote -->
              <div v-if="culturalContext.historicalNote || culturalContext.historical" class="relative mt-6 pl-6 py-4 border-l-4 border-accent-brine bg-bg-secondary/30 dark:bg-dark-secondary/30 rounded-r-xl">
                <svg class="absolute -left-3.5 top-3 w-7 h-7 text-accent-brine bg-bg-card dark:bg-dark-card rounded-full p-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <h4 class="font-medium text-sm text-accent-aged dark:text-accent-brine mb-1.5">Historical Note</h4>
                <p class="font-serif text-base italic text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  {{ culturalContext.historicalNote || culturalContext.historical }}
                </p>
              </div>

              <!-- Significance -->
              <div v-if="culturalContext.significance" class="mt-6 bg-accent-brine/5 dark:bg-accent-brine/10 rounded-xl p-5">
                <h4 class="font-serif text-base font-medium text-accent-aged dark:text-accent-brine mb-2 flex items-center gap-2">
                  Cultural Significance
                </h4>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.significance }}</p>
              </div>

              <!-- Related Traditions -->
              <div v-if="culturalContext.relatedTraditions && culturalContext.relatedTraditions.length" class="mt-6">
                <h4 class="font-serif text-base font-medium text-text-primary dark:text-dark-text mb-3 flex items-center gap-2">
                  Related Traditions
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(t, i) in culturalContext.relatedTraditions" :key="i"
                    class="px-3 py-1.5 bg-bg-secondary dark:bg-dark-secondary rounded-full text-xs text-text-secondary dark:text-dark-text-secondary">
                    {{ typeof t === 'string' ? t : t.name || t.text || String(t) }}
                  </span>
                </div>
              </div>

              <!-- Fun Fact -->
              <div v-if="culturalContext.funFact" class="mt-6 p-5 bg-accent-ferment/5 dark:bg-accent-ferment/10 rounded-xl border border-accent-ferment/10">
                <h4 class="font-serif text-base font-medium text-accent-ferment mb-2 flex items-center gap-2">
                  Fun Fact
                </h4>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ culturalContext.funFact }}</p>
              </div>
            </div>

            <!-- Fallback -->
            <div v-else class="text-center py-12 text-text-muted">
              <p class="text-5xl mb-3">📜</p>
              <p class="font-serif text-lg">The story of {{ recipe.name }} is still being written...</p>
            </div>

            <!-- Dietary Flags -->
            <div v-if="recipe.dietaryFlags && recipe.dietaryFlags.length" class="flex flex-wrap gap-2 pt-2">
              <span v-for="flag in recipe.dietaryFlags" :key="flag"
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-culture/10 text-accent-culture capitalize">
                {{ flag }}
              </span>
            </div>

            <!-- Tags -->
            <div v-if="recipe.tags && recipe.tags.length" class="flex flex-wrap gap-2 pt-2">
              <span v-for="tag in recipe.tags" :key="tag"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-bg-secondary dark:bg-dark-secondary text-text-muted dark:text-dark-text-secondary">
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- ==================== RECIPE TAB ==================== -->
          <div v-if="activeTab === 'recipe'" class="p-6 space-y-6">

            <!-- TL;DR -->
            <div v-if="recipe.tldr" class="p-4 bg-accent-brine/10 dark:bg-accent-brine/20 rounded-xl border border-accent-brine/20">
              <h4 class="font-medium text-sm text-accent-brine mb-1">TL;DR</h4>
              <p class="text-sm text-text-primary dark:text-dark-text italic leading-relaxed">{{ recipe.tldr }}</p>
            </div>

            <!-- Equipment -->
            <div v-if="recipe.equipment && recipe.equipment.length">
              <h4 class="font-serif text-lg mb-3 text-text-primary dark:text-dark-text flex items-center gap-2">Equipment</h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="eq in recipe.equipment" :key="typeof eq === 'string' ? eq : eq.name"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary">
                  <span>{{ (typeof eq === 'object' && eq.essential === false) ? '~' : '·' }}</span>
                  {{ typeof eq === 'string' ? eq : eq.name }}
                  <span v-if="typeof eq === 'object' && !eq.essential" class="text-text-muted text-xs">(optional)</span>
                </span>
              </div>
              <p v-for="eq in recipe.equipment" :key="'note-' + (typeof eq === 'string' ? eq : eq.name)">
                <span v-if="typeof eq === 'object' && eq.notes" class="text-xs text-text-muted ml-2 block mt-1">{{ eq.name }}: {{ eq.notes }}</span>
              </p>
            </div>

            <!-- Ingredients -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-serif text-lg text-text-primary dark:text-dark-text flex items-center gap-2">Ingredients</h4>
                <div class="inline-flex items-center gap-0.5 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-0.5">
                  <button v-for="m in [0.5, 1, 2, 4]" :key="m"
                    @click="batchMultiplier = m"
                    :class="['px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200',
                      batchMultiplier === m ? 'bg-accent-brine text-white shadow-warm' : 'text-text-secondary hover:text-text-primary dark:hover:text-dark-text']">
                    {{ m }}x
                  </button>
                </div>
              </div>
              <ul class="space-y-1">
                <li v-for="(ing, i) in scaledIngredients" :key="i"
                  :class="[
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                    ingredientStatus(ing) === 'have'
                      ? 'bg-accent-culture/8 dark:bg-accent-culture/15'
                      : 'hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50'
                  ]"
                >
                  <!-- Pantry status -->
                  <span v-if="hasPantry" class="flex-shrink-0 w-5 text-center text-sm">
                    <span v-if="ingredientStatus(ing) === 'have'" title="In pantry">✅</span>
                    <span v-else-if="ingredientStatus(ing) === 'substitute'" title="Substitute available">🔄</span>
                    <span v-else title="Not in pantry">❌</span>
                  </span>

                  <!-- Amount -->
                  <span v-if="ing.scaledAmount != null" class="font-mono text-xs text-accent-aged dark:text-accent-brine w-16 text-right flex-shrink-0 font-medium">
                    {{ ing.scaledAmount }} {{ ing.unit || '' }}
                  </span>
                  <span v-else class="w-16 flex-shrink-0"></span>

                  <!-- Name -->
                  <div class="flex-1 min-w-0">
                    <span class="font-medium text-text-primary dark:text-dark-text">{{ ing.name }}</span>
                    <span v-if="ing.nameLocal" class="text-text-muted text-xs ml-1">({{ ing.nameLocal }})</span>
                    <span v-if="ing.notes" class="text-text-muted text-xs ml-1 italic">- {{ ing.notes }}</span>
                    <span v-if="ing.essential === false" class="text-xs text-text-muted italic ml-1">(optional)</span>
                    <!-- Substitutions -->
                    <div v-if="ing.substitutions && ing.substitutions.length" class="mt-0.5">
                      <details class="text-xs">
                        <summary class="text-text-muted cursor-pointer hover:text-text-secondary">Substitutions</summary>
                        <ul class="mt-1 ml-2 space-y-0.5">
                          <li v-for="sub in ing.substitutions" :key="sub.name" class="text-text-muted">
                            <span class="font-medium">{{ sub.name }}</span><span v-if="sub.notes"> &mdash; {{ sub.notes }}</span>
                          </li>
                        </ul>
                      </details>
                    </div>
                  </div>

                  <!-- Add to pantry -->
                  <button
                    v-if="hasPantry && ingredientStatus(ing) !== 'have'"
                    @click="$emit('add-to-pantry', { name: ing.name, category: ing.category, quantity: ing.scaledAmount, unit: ing.unit })"
                    class="flex-shrink-0 p-1 rounded hover:bg-accent-brine/20 text-text-muted hover:text-accent-brine transition-colors"
                    title="Add to pantry"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Steps / Instructions -->
            <div v-if="stepsData.length > 0">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-serif text-lg text-text-primary dark:text-dark-text flex items-center gap-2">Instructions</h4>
                <span v-if="stepsProgress > 0" class="text-xs text-accent-culture font-medium">{{ stepsProgress }}% done</span>
              </div>

              <!-- Progress bar -->
              <div v-if="stepsProgress > 0" class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-1.5 mb-4">
                <div class="bg-accent-culture rounded-full h-1.5 transition-all duration-500 progress-bar" :style="{ width: stepsProgress + '%' }"></div>
              </div>

              <ol class="space-y-3">
                <li v-for="(step, idx) in stepsData" :key="getStepKey(step, idx)"
                  :class="[
                    'flex gap-3 p-3 rounded-xl transition-all duration-200',
                    completedSteps[getStepKey(step, idx)]
                      ? 'bg-accent-culture/5 dark:bg-accent-culture/10'
                      : 'hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50'
                  ]"
                >
                  <!-- Step checkbox -->
                  <button
                    @click="toggleStep(getStepKey(step, idx))"
                    :class="['flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 mt-0.5',
                      completedSteps[getStepKey(step, idx)]
                        ? 'bg-accent-culture text-white'
                        : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:border-accent-culture/50 border-2 border-transparent']"
                  >
                    <span v-if="completedSteps[getStepKey(step, idx)]">✓</span>
                    <span v-else>{{ (step.step || idx + 1) }}</span>
                  </button>

                  <!-- Step content -->
                  <div class="flex-1 min-w-0">
                    <h5 v-if="getStepTitle(step)" class="font-medium text-sm text-text-primary dark:text-dark-text"
                      :class="{ 'line-through text-text-muted': completedSteps[getStepKey(step, idx)] }">
                      {{ getStepTitle(step) }}
                    </h5>
                    <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mt-0.5"
                      :class="{ 'line-through opacity-60': completedSteps[getStepKey(step, idx)] }">
                      {{ getStepText(step) }}
                    </p>
                    <p v-if="step.duration" class="text-xs text-text-muted mt-1.5">⏱ {{ step.duration }}</p>

                    <!-- Tips -->
                    <div v-if="step.tips && step.tips.length" class="mt-2 space-y-1">
                      <p v-for="(tip, ti) in step.tips" :key="ti" class="text-xs text-accent-brine bg-accent-brine/8 px-3 py-1.5 rounded-lg">
                        {{ tip }}
                      </p>
                    </div>
                    <div v-else-if="step.tip" class="mt-2">
                      <p class="text-xs text-accent-brine bg-accent-brine/8 px-3 py-1.5 rounded-lg">{{ step.tip }}</p>
                    </div>

                    <!-- Checkpoint -->
                    <p v-if="step.checkpoint" class="text-xs text-accent-culture bg-accent-culture/8 px-3 py-1.5 rounded-lg mt-2">
                      {{ step.checkpoint }}
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <!-- Things to Account For -->
            <div v-if="thingsToAccountFor.length > 0">
              <h4 class="font-serif text-lg mb-3 text-text-primary dark:text-dark-text flex items-center gap-2">Things to Account For</h4>
              <div class="space-y-2">
                <div v-for="(item, i) in thingsToAccountFor" :key="i"
                  :class="['border-l-4 rounded-r-xl px-4 py-3', severityClass(item.severity || item.type || 'info')]"
                >
                  <h5 v-if="item.title" class="font-medium text-sm flex items-center gap-2 text-text-primary dark:text-dark-text">
                    {{ severityIcon(item.severity || item.type || 'info') }} {{ item.title }}
                  </h5>
                  <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1 leading-relaxed">
                    {{ typeof item === 'string' ? item : item.description || item.text || '' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Variations -->
            <div v-if="variations.length > 0">
              <h4 class="font-serif text-lg mb-3 text-text-primary dark:text-dark-text flex items-center gap-2">Variations & Regional Twists</h4>
              <div class="grid gap-3">
                <div v-for="(v, i) in variations" :key="i" class="p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl">
                  <h5 class="font-medium text-sm text-text-primary dark:text-dark-text">
                    {{ typeof v === 'string' ? v : v.name || 'Variation ' + (i + 1) }}
                    <span v-if="v.region" class="text-text-muted font-normal ml-1">&middot; {{ v.region }}</span>
                  </h5>
                  <p v-if="v.description" class="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 leading-relaxed">{{ v.description }}</p>
                </div>
              </div>
            </div>

            <!-- Related Recipes -->
            <div v-if="relatedRecipes.length > 0">
              <h4 class="font-serif text-lg mb-3 text-text-primary dark:text-dark-text flex items-center gap-2">Related Recipes</h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="(rel, i) in relatedRecipes" :key="i"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-accent-brine/10 hover:text-accent-aged dark:hover:text-accent-brine cursor-pointer transition-colors">
                  {{ typeof rel === 'string' ? rel : rel.name || String(rel) }}
                </span>
              </div>
            </div>
          </div>

          <!-- ==================== NOTES TAB ==================== -->
          <div v-if="activeTab === 'notes'" class="p-6 space-y-6">

            <!-- Star Rating -->
            <div>
              <h4 class="font-serif text-lg mb-2 text-text-primary dark:text-dark-text">Your Rating</h4>
              <div class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  @click="setRating(star === localRating ? 0 : star)"
                  :class="[
                    'text-2xl transition-all duration-150 hover:scale-125',
                    star <= localRating ? 'text-accent-brine' : 'text-text-muted/30 hover:text-accent-brine/50'
                  ]"
                  :aria-label="star + ' star' + (star > 1 ? 's' : '')"
                >
                  {{ star <= localRating ? '★' : '☆' }}
                </button>
              </div>
            </div>

            <!-- Times Made Counter -->
            <div>
              <h4 class="font-serif text-lg mb-2 text-text-primary dark:text-dark-text">Times Made</h4>
              <div class="inline-flex items-center gap-3 bg-bg-secondary dark:bg-dark-secondary rounded-xl p-1">
                <button
                  @click="decrementTimesMade"
                  :class="[
                    'w-9 h-9 rounded-lg flex items-center justify-center text-lg font-medium transition-colors',
                    localTimesMade > 0 ? 'text-text-secondary hover:bg-bg-card dark:hover:bg-dark-card' : 'text-text-muted/30 cursor-not-allowed'
                  ]"
                  :disabled="localTimesMade <= 0"
                >
                  &minus;
                </button>
                <span class="font-mono text-2xl font-medium text-accent-brine w-10 text-center">{{ localTimesMade }}</span>
                <button
                  @click="incrementTimesMade"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-medium text-text-secondary hover:bg-bg-card dark:hover:bg-dark-card transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Personal Notes -->
            <div>
              <h4 class="font-serif text-lg mb-2 text-text-primary dark:text-dark-text">Personal Notes</h4>
              <textarea
                v-model="localNotes"
                @blur="saveNotes"
                rows="8"
                class="w-full p-4 rounded-xl border border-bg-secondary dark:border-dark-secondary bg-bg-secondary/30 dark:bg-dark-secondary/30 text-sm text-text-primary dark:text-dark-text resize-y focus:outline-none focus:ring-2 focus:ring-accent-brine/50 placeholder-text-muted dark:placeholder-dark-text-secondary"
                placeholder="Your tasting notes, adjustments, what worked, what didn't... This is your fermentation journal."
              ></textarea>
              <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-1">Notes are saved automatically when you click away.</p>
            </div>

            <!-- Sources -->
            <div v-if="recipe.sources && recipe.sources.length">
              <h4 class="font-serif text-lg mb-2 text-text-primary dark:text-dark-text">Sources & References</h4>
              <ul class="space-y-1.5">
                <li v-for="(src, i) in recipe.sources" :key="i" class="text-sm">
                  <a v-if="src.url" :href="src.url" target="_blank" rel="noopener noreferrer" class="text-accent-brine hover:underline">{{ src.title || src.url }}</a>
                  <span v-else class="text-text-secondary dark:text-dark-text-secondary">{{ src.title || src }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- ==================== DEHYDRATE TAB ==================== -->
          <div v-if="activeTab === 'dehydrate' && hasDehydrate" class="p-6 space-y-6">
            <div class="bg-accent-aged/5 dark:bg-accent-aged/15 rounded-xl p-5 border border-accent-aged/10">
              <h4 class="font-serif text-lg text-accent-aged dark:text-accent-brine mb-4 flex items-center gap-2">
                Dehydration Method
              </h4>

              <div class="space-y-4">
                <div v-if="dehydrateData.method">
                  <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-1">Method</p>
                  <p class="text-text-primary dark:text-dark-text leading-relaxed">{{ dehydrateData.method }}</p>
                </div>

                <div class="flex flex-wrap gap-6">
                  <div v-if="dehydrateData.temp">
                    <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-1">Temperature</p>
                    <p class="text-text-primary dark:text-dark-text font-mono">{{ dehydrateData.temp }}</p>
                  </div>
                  <div v-if="dehydrateData.time || dehydrateData.duration">
                    <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-1">Duration</p>
                    <p class="text-text-primary dark:text-dark-text font-mono">{{ dehydrateData.time || dehydrateData.duration }}</p>
                  </div>
                </div>

                <div v-if="dehydrateData.result">
                  <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-1">Result</p>
                  <p class="text-text-primary dark:text-dark-text">{{ dehydrateData.result }}</p>
                </div>

                <div v-if="dehydrateData.shelfLife">
                  <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-1">Shelf Life</p>
                  <p class="text-text-primary dark:text-dark-text">{{ dehydrateData.shelfLife }}</p>
                </div>

                <div v-if="dehydrateData.tips">
                  <p class="text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider mb-2">Tips</p>
                  <ul v-if="Array.isArray(dehydrateData.tips)" class="space-y-2">
                    <li v-for="(tip, i) in dehydrateData.tips" :key="i" class="text-sm text-text-secondary dark:text-dark-text-secondary flex items-start gap-2">
                      <span class="flex-shrink-0">💡</span> {{ tip }}
                    </li>
                  </ul>
                  <p v-else class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ dehydrateData.tips }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom Action Bar -->
        <div class="p-4">
          <button
            @click="$emit('start-batch', recipe)"
            class="w-full py-3 bg-accent-culture hover:bg-accent-culture/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            Start a Batch
          </button>
        </div>
      </div>
    </div>
  `
};
