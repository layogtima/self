/**
 * FERMENT - WikiView Component
 * Main wiki browsing view: article list, search, tag filter, glossary search
 */

const WikiViewComponent = {
  name: 'wiki-view',

  props: {
    articles: { type: Array, default: () => [] },
    recipes: { type: Array, default: () => [] },
  },

  emits: ['open-article', 'open-recipe'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Wiki error in', info, err);
    this.wikiError = (err && err.message) || 'An error occurred in the wiki.';
    return false;
  },

  data() {
    return {
      wikiError: null,
      searchQuery: '',
      selectedTag: null,
      showTags: false,
      showGlossary: false,
      glossaryQuery: '',
    };
  },

  computed: {
    allTags() {
      const tags = new Set();
      this.articles.forEach(a => (a.tags || []).forEach(t => tags.add(t)));
      return [...tags].sort();
    },

    filteredArticles() {
      let articles = [...this.articles];

      if (this.selectedTag) {
        articles = articles.filter(a => (a.tags || []).includes(this.selectedTag));
      }

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        articles = articles.filter(a => {
          if (a.title.toLowerCase().includes(q)) return true;
          if (a.subtitle && a.subtitle.toLowerCase().includes(q)) return true;
          if ((a.tags || []).some(t => t.toLowerCase().includes(q))) return true;
          return (a.sections || []).some(s => s.content && s.content.toLowerCase().includes(q));
        });
      }

      return articles;
    },

    glossaryResults() {
      if (!this.glossaryQuery.trim()) return [];
      const q = this.glossaryQuery.toLowerCase().trim();
      const results = [];
      this.articles.forEach(article => {
        (article.sections || []).forEach((section, idx) => {
          if (section.type === 'heading' && section.level === 3) {
            if (section.content.toLowerCase().includes(q)) {
              const nextP = article.sections.slice(idx + 1).find(s => s.type === 'paragraph');
              results.push({
                term: section.content,
                definition: nextP ? this.stripMarkup(nextP.content).slice(0, 150) + '...' : '',
                articleId: article.id,
                articleTitle: article.title
              });
            }
          }
        });
      });
      return results;
    },

    articleCount() { return this.articles.length; },
    citationCount() {
      return this.articles.reduce((sum, a) => sum + (a.citations || []).length, 0);
    },
  },

  methods: {
    openArticle(article) {
      this.$emit('open-article', article);
    },

    stripMarkup(text) {
      return (text || '')
        .replace(/\[cite:[^\]]+\]/g, '')
        .replace(/\[\[(?:article|recipe|tool):[^\]]+\]\]/g, (match) => {
          const label = match.replace(/\[\[(?:article|recipe|tool):/, '').replace(']]', '').replace(/-/g, ' ');
          return label;
        });
    },

    tagColor(tag) {
      const colors = {
        science: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        safety: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        bacteria: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        culture: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        troubleshooting: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        history: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      };
      return colors[tag] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    },

    articleIcon(article) {
      const icons = {
        'how-lacto-fermentation-works': '🧪',
        'lactic-acid-bacteria': '🦠',
        'role-of-carbon-dioxide': '💨',
        'ph-levels-fermentation': '📊',
        'salt-and-fermentation': '🧂',
        'temperature-and-fermentation': '🌡️',
        'troubleshooting-ferments': '🔍',
        'fermentation-traditions-worldwide': '🌍',
        'aromatics-spices-herbs-in-fermentation': '🌿',
        'fermentation-tools-through-history': '🏺',
        'water-quality-and-fermentation': '💧',
        'fermented-foods-around-your-kitchen': '🍽️',
        'best-vegetables-fruits-to-ferment': '🥬',
        'dehydrating-and-fermenting': '☀️',
        'fermentation-and-food-safety': '🛡️',
        'fermentation-flavour-chart': '🎨',
        'second-ferments-and-flavouring': '🍋',
        'what-to-do-with-leftover-brine': '🫗',
        'health-benefits-of-fermented-foods': '💪',
        'mold-vs-kahm-when-to-worry': '🔬',
        'modern-fermentation-equipment': '⚙️',
        'scaling-fermentation-batches': '📐',
        'storing-and-preserving-ferments': '❄️',
      };
      return icons[article.id] || '📖';
    },

    sectionCount(article) {
      return (article.sections || []).filter(s => s.type === 'heading' && s.level === 2).length;
    },
  },

  template: `
    <div class="space-y-6">
      <div v-if="wikiError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong in the wiki.</p>
        <p class="text-xs text-text-muted mt-1">{{ wikiError }}</p>
        <button @click="wikiError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!wikiError">
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text mb-2">Fermentation Wiki</h2>
        <p class="text-text-secondary dark:text-dark-text-secondary">
          {{ articleCount }} articles · {{ citationCount }} citations · The science behind the salt
        </p>
      </div>

      <!-- Search + Glossary Toggle -->
      <div class="max-w-xl mx-auto space-y-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search articles..."
            class="w-full pl-10 pr-4 py-2.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-brine/30 focus:border-accent-brine">
        </div>

        <!-- Quick Glossary Search -->
        <div class="flex items-center gap-2">
          <button @click="showGlossary = !showGlossary"
            :class="['text-xs px-3 py-1.5 rounded-lg border transition-colors',
              showGlossary ? 'bg-accent-brine/10 border-accent-brine/30 text-accent-aged dark:text-accent-brine' : 'border-bg-secondary dark:border-dark-secondary text-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary']">
            📖 Quick Glossary
          </button>
        </div>

        <!-- Glossary Search Panel -->
        <div v-if="showGlossary" class="bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl p-4 space-y-3">
          <input v-model="glossaryQuery" type="text" placeholder="Search fermentation terms (e.g. koji, kahm, brine)..."
            class="w-full px-3 py-2 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-brine/30">
          <div v-if="glossaryResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
            <button v-for="r in glossaryResults" :key="r.term + r.articleId"
              @click="openArticle(articles.find(a => a.id === r.articleId))"
              class="w-full text-left p-3 rounded-lg bg-bg-secondary/30 dark:bg-dark-secondary/30 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-colors">
              <span class="font-medium text-sm text-text-primary dark:text-dark-text">{{ r.term }}</span>
              <span class="text-xs text-text-muted ml-2">in {{ r.articleTitle }}</span>
              <p class="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 line-clamp-2">{{ r.definition }}</p>
            </button>
          </div>
          <p v-else-if="glossaryQuery.trim()" class="text-xs text-text-muted text-center py-2">No terms found for "{{ glossaryQuery }}"</p>
        </div>
      </div>

      <!-- Tag Filter (collapsible) -->
      <div class="text-center">
        <button @click="showTags = !showTags"
          :class="['inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            showTags || selectedTag ? 'bg-accent-brine/10 border-accent-brine/30 text-accent-aged dark:text-accent-brine' : 'border-bg-secondary dark:border-dark-secondary text-text-secondary hover:text-text-primary hover:border-accent-brine/30 hover:bg-accent-brine/5']">
          <span>Tags</span>
          <span v-if="selectedTag" class="capitalize">&middot; {{ selectedTag }}</span>
          <svg :class="['w-3.5 h-3.5 transition-transform duration-200', showTags ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div v-show="showTags" class="flex flex-wrap gap-2 justify-center mt-3">
          <button @click="selectedTag = null"
            :class="['px-3 py-1 rounded-full text-xs font-medium transition-colors',
              !selectedTag ? 'bg-accent-brine/20 text-accent-aged dark:text-accent-brine border border-accent-brine/30' : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:text-text-primary border border-transparent']">
            All
          </button>
          <button v-for="tag in allTags" :key="tag" @click="selectedTag = selectedTag === tag ? null : tag"
            :class="['px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
              selectedTag === tag ? 'bg-accent-brine/20 text-accent-aged dark:text-accent-brine border border-accent-brine/30' : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:text-text-primary border border-transparent']">
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Article Cards -->
      <div class="grid gap-4 sm:grid-cols-2">
        <button v-for="article in filteredArticles" :key="article.id"
          @click="openArticle(article)"
          class="group text-left bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl p-5 hover:border-accent-brine/30 hover:shadow-md transition-all duration-200">

          <!-- Icon + Title -->
          <div class="flex items-start gap-3 mb-3">
            <span class="text-2xl flex-shrink-0 mt-0.5">{{ articleIcon(article) }}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-serif text-lg text-text-primary dark:text-dark-text group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors leading-snug">
                {{ article.title }}
              </h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1 line-clamp-2">
                {{ article.subtitle }}
              </p>
            </div>
          </div>

          <!-- Meta -->
          <div class="flex items-center gap-3 text-xs text-text-muted">
            <span>{{ sectionCount(article) }} sections</span>
            <span>·</span>
            <span>{{ (article.citations || []).length }} citations</span>
            <span>·</span>
            <span>{{ (article.seeAlso?.recipes || []).length }} recipes linked</span>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="tag in (article.tags || []).slice(0, 4)" :key="tag"
              :class="['px-2 py-0.5 rounded-full text-xs capitalize', tagColor(tag)]">
              {{ tag }}
            </span>
          </div>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredArticles.length === 0" class="text-center py-12">
        <p class="text-text-muted text-sm">No articles match your search.</p>
      </div>
      </template>
    </div>
  `
};
