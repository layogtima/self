/**
 * FERMENT - ChangelogView Component
 * Public changelog with Antigravity-style release hierarchy:
 * version card → expandable Features / Improvements / Fixes sections
 */

const ChangelogViewComponent = {
  name: 'changelog-view',

  props: {
    standalone: { type: Boolean, default: false },
  },

  emits: ['close'],

  data() {
    return {
      expanded: { 0: { feature: true, enhancement: true, fix: true } },

      entries: [
        {
          version: '1.4.0',
          date: '2026-03-10',
          title: 'Crash-Proofing & Error Boundaries',
          summary: 'Comprehensive error handling to prevent white-screen crashes and improve app resilience.',
          items: [
            { type: 'feature', text: 'Added error boundaries (errorCaptured) to all major components', link: null },
            { type: 'feature', text: 'Global Vue error handler prevents white-screen crashes', link: null },
            { type: 'enhancement', text: 'Hardened date/format utilities against invalid inputs', link: null },
            { type: 'fix', text: 'Fixed app mount resilience - loading screen no longer gets stuck', link: null },
            { type: 'fix', text: 'Fixed allRecipes computed to return empty array before load', link: null },
          ]
        },
        {
          version: '1.3.0',
          date: '2026-03-10',
          title: 'Stability, Cache Burst & UI Polish',
          summary: 'Critical crash fixes, JS cache busting, tool sandboxing, nav icons, and recipe masthead cleanup.',
          items: [
            { type: 'feature', text: 'Cache busting: all JS files now include version query strings (?v=20260310) - no more stale code on deployment', link: null },
            { type: 'feature', text: 'Tool sandboxing: each tool is isolated so a crash in one does not take down the entire Tools tab', link: '#/tools' },
            { type: 'enhancement', text: 'Secondary nav tabs now show small icons (📖 Story, 🧾 Recipe, 📝 Notes, ☀️ Dehydrate, 📄 Article, 📚 Sources)', link: null },
            { type: 'enhancement', text: 'Secondary nav uses solid background color instead of glass/blur effect', link: null },
            { type: 'enhancement', text: 'Secondary nav tabs have visible dividers between buttons for easier tapping', link: null },
            { type: 'enhancement', text: 'Primary mobile nav buttons now have subtle border demarcation between tabs', link: null },
            { type: 'enhancement', text: 'Tier badge (Beginner / Seasoned / ...) is now a subtle label instead of a prominent pill in the recipe masthead', link: null },
            { type: 'fix', text: 'Start Batch no longer crashes when recipe has no fermentTimeMax - falls back to 14 days', link: '#/journal' },
            { type: 'fix', text: 'Category emoji removed from recipe masthead hero (was showing random jar icon)', link: null },
            { type: 'fix', text: 'Service Worker cache updated to v6 to force refresh of cached assets', link: null },
          ]
        },
        {
          version: '1.2.0',
          date: '2026-03-10',
          title: 'UI Refactor & Navigation',
          summary: 'Changelog redesign, fixed navigation, recipe masthead icons, contextual nav system, and pantry stability fixes.',
          items: [
            { type: 'feature', text: 'Changelog is now a standalone screen accessible from the footer', link: '#/changelog' },
            { type: 'feature', text: 'Changelog route (#/changelog) works as a shareable URL', link: '#/changelog' },
            { type: 'feature', text: 'Antigravity-style release hierarchy with expandable Features, Improvements, Fixes', link: '#/changelog' },
            { type: 'feature', text: 'Recipe secondary nav (Story / Recipe / Notes / Dehydrate) fixed above main nav bar', link: null },
            { type: 'feature', text: 'Screen-specific contextual nav framework for recipe and wiki article pages', link: null },
            { type: 'enhancement', text: 'Category icon now visible in recipe masthead on all screen sizes', link: null },
            { type: 'enhancement', text: 'Recipe detail quick stats now show SVG icons consistent with card view', link: null },
            { type: 'enhancement', text: 'Summary stat icon spacing increased for readability', link: null },
            { type: 'enhancement', text: 'Contributing section added to README for humans and AI agents', link: null },
            { type: 'fix', text: 'Pantry auto-add equipment no longer crashes recipe matching', link: '#/pantry' },
            { type: 'fix', text: 'Substitution matching handles both string and object formats safely', link: null },
            { type: 'fix', text: 'Module-level error isolation prevents a single pantry error from taking down Browse or Pantry views', link: null },
          ]
        },
        {
          version: '1.1.2',
          date: '2026-03-10',
          title: 'Equipment, Shelf Life & Content Expansion',
          summary: 'Equipment management with product links, shelf life on cards, 5 new wiki articles.',
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
          version: '1.1.1',
          date: '2026-03-10',
          title: 'OG Meta, URL Sharing & UI Polish',
          summary: 'Rich link previews, shareable URLs, dynamic OG images for wiki articles.',
          items: [
            { type: 'feature', text: 'Open Graph and Twitter Card meta tags for rich link previews', link: null },
            { type: 'feature', text: 'URL-based sharing - recipes and wiki articles load from hash URLs', link: null },
            { type: 'feature', text: 'Dynamic OG images generated for wiki articles', link: '#/wiki' },
            { type: 'enhancement', text: 'Better emoji icons for all 18 wiki articles', link: '#/wiki' },
            { type: 'enhancement', text: 'Recipe hero images in list view thumbnails', link: '#/browse' },
            { type: 'enhancement', text: 'Recipe hero images in table view thumbnails', link: '#/browse' },
            { type: 'enhancement', text: 'Card view image height increased 30%', link: '#/browse' },
            { type: 'enhancement', text: 'Collapsible tag filter on wiki index page', link: '#/wiki' },
            { type: 'enhancement', text: 'Glossary tool removed - wiki replaces it', link: '#/tools' },
            { type: 'fix', text: 'Time/duration sorting uses fermentTimeMin with proper unit conversion', link: '#/browse' },
            { type: 'fix', text: 'ToolsView.js syntax error fixed', link: '#/tools' },
            { type: 'fix', text: 'Tag collapse button hover state now visible', link: '#/wiki' },
          ]
        },
        {
          version: '1.1.0',
          date: '2026-03-09',
          title: 'Wiki System & Recipe Enrichment',
          summary: '10 new wiki articles, all 30 recipes enriched, browser history, inline editing.',
          items: [
            { type: 'feature', text: '10 new wiki articles with rich citations and cross-links', link: '#/wiki' },
            { type: 'feature', text: '30 recipes enriched with tips, variations, and cultural context', link: '#/browse' },
            { type: 'feature', text: 'Browser history management with back/forward support', link: null },
            { type: 'feature', text: 'Inline editing for recipes and wiki articles (Settings toggle)', link: '#/tools' },
            { type: 'enhancement', text: 'Architecture cleanup - split monolith components, remove dead code', link: null },
          ]
        },
        {
          version: '1.0.0',
          date: '2026-03-09',
          title: 'Foundation',
          summary: 'Initial launch: 30 recipes, 8 wiki articles, pantry matching, batch journal, tools, PWA.',
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
    sectionItems(entry, type) {
      return entry.items.filter(i => i.type === type);
    },

    isExpanded(entryIdx, section) {
      return !!(this.expanded[entryIdx] && this.expanded[entryIdx][section]);
    },

    toggleSection(entryIdx, section) {
      if (!this.expanded[entryIdx]) {
        this.expanded = { ...this.expanded, [entryIdx]: {} };
      }
      const current = !!(this.expanded[entryIdx] && this.expanded[entryIdx][section]);
      this.expanded = {
        ...this.expanded,
        [entryIdx]: { ...this.expanded[entryIdx], [section]: !current },
      };
    },

    formatDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    },
  },

  template: `
    <div :class="standalone ? 'max-w-2xl mx-auto' : 'max-h-96 overflow-y-auto pr-1'">

      <!-- Standalone header -->
      <div v-if="standalone" class="mb-8">
        <button @click="$emit('close')"
          class="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary dark:hover:text-dark-text transition-colors mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 class="font-serif text-3xl text-text-primary dark:text-dark-text">What's New</h1>
        <p class="text-text-muted text-sm mt-2">Every release, every change. Most recent first.</p>
      </div>

      <!-- Release cards -->
      <div class="space-y-5">
        <div v-for="(entry, idx) in entries" :key="idx"
          class="bg-bg-card dark:bg-dark-card rounded-2xl overflow-hidden border border-bg-secondary dark:border-dark-secondary shadow-warm">

          <!-- Card header: version + date + title + summary -->
          <div class="px-5 pt-5 pb-4">
            <div class="flex items-baseline gap-3 mb-2">
              <span class="font-mono text-xs font-semibold text-text-muted dark:text-dark-text-secondary tracking-wider">v{{ entry.version }}</span>
              <span class="font-mono text-xs text-text-muted dark:text-dark-text-secondary">{{ formatDate(entry.date) }}</span>
            </div>
            <h2 class="font-serif text-xl text-text-primary dark:text-dark-text leading-tight">{{ entry.title }}</h2>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-1.5 leading-relaxed">{{ entry.summary }}</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-bg-secondary dark:border-dark-secondary"></div>

          <!-- Expandable sections -->
          <div class="divide-y divide-bg-secondary dark:divide-dark-secondary">

            <!-- Features -->
            <div v-if="sectionItems(entry, 'feature').length > 0">
              <button @click="toggleSection(idx, 'feature')"
                class="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-secondary/40 dark:hover:bg-dark-secondary/40 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <span class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Features</span>
                  <span class="inline-flex items-center px-2 py-0 rounded-full text-[11px] font-semibold leading-5 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">{{ sectionItems(entry, 'feature').length }}</span>
                </div>
                <svg :class="['w-4 h-4 text-text-muted transition-transform duration-200', isExpanded(idx, 'feature') ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <ul v-if="isExpanded(idx, 'feature')" class="px-5 pb-4 pt-1 space-y-2">
                <li v-for="(item, i) in sectionItems(entry, 'feature')" :key="i"
                  class="border-l-2 border-green-400/50 pl-3 py-0.5">
                  <a v-if="item.link" :href="item.link" class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed hover:text-accent-brine transition-colors">{{ item.text }}</a>
                  <span v-else class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ item.text }}</span>
                </li>
              </ul>
            </div>

            <!-- Improvements -->
            <div v-if="sectionItems(entry, 'enhancement').length > 0">
              <button @click="toggleSection(idx, 'enhancement')"
                class="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-secondary/40 dark:hover:bg-dark-secondary/40 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <span class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Improvements</span>
                  <span class="inline-flex items-center px-2 py-0 rounded-full text-[11px] font-semibold leading-5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{{ sectionItems(entry, 'enhancement').length }}</span>
                </div>
                <svg :class="['w-4 h-4 text-text-muted transition-transform duration-200', isExpanded(idx, 'enhancement') ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <ul v-if="isExpanded(idx, 'enhancement')" class="px-5 pb-4 pt-1 space-y-2">
                <li v-for="(item, i) in sectionItems(entry, 'enhancement')" :key="i"
                  class="border-l-2 border-blue-400/50 pl-3 py-0.5">
                  <a v-if="item.link" :href="item.link" class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed hover:text-accent-brine transition-colors">{{ item.text }}</a>
                  <span v-else class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ item.text }}</span>
                </li>
              </ul>
            </div>

            <!-- Fixes -->
            <div v-if="sectionItems(entry, 'fix').length > 0">
              <button @click="toggleSection(idx, 'fix')"
                class="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-secondary/40 dark:hover:bg-dark-secondary/40 transition-colors text-left">
                <div class="flex items-center gap-3">
                  <span class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Fixes</span>
                  <span class="inline-flex items-center px-2 py-0 rounded-full text-[11px] font-semibold leading-5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{{ sectionItems(entry, 'fix').length }}</span>
                </div>
                <svg :class="['w-4 h-4 text-text-muted transition-transform duration-200', isExpanded(idx, 'fix') ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <ul v-if="isExpanded(idx, 'fix')" class="px-5 pb-4 pt-1 space-y-2">
                <li v-for="(item, i) in sectionItems(entry, 'fix')" :key="i"
                  class="border-l-2 border-amber-400/50 pl-3 py-0.5">
                  <a v-if="item.link" :href="item.link" class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed hover:text-accent-brine transition-colors">{{ item.text }}</a>
                  <span v-else class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ item.text }}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
};
