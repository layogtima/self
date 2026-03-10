/**
 * FERMENT — ChangelogView Component
 * Public changelog showing features, enhancements, and fixes by date
 */

const ChangelogViewComponent = {
  name: 'changelog-view',

  props: {
    standalone: { type: Boolean, default: false },
  },

  emits: ['close'],

  data() {
    return {
      entries: [
        {
          date: '2026-03-10',
          title: 'UI Refactor & Navigation',
          items: [
            { type: 'feature', text: 'Changelog moved to footer as a dedicated full-page screen', link: '#/changelog' },
            { type: 'feature', text: 'Changelog is now a standalone navigable route (#/changelog)', link: '#/changelog' },
            { type: 'feature', text: 'Antigravity-style changelog hierarchy: Features, Improvements, Fixes per release', link: '#/changelog' },
            { type: 'feature', text: 'Fixed recipe secondary nav (Story/Recipe/Notes/Dehydrate) above main nav, always accessible', link: null },
            { type: 'feature', text: 'Screen-specific contextual nav framework for recipe and wiki article pages', link: null },
            { type: 'fix', text: 'Pantry auto-add equipment no longer crashes recipe matching or pantry views', link: '#/pantry' },
            { type: 'fix', text: 'Substitution matching now handles string and object formats safely', link: null },
            { type: 'enhancement', text: 'Category icon now visible on mobile in recipe masthead', link: null },
            { type: 'enhancement', text: 'Summary stat icons added to recipe detail page with consistent icon+text format', link: null },
            { type: 'enhancement', text: 'Summary stat icons spacing improved on recipe cards', link: null },
            { type: 'enhancement', text: 'Contributing section added to README for humans and AI agents', link: null },
          ]
        },
        {
          date: '2026-03-10',
          title: 'Equipment, Shelf Life & Content Expansion',
          items: [
            { type: 'feature', text: 'Shelf life displayed on recipe cards and detail pages', link: '#/browse' },
            { type: 'feature', text: 'Equipment management in Pantry with product links, images, and descriptions', link: '#/pantry' },
            { type: 'feature', text: '5 new wiki articles: health benefits, mold identification, equipment guide, batch scaling, storage', link: '#/wiki' },
            { type: 'enhancement', text: 'Category emoji icons in recipe page quick stats', link: null },
            { type: 'enhancement', text: 'Remaining 7 recipes enriched to 3 tips per step', link: '#/browse' },
            { type: 'enhancement', text: 'README updated with latest features and architecture', link: null },
            { type: 'fix', text: 'Back button navigation no longer loops between recipe and browse', link: null },
            { type: 'fix', text: 'Recipe page hero image now renders correctly from array format', link: null },
          ]
        },
        {
          date: '2026-03-10',
          title: 'OG Meta, URL Sharing & UI Polish',
          items: [
            { type: 'feature', text: 'Open Graph and Twitter Card meta tags for rich link previews', link: null },
            { type: 'feature', text: 'URL-based sharing — recipes and wiki articles load from hash URLs', link: null },
            { type: 'feature', text: 'Dynamic OG images generated for wiki articles', link: '#/wiki' },
            { type: 'enhancement', text: 'Better emoji icons for all 18 wiki articles', link: '#/wiki' },
            { type: 'enhancement', text: 'Recipe hero images in list view thumbnails', link: '#/browse' },
            { type: 'enhancement', text: 'Recipe hero images in table view thumbnails', link: '#/browse' },
            { type: 'enhancement', text: 'Card view image height increased 30%', link: '#/browse' },
            { type: 'enhancement', text: 'Collapsible tag filter on wiki index page', link: '#/wiki' },
            { type: 'enhancement', text: 'Glossary tool removed — wiki replaces it', link: '#/tools' },
            { type: 'fix', text: 'Time/duration sorting uses fermentTimeMin with proper unit conversion', link: '#/browse' },
            { type: 'fix', text: 'ToolsView.js syntax error fixed', link: '#/tools' },
            { type: 'fix', text: 'Tag collapse button hover state now visible', link: '#/wiki' },
          ]
        },
        {
          date: '2026-03-09',
          title: 'Wiki System & Recipe Enrichment',
          items: [
            { type: 'feature', text: '10 new wiki articles with rich citations and cross-links', link: '#/wiki' },
            { type: 'feature', text: '30 recipes enriched with tips, variations, and cultural context', link: '#/browse' },
            { type: 'feature', text: 'Browser history management with back/forward support', link: null },
            { type: 'feature', text: 'Inline editing for recipes and wiki articles (Settings toggle)', link: '#/tools' },
            { type: 'enhancement', text: 'Architecture cleanup — split monolith components, remove dead code', link: null },
          ]
        },
        {
          date: '2026-03-09',
          title: 'Foundation',
          items: [
            { type: 'feature', text: '8 Wikipedia-quality wiki articles with citations', link: '#/wiki' },
            { type: 'feature', text: '30 recipes split into individual JSON files', link: '#/browse' },
            { type: 'feature', text: 'Hero images and YouTube videos for all recipes', link: '#/browse' },
            { type: 'feature', text: 'Welcome page and onboarding flow', link: null },
            { type: 'feature', text: 'PWA with offline support via Service Worker', link: null },
            { type: 'feature', text: 'Pantry management with recipe matching', link: '#/pantry' },
            { type: 'feature', text: 'Batch journal for tracking active ferments', link: '#/journal' },
            { type: 'feature', text: 'Tools: brine calculator, batch scaler, timers, converter, pH reference', link: '#/tools' },
          ]
        },
      ],
    };
  },

  methods: {
    typeBadge(type) {
      const badges = {
        feature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        enhancement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        fix: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      };
      return badges[type] || badges.feature;
    },

    typeLabel(type) {
      return { feature: 'New', enhancement: 'Improved', fix: 'Fixed' }[type] || type;
    },

    formatDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
  },

  template: `
    <div :class="standalone ? 'max-w-2xl mx-auto' : 'max-h-96 overflow-y-auto pr-1'">
      <!-- Standalone back button -->
      <div v-if="standalone" class="mb-6">
        <button @click="$emit('close')"
          class="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary dark:hover:text-dark-text transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 class="font-serif text-3xl mt-4 text-text-primary dark:text-dark-text">What's New</h1>
        <p class="text-text-muted text-sm mt-1">Features, improvements, and fixes — most recent first.</p>
      </div>

      <div class="space-y-6">
        <div v-for="(entry, idx) in entries" :key="idx" class="space-y-2">
          <!-- Date Header -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-text-muted">{{ formatDate(entry.date) }}</span>
            <span class="text-xs font-medium text-text-secondary dark:text-dark-text-secondary">{{ entry.title }}</span>
          </div>

          <!-- Items -->
          <div class="space-y-1.5 pl-2 border-l-2 border-bg-secondary dark:border-dark-secondary">
            <div v-for="(item, i) in entry.items" :key="i" class="flex items-start gap-2 pl-3 py-0.5">
              <span :class="['inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold leading-4 flex-shrink-0 mt-0.5', typeBadge(item.type)]">
                {{ typeLabel(item.type) }}
              </span>
              <a v-if="item.link" :href="item.link" class="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed hover:text-accent-brine transition-colors">{{ item.text }}</a>
              <span v-else class="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
