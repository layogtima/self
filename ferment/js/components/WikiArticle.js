/**
 * FERMENT — WikiArticle Component
 * Rich article renderer: infobox, TOC, paragraphs with citations/cross-links,
 * images, galleries, videos, callouts, tables, lists, bibliography, see-also
 */

const WikiArticleComponent = {
  name: 'wiki-article',

  props: {
    article: { type: Object, required: true },
    allArticles: { type: Array, default: () => [] },
    allRecipes: { type: Array, default: () => [] },
  },

  emits: ['close', 'open-article', 'open-recipe'],

  data() {
    return {
      showMobileToc: false,
      activeSectionId: null,
    };
  },

  computed: {
    tocItems() {
      return (this.article.sections || [])
        .filter(s => s.type === 'heading')
        .map(s => ({ id: s.id, level: s.level, content: s.content }));
    },

    citationMap() {
      const map = {};
      (this.article.citations || []).forEach((c, i) => {
        map[c.id] = { ...c, index: i + 1 };
      });
      return map;
    },

    seeAlsoArticles() {
      return (this.article.seeAlso?.articles || [])
        .map(slug => this.allArticles.find(a => a.slug === slug || a.id === slug))
        .filter(Boolean);
    },

    seeAlsoRecipes() {
      return (this.article.seeAlso?.recipes || [])
        .map(slug => this.allRecipes.find(r => r.slug === slug || r.id === slug))
        .filter(Boolean);
    },
  },

  methods: {
    renderText(text) {
      if (!text) return '';
      let html = this.escapeHtml(text);

      // Render inline citations [cite:c1] → superscript [1]
      html = html.replace(/\[cite:([^\]]+)\]/g, (match, id) => {
        const cite = this.citationMap[id];
        if (!cite) return match;
        return `<sup class="wiki-cite-ref"><a href="#cite-${id}" class="text-accent-brine hover:text-accent-aged transition-colors">[${cite.index}]</a></sup>`;
      });

      // Render cross-links [[article:slug]] [[recipe:slug]] [[tool:slug]]
      html = html.replace(/\[\[(article|recipe|tool):([^\]]+)\]\]/g, (match, type, slug) => {
        const label = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (type === 'article') {
          return `<a href="#" data-wiki-link="${slug}" class="wiki-cross-link text-accent-brine hover:text-accent-aged border-b border-accent-brine/30 hover:border-accent-aged transition-colors">${label}</a>`;
        } else if (type === 'recipe') {
          return `<a href="#" data-recipe-link="${slug}" class="wiki-cross-link text-accent-culture hover:text-accent-aged border-b border-accent-culture/30 hover:border-accent-aged transition-colors">📗 ${label}</a>`;
        }
        return label;
      });

      // Render **bold**
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-medium text-text-primary dark:text-dark-text">$1</strong>');

      // Render newlines in callouts
      html = html.replace(/\n/g, '<br>');

      return html;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    handleClick(e) {
      // Handle wiki cross-links
      const wikiLink = e.target.closest('[data-wiki-link]');
      if (wikiLink) {
        e.preventDefault();
        const slug = wikiLink.dataset.wikiLink;
        const article = this.allArticles.find(a => a.slug === slug || a.id === slug);
        if (article) this.$emit('open-article', article);
        return;
      }

      // Handle recipe cross-links
      const recipeLink = e.target.closest('[data-recipe-link]');
      if (recipeLink) {
        e.preventDefault();
        const slug = recipeLink.dataset.recipeLink;
        const recipe = this.allRecipes.find(r => r.slug === slug || r.id === slug);
        if (recipe) this.$emit('open-recipe', recipe);
        return;
      }

      // Handle citation ref clicks (smooth scroll)
      const citeRef = e.target.closest('.wiki-cite-ref a');
      if (citeRef) {
        e.preventDefault();
        const id = citeRef.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    scrollToSection(id) {
      const el = document.getElementById('section-' + id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.showMobileToc = false;
      }
    },

    youtubeId(url) {
      if (!url) return null;
      const match = url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([\\w-]+)/);
      return match ? match[1] : null;
    },

    calloutClasses(style) {
      const styles = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
        tip: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
      };
      return styles[style] || styles.info;
    },

    calloutIcon(style) {
      return { info: 'ℹ️', warning: '⚠️', tip: '💡' }[style] || 'ℹ️';
    },
  },

  template: `
    <div class="wiki-article" @click="handleClick">
      <!-- Back Button -->
      <button @click="$emit('close')"
        class="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Wiki
      </button>

      <!-- Article Header -->
      <header class="mb-8">
        <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl text-text-primary dark:text-dark-text leading-tight mb-3">
          {{ article.title }}
        </h1>
        <p v-if="article.subtitle" class="text-lg text-text-secondary dark:text-dark-text-secondary font-serif italic">
          {{ article.subtitle }}
        </p>
        <div class="flex items-center gap-3 mt-3 text-xs text-text-muted">
          <span>{{ (article.citations || []).length }} citations</span>
          <span>·</span>
          <span>{{ tocItems.length }} sections</span>
          <span v-if="article.lastUpdated">· Updated {{ article.lastUpdated }}</span>
        </div>
      </header>

      <!-- Desktop: Two-column layout (content + sidebar) -->
      <div class="lg:flex lg:gap-8">

        <!-- Main Content Column -->
        <div class="flex-1 min-w-0">

          <!-- Mobile TOC Toggle -->
          <div class="lg:hidden mb-6">
            <button @click="showMobileToc = !showMobileToc"
              class="w-full flex items-center justify-between px-4 py-3 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl text-sm">
              <span class="font-medium">Contents</span>
              <svg :class="['w-4 h-4 transition-transform', showMobileToc ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <nav v-show="showMobileToc" class="mt-2 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl p-4">
              <ul class="space-y-1.5">
                <li v-for="item in tocItems" :key="item.id">
                  <button @click="scrollToSection(item.id)"
                    :class="['text-sm text-left w-full hover:text-accent-brine transition-colors',
                      item.level === 3 ? 'pl-4 text-text-muted' : 'text-text-secondary font-medium']">
                    {{ item.content }}
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <!-- Article Sections -->
          <div class="wiki-content space-y-5">
            <template v-for="(section, idx) in article.sections" :key="section.id || idx">

              <!-- Heading -->
              <component v-if="section.type === 'heading'"
                :is="'h' + (section.level || 2)"
                :id="'section-' + section.id"
                :class="[
                  'font-serif text-text-primary dark:text-dark-text scroll-mt-20',
                  section.level === 2 ? 'text-2xl sm:text-3xl mt-10 mb-4 pt-6 border-t border-bg-secondary dark:border-dark-secondary' : 'text-xl sm:text-2xl mt-6 mb-3'
                ]">
                {{ section.content }}
              </component>

              <!-- Paragraph -->
              <p v-else-if="section.type === 'paragraph'"
                :id="section.id ? 'section-' + section.id : undefined"
                class="text-text-secondary dark:text-dark-text-secondary leading-relaxed text-[15px]"
                v-html="renderText(section.content)">
              </p>

              <!-- Callout -->
              <div v-else-if="section.type === 'callout'"
                :class="['rounded-xl border-l-4 p-4 sm:p-5 my-4', calloutClasses(section.style)]">
                <div class="flex items-start gap-2 mb-2">
                  <span class="text-lg">{{ calloutIcon(section.style) }}</span>
                  <h4 class="font-medium text-sm text-text-primary dark:text-dark-text">{{ section.title }}</h4>
                </div>
                <div class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed pl-7"
                  v-html="renderText(section.content)">
                </div>
              </div>

              <!-- Table -->
              <div v-else-if="section.type === 'table'" class="my-6 overflow-x-auto">
                <p v-if="section.caption" class="text-xs text-text-muted mb-2 italic">{{ section.caption }}</p>
                <table class="w-full text-sm border-collapse">
                  <thead>
                    <tr class="border-b-2 border-accent-brine/30">
                      <th v-for="h in section.headers" :key="h" class="text-left px-3 py-2 font-medium text-text-primary dark:text-dark-text text-xs uppercase tracking-wider">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in section.rows" :key="ri" class="border-b border-bg-secondary dark:border-dark-secondary hover:bg-bg-secondary/30 dark:hover:bg-dark-secondary/30 transition-colors">
                      <td v-for="(cell, ci) in row" :key="ci" class="px-3 py-2.5 text-text-secondary dark:text-dark-text-secondary text-[13px] leading-relaxed" v-html="renderText(cell)"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- List -->
              <component v-else-if="section.type === 'list'"
                :is="section.ordered ? 'ol' : 'ul'"
                :class="['my-4 space-y-2 text-[15px] text-text-secondary dark:text-dark-text-secondary',
                  section.ordered ? 'list-decimal pl-6' : 'list-disc pl-6']">
                <li v-for="(item, li) in section.items" :key="li" class="leading-relaxed pl-1" v-html="renderText(item)"></li>
              </component>

              <!-- Image -->
              <figure v-else-if="section.type === 'image'" class="my-6">
                <img :src="section.url" :alt="section.caption || ''"
                  :class="['rounded-xl', section.width === 'full' ? 'w-full' : 'max-w-lg mx-auto']"
                  loading="lazy">
                <figcaption v-if="section.caption" class="text-xs text-text-muted mt-2 text-center italic">
                  {{ section.caption }}
                  <span v-if="section.attribution" class="block mt-0.5">{{ section.attribution }}</span>
                </figcaption>
              </figure>

              <!-- Gallery -->
              <div v-else-if="section.type === 'gallery'" class="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <figure v-for="(img, gi) in section.images" :key="gi">
                  <img :src="img.url" :alt="img.caption || ''" class="rounded-lg w-full h-40 object-cover" loading="lazy">
                  <figcaption v-if="img.caption" class="text-xs text-text-muted mt-1 text-center">{{ img.caption }}</figcaption>
                </figure>
              </div>

              <!-- Video -->
              <div v-else-if="section.type === 'video'" class="my-6">
                <div v-if="youtubeId(section.url)" class="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe :src="'https://www.youtube-nocookie.com/embed/' + youtubeId(section.url)"
                    class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
                </div>
                <a v-else :href="section.url" target="_blank" rel="noopener noreferrer"
                  class="flex items-center gap-3 p-4 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-colors">
                  <span class="text-2xl">▶️</span>
                  <div>
                    <p class="text-sm font-medium">{{ section.title || 'Watch video' }}</p>
                    <p v-if="section.channel" class="text-xs text-text-muted">{{ section.channel }}</p>
                  </div>
                </a>
              </div>

            </template>
          </div>

          <!-- Bibliography -->
          <div v-if="article.citations && article.citations.length > 0" class="mt-12 pt-8 border-t border-bg-secondary dark:border-dark-secondary">
            <h2 class="font-serif text-2xl text-text-primary dark:text-dark-text mb-4">References</h2>
            <ol class="space-y-3">
              <li v-for="(cite, ci) in article.citations" :key="cite.id" :id="'cite-' + cite.id"
                class="text-sm text-text-secondary dark:text-dark-text-secondary flex gap-3 scroll-mt-20 target:bg-accent-brine/10 target:rounded-lg target:p-2 target:-m-2 transition-colors">
                <span class="text-accent-brine font-mono text-xs mt-0.5 flex-shrink-0">[{{ ci + 1 }}]</span>
                <div>
                  <span>{{ cite.text }}</span>
                  <span v-if="cite.year" class="text-text-muted"> ({{ cite.year }})</span>
                  <a v-if="cite.url" :href="cite.url" target="_blank" rel="noopener noreferrer"
                    class="ml-1 text-accent-brine hover:text-accent-aged text-xs">↗ Link</a>
                </div>
              </li>
            </ol>
          </div>

          <!-- See Also -->
          <div v-if="seeAlsoArticles.length > 0 || seeAlsoRecipes.length > 0" class="mt-10 pt-8 border-t border-bg-secondary dark:border-dark-secondary">
            <h2 class="font-serif text-2xl text-text-primary dark:text-dark-text mb-4">See Also</h2>

            <!-- Related Articles -->
            <div v-if="seeAlsoArticles.length > 0" class="mb-6">
              <h3 class="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Related Articles</h3>
              <div class="grid gap-2 sm:grid-cols-2">
                <button v-for="a in seeAlsoArticles" :key="a.id"
                  @click="$emit('open-article', a)"
                  class="text-left p-3 rounded-lg bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-colors">
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">{{ a.title }}</span>
                  <p class="text-xs text-text-muted mt-0.5 line-clamp-1">{{ a.subtitle }}</p>
                </button>
              </div>
            </div>

            <!-- Related Recipes -->
            <div v-if="seeAlsoRecipes.length > 0">
              <h3 class="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Related Recipes</h3>
              <div class="flex flex-wrap gap-2">
                <button v-for="r in seeAlsoRecipes" :key="r.id"
                  @click="$emit('open-recipe', r)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-culture/10 text-accent-culture text-xs font-medium hover:bg-accent-culture/20 transition-colors">
                  📗 {{ r.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Desktop only) -->
        <aside class="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
          <div class="sticky top-20 space-y-6">

            <!-- Infobox -->
            <div v-if="article.infobox" class="bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl overflow-hidden">
              <!-- Infobox Image -->
              <img v-if="article.infobox.image" :src="article.infobox.image.url" :alt="article.infobox.image.caption || ''"
                class="w-full h-44 object-cover" loading="lazy">
              <div class="p-4">
                <h3 class="font-serif text-lg text-text-primary dark:text-dark-text mb-3">{{ article.infobox.title }}</h3>
                <p v-if="article.infobox.image && article.infobox.image.caption"
                  class="text-xs text-text-muted mb-3 italic">{{ article.infobox.image.caption }}</p>
                <dl class="space-y-2">
                  <div v-for="fact in article.infobox.facts" :key="fact.label" class="flex gap-2">
                    <dt class="text-xs text-text-muted w-24 flex-shrink-0 font-medium">{{ fact.label }}</dt>
                    <dd class="text-xs text-text-secondary dark:text-dark-text-secondary">
                      <a v-if="fact.link" href="#" :data-wiki-link="fact.link"
                        class="text-accent-brine hover:text-accent-aged border-b border-accent-brine/30 transition-colors">{{ fact.value }}</a>
                      <span v-else>{{ fact.value }}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Table of Contents -->
            <div v-if="tocItems.length > 0" class="bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl p-4">
              <h3 class="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Contents</h3>
              <nav>
                <ul class="space-y-1">
                  <li v-for="item in tocItems" :key="item.id">
                    <button @click="scrollToSection(item.id)"
                      :class="['text-xs text-left w-full py-1 hover:text-accent-brine transition-colors leading-snug',
                        item.level === 3 ? 'pl-3 text-text-muted' : 'text-text-secondary font-medium']">
                      {{ item.content }}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

          </div>
        </aside>
      </div>
    </div>
  `
};
