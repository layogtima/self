/**
 * FERMENT -- RecipeCard Component
 * Beautiful recipe card with card, list, and table-row view modes
 */

const RecipeCardComponent = {
  name: 'recipe-card',

  props: {
    recipe: {
      type: Object,
      required: true
    },
    viewMode: {
      type: String,
      default: 'card',
      validator: v => ['card', 'list', 'table'].includes(v)
    },
    pantryMatch: {
      type: Object,
      default: null
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    }
  },

  emits: ['open', 'toggle-favorite', 'toggle-bookmark', 'start-batch'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] RecipeCard error in', info, err);
    this.cardError = (err && err.message) || 'An error occurred.';
    return false;
  },

  data() {
    return {
      cardError: null,
    };
  },

  computed: {
    tier() {
      return FermentFormat.tierInfo(this.recipe.difficulty || 1);
    },

    categoryGradient() {
      const gradients = {
        vegetable: 'from-green-600/80 via-emerald-500/70 to-lime-400/60',
        sauce: 'from-red-600/80 via-orange-500/70 to-amber-400/60',
        paste: 'from-amber-700/80 via-yellow-600/70 to-orange-400/60',
        condiment: 'from-yellow-600/80 via-amber-500/70 to-orange-300/60',
        drink: 'from-cyan-600/80 via-teal-500/70 to-emerald-400/60',
        powder: 'from-purple-600/80 via-fuchsia-500/70 to-pink-400/60',
        preserve: 'from-orange-600/80 via-amber-500/70 to-yellow-400/60',
      };
      return gradients[this.recipe.category] || gradients.vegetable;
    },

    categoryIcon() {
      // SVG path data for category icons (inline, no emoji)
      const icons = {
        vegetable: 'M12 22c4-4 8-7.5 8-12S16.4 2 12 2 4 5.5 4 10s4 8 8 12z',
        sauce: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 4a6 6 0 110 12 6 6 0 010-12z',
        paste: 'M8 2v4M16 2v4M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z',
        condiment: 'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z',
        drink: 'M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
        powder: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        preserve: 'M8 2v4M16 2v4M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z',
      };
      return icons[this.recipe.category] || icons.paste;
    },

    ingredientCount() {
      return (this.recipe.ingredients || []).length;
    },

    timeDisplay() {
      // Prefer human-readable time string
      if (this.recipe.totalTimeHuman) return this.recipe.totalTimeHuman;
      // Build from fermentTime fields
      if (this.recipe.fermentTimeMin != null) {
        const u = (this.recipe.fermentTimeUnit || 'days').replace(/s$/, '');
        const abbr = { hour: 'h', day: 'd', week: 'w', month: 'mo', year: 'y' };
        const s = abbr[u] || u;
        if (this.recipe.fermentTimeMax && this.recipe.fermentTimeMax !== this.recipe.fermentTimeMin) {
          return this.recipe.fermentTimeMin + '–' + this.recipe.fermentTimeMax + s;
        }
        return this.recipe.fermentTimeMin + s;
      }
      // Legacy fallback
      const t = this.recipe.totalTime || this.recipe.time;
      if (!t) return '-';
      if (typeof t === 'object') {
        const days = t.min || t.days || 0;
        if (days >= 365) return Math.round(days / 365) + 'y';
        if (days >= 30) return Math.round(days / 30) + 'mo';
        if (days >= 7) return Math.round(days / 7) + 'w';
        return days + 'd';
      }
      if (typeof t === 'number') {
        if (t >= 365) return Math.round(t / 365) + 'y';
        if (t >= 30) return Math.round(t / 30) + 'mo';
        if (t >= 7) return Math.round(t / 7) + 'w';
        return t + 'd';
      }
      return t;
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

    shelfLife() {
      const d = this.recipe.dehydratorIntegration || this.recipe.dehydrate || {};
      return d.shelfLife || '';
    },

    matchPercent() {
      if (!this.pantryMatch) return null;
      return Math.round(this.pantryMatch.score * 100);
    }
  },

  template: `
    <!-- Error Fallback -->
    <div v-if="cardError"
      class="recipe-card bg-bg-card dark:bg-dark-card rounded-2xl overflow-hidden border border-accent-ferment/30 p-4">
      <p class="text-sm text-accent-ferment font-medium">Something went wrong.</p>
      <p class="text-xs text-text-muted mt-1">{{ cardError }}</p>
      <button @click="cardError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
    </div>

    <!-- CARD VIEW -->
    <div v-else-if="viewMode === 'card'"
      class="recipe-card group bg-bg-card dark:bg-dark-card rounded-2xl overflow-hidden cursor-pointer border border-bg-secondary dark:border-dark-secondary flex flex-col"
      @click="$emit('open', recipe)"
      role="article"
      :aria-label="recipe.name"
      tabindex="0"
      @keydown.enter="$emit('open', recipe)"
    >
      <!-- Hero Image -->
      <div :class="['relative h-56 bg-gradient-to-br overflow-hidden', categoryGradient]">
        <!-- Actual image if available -->
        <img v-if="heroImage" :src="heroImage" :alt="recipe.name" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div v-if="heroImage" class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

        <!-- Fallback: Category Pattern Overlay -->
        <div v-if="!heroImage" class="absolute inset-0 opacity-20">
          <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 40%);"></div>
        </div>

        <!-- Fallback: Category Icon -->
        <div v-if="!heroImage" class="absolute inset-0 flex items-center justify-center">
          <svg class="w-16 h-16 text-white/50 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="categoryIcon"/></svg>
        </div>

        <!-- Tier Badge -->
        <div class="hidden absolute top-3 left-3">
          <span :class="['inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white ', 'bg-tier-' + tier.name]">
            {{ tier.emoji }} {{ tier.label }}
          </span>
        </div>

        <!-- Favorite / Bookmark (hidden until persistence is wired up) -->
        <!--
        <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            @click.stop="$emit('toggle-favorite', recipe)"
            :class="['p-1.5 rounded-full backdrop-blur-sm transition-all duration-200', isFavorite ? 'bg-accent-ferment text-white' : 'bg-black/30 text-white hover:bg-black/50']"
            :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          >
            <svg class="w-4 h-4" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            @click.stop="$emit('toggle-bookmark', recipe)"
            :class="['p-1.5 rounded-full backdrop-blur-sm transition-all duration-200', isBookmarked ? 'bg-accent-brine text-white' : 'bg-black/30 text-white hover:bg-black/50']"
            :aria-label="isBookmarked ? 'Remove bookmark' : 'Bookmark'"
          >
            <svg class="w-4 h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        -->

        <!-- Pantry Match Indicator -->
        <div v-if="matchPercent !== null" class="absolute bottom-3 right-3">
          <span :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow',
            matchPercent === 100 ? 'bg-accent-culture/90 text-white' : matchPercent >= 70 ? 'bg-accent-brine/90 text-white' : 'bg-black/40 text-white'
          ]">
            <span v-if="matchPercent === 100">&#10003;</span>
            {{ matchPercent }}% match
          </span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="flex flex-col flex-1 p-4">
        <!-- Name + Origin -->
        <div class="mb-2">
          <h3 class="font-serif text-lg leading-tight text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors duration-300">
            {{ recipe.name }}
          </h3>
          <p v-if="recipe.nameLocal" class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5 font-mono">
            {{ recipe.nameLocal }}
          </p>
          <p class="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
            <span v-if="recipe.country">{{ recipe.country }}</span>
            <span v-if="recipe.country && recipe.region"> &middot; </span>
            <span v-if="recipe.region">{{ recipe.region }}</span>
          </p>
        </div>

        <!-- TL;DR -->
        <p v-if="recipe.tldr" class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3 line-clamp-2 flex-1">
          {{ recipe.tldr }}
        </p>

        <!-- Stats Bar -->
        <div class="flex items-center gap-4 pt-3 border-t border-bg-secondary/70 dark:border-dark-secondary mt-auto overflow-x-auto scrollbar-hide">
          <span class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-dark-text-secondary flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ timeDisplay }}
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-dark-text-secondary flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            {{ ingredientCount }} ingr.
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-dark-text-secondary flex-shrink-0 capitalize">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            {{ recipe.technique || 'brine' }}
          </span>
          <span v-if="shelfLife" class="inline-flex items-center gap-1.5 text-xs text-text-muted dark:text-dark-text-secondary flex-shrink-0">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            {{ shelfLife }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 mt-3">
          <button
            @click.stop="$emit('start-batch', recipe)"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-brine/10 hover:bg-accent-brine/20 text-accent-aged dark:text-accent-brine rounded-xl text-sm font-medium transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Start Batch
          </button>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-else-if="viewMode === 'list'"
      class="group flex items-center gap-4 bg-bg-card dark:bg-dark-card rounded-xl px-4 py-3 cursor-pointer border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 hover:-translate-y-0.5 transition-all duration-200"
      @click="$emit('open', recipe)"
      role="article"
      :aria-label="recipe.name"
      tabindex="0"
      @keydown.enter="$emit('open', recipe)"
    >
      <!-- Recipe Image or Category Icon -->
      <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br', categoryGradient]">
        <img v-if="heroImage" :src="heroImage" :alt="recipe.name" class="w-full h-full object-cover" loading="lazy" />
        <svg v-else class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="categoryIcon"/></svg>
      </div>

      <!-- Name / Origin -->
      <div class="flex-1 min-w-0">
        <h3 class="font-serif text-base text-text-primary dark:text-dark-text truncate group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">
          {{ recipe.name }}
        </h3>
        <p class="text-xs text-text-muted dark:text-dark-text-secondary truncate">
          <span v-if="recipe.country">{{ recipe.country }}</span>
          <span v-if="recipe.country && recipe.region"> &middot; </span>
          <span v-if="recipe.region">{{ recipe.region }}</span>
        </p>
      </div>

      <!-- Stats -->
      <div class="hidden sm:flex items-center gap-4 flex-shrink-0 text-xs text-text-muted dark:text-dark-text-secondary">
        <span class="inline-flex items-center gap-1 w-12">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ timeDisplay }}
        </span>
        <span class="inline-flex items-center gap-1 w-8">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          {{ ingredientCount }}
        </span>
        <span class="capitalize w-20 truncate">{{ recipe.technique || 'brine' }}</span>
      </div>

      <!-- Pantry Match -->
      <div v-if="matchPercent !== null" class="flex-shrink-0">
        <span :class="[
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          matchPercent === 100 ? 'bg-accent-culture/15 text-accent-culture' : matchPercent >= 70 ? 'bg-accent-brine/15 text-accent-brine' : 'bg-bg-secondary dark:bg-dark-secondary text-text-muted'
        ]">
          {{ matchPercent }}%
        </span>
      </div>

      <!-- Favorite indicator (hidden until persistence is wired up) -->
      <!--
      <div class="flex-shrink-0 flex items-center gap-1">
        <button
          @click.stop="$emit('toggle-favorite', recipe)"
          :class="['p-1 rounded-lg transition-colors duration-200', isFavorite ? 'text-accent-ferment' : 'text-text-muted/30 hover:text-text-muted']"
          :aria-label="isFavorite ? 'Unfavorite' : 'Favorite'"
        >
          <svg class="w-4 h-4" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      -->
    </div>

    <!-- TABLE ROW VIEW -->
    <tr v-else
      class="group cursor-pointer hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50 transition-colors duration-150 border-b border-bg-secondary/50 dark:border-dark-secondary/50"
      @click="$emit('open', recipe)"
      tabindex="0"
      @keydown.enter="$emit('open', recipe)"
    >
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br', categoryGradient]">
            <img v-if="heroImage" :src="heroImage" :alt="recipe.name" class="w-full h-full object-cover" loading="lazy" />
            <svg v-else class="w-4 h-4 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="categoryIcon"/></svg>
          </div>
          <div>
            <span class="font-medium text-sm text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">{{ recipe.name }}</span>
            <span v-if="recipe.nameLocal" class="text-xs text-text-muted ml-1.5 font-mono">{{ recipe.nameLocal }}</span>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
        {{ recipe.country || recipe.region || '-' }}
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary capitalize">
        {{ recipe.category || '-' }}
      </td>
      <td class="px-4 py-3">
        <span :class="['inline-flex items-center gap-1 text-xs font-medium', 'text-tier-' + tier.name]">
          {{ tier.emoji }} {{ recipe.difficulty || 1 }}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
        {{ timeDisplay }}
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary">
        {{ ingredientCount }}
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary capitalize">
        {{ recipe.technique || '-' }}
      </td>
        <td class="px-4 py-3">
          <!-- Actions hidden until persistence is wired up -->
        </td>
    </tr>
  `
};
