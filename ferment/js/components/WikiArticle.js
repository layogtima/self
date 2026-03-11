/**
 * FERMENT - WikiArticle Component
 * Rich article renderer: infobox, TOC, paragraphs with citations/cross-links,
 * images, galleries, videos, callouts, tables, lists, bibliography, see-also
 */

const WikiArticleComponent = {
  name: 'wiki-article',

  props: {
    article: { type: Object, required: true },
    allArticles: { type: Array, default: () => [] },
    allRecipes: { type: Array, default: () => [] },
    settings: { type: Object, default: () => ({}) },
    contextualNavActiveTab: { type: String, default: '' },
  },

  emits: ['close', 'open-article', 'open-recipe', 'set-nav', 'update-nav-active', 'clear-nav'],

  watch: {
    'settings.enableEditing'(enabled) {
      if (!enabled) { this.editMode = false; this.editingSectionIdx = null; this.editingHeaderField = null; }
    },
    article() {
      this.$nextTick(() => this._registerNav());
    },
    contextualNavActiveTab(newTab) {
      if (newTab === 'references') {
        const el = document.getElementById('wiki-references');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.$emit('update-nav-active', newTab);
      } else if (newTab === 'read') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.$emit('update-nav-active', newTab);
      }
    },
  },

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] WikiArticle error in', info, err);
    this.articleError = (err && err.message) || 'An error occurred.';
    return false;
  },

  data() {
    return {
      articleError: null,
      showMobileToc: false,
      activeSectionId: null,
      // Inline editing
      editMode: false,
      editingSectionIdx: null,
      editingSectionField: null,
      editingHeaderField: null,
      addBlockAfter: null, // index after which to show add-block menu
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

  mounted() {
    this._registerNav();
  },

  beforeUnmount() {
    this.$emit('clear-nav');
  },

  methods: {
    _registerNav() {
      const hasCitations = (this.article.citations || []).length > 0;
      const tabs = [{ id: 'read', label: 'Article', icon: '📄' }];
      if (hasCitations) tabs.push({ id: 'references', label: 'Sources', icon: '📚' });
      this.$emit('set-nav', { tabs, active: 'read' });
    },

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
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
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

    // ── Inline Editing ──
    toggleEditMode() {
      this.editMode = !this.editMode;
      this.editingSectionIdx = null;
      this.editingSectionField = null;
      this.editingHeaderField = null;
      this.addBlockAfter = null;
    },

    getEditedValue(field, original) {
      return FermentEdits.getValue('wiki', this.article.id, field, original);
    },
    saveEdit(field, value) {
      FermentEdits.set('wiki', this.article.id, field, value);
      this.editingSectionIdx = null;
      this.editingSectionField = null;
      this.editingHeaderField = null;
    },
    resetEdit(field) {
      FermentEdits.resetField('wiki', this.article.id, field);
    },
    isFieldEdited(field) {
      return FermentEdits.isEdited('wiki', this.article.id, field);
    },
    hasAnyEdits() {
      return FermentEdits.hasEdits('wiki', this.article.id);
    },
    resetAllEdits() {
      if (confirm('Reset all edits for this article?')) {
        FermentEdits.resetAll('wiki', this.article.id);
        this.editingSectionIdx = null;
      }
    },
    editCount() {
      return FermentEdits.editCount('wiki', this.article.id);
    },

    getEditedSections() {
      return this.getEditedValue('sections', this.article.sections || []);
    },

    editSection(idx) {
      if (!this.editMode) return;
      this.editingSectionIdx = idx;
      this.editingSectionField = 'content';
    },

    saveSectionContent(idx, newContent) {
      const sections = JSON.parse(JSON.stringify(this.getEditedSections()));
      sections[idx].content = newContent;
      this.saveEdit('sections', sections);
    },

    saveSectionField(idx, field, value) {
      const sections = JSON.parse(JSON.stringify(this.getEditedSections()));
      sections[idx][field] = value;
      this.saveEdit('sections', sections);
    },

    removeSection(idx) {
      const sections = JSON.parse(JSON.stringify(this.getEditedSections()));
      sections.splice(idx, 1);
      this.saveEdit('sections', sections);
      this.editingSectionIdx = null;
    },

    moveSectionUp(idx) {
      if (idx <= 0) return;
      const sections = JSON.parse(JSON.stringify(this.getEditedSections()));
      [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]];
      this.saveEdit('sections', sections);
    },

    moveSectionDown(idx) {
      const sections = this.getEditedSections();
      if (idx >= sections.length - 1) return;
      const copy = JSON.parse(JSON.stringify(sections));
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      this.saveEdit('sections', copy);
    },

    addSection(afterIdx, type) {
      const sections = JSON.parse(JSON.stringify(this.getEditedSections()));
      const newBlock = { id: 'new-' + Date.now(), type };
      if (type === 'heading') { newBlock.level = 2; newBlock.content = 'New Section'; }
      else if (type === 'paragraph') { newBlock.content = 'New paragraph...'; }
      else if (type === 'callout') { newBlock.style = 'info'; newBlock.title = 'Note'; newBlock.content = ''; }
      else if (type === 'list') { newBlock.ordered = false; newBlock.items = ['Item 1']; }
      else if (type === 'table') { newBlock.headers = ['Column 1', 'Column 2']; newBlock.rows = [['', '']]; newBlock.caption = ''; }
      else if (type === 'image') { newBlock.url = ''; newBlock.caption = ''; }
      sections.splice(afterIdx + 1, 0, newBlock);
      this.saveEdit('sections', sections);
      this.addBlockAfter = null;
    },

    toggleAddBlock(idx) {
      this.addBlockAfter = this.addBlockAfter === idx ? null : idx;
    },
  },

  template: `
    <div class="wiki-article" @click="handleClick">
      <div v-if="articleError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong.</p>
        <p class="text-xs text-text-muted mt-1">{{ articleError }}</p>
        <button @click="articleError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!articleError">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <button @click="$emit('close')"
          class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Wiki
        </button>
        <div v-if="settings.enableEditing" class="flex items-center gap-2">
          <span v-if="hasAnyEdits() && !editMode" class="text-xs text-accent-brine">{{ editCount() }} edits</span>
          <button v-if="editMode && hasAnyEdits()" @click="resetAllEdits"
            class="text-xs text-accent-ferment hover:text-accent-ferment/80 px-2 py-1 rounded transition-colors">Reset all</button>
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

      <!-- Article Header -->
      <header class="mb-8">
        <!-- Editable title -->
        <div v-if="editMode && editingHeaderField === 'title'">
          <text-editor :model-value="getEditedValue('title', article.title)" @update:model-value="saveEdit('title', $event); editingHeaderField = null" @done="editingHeaderField = null" placeholder="Article title"></text-editor>
        </div>
        <h1 v-else class="font-serif text-3xl sm:text-4xl lg:text-5xl text-text-primary dark:text-dark-text leading-tight mb-3"
          :class="{'cursor-pointer hover:opacity-80': editMode}" @click="editMode && (editingHeaderField = 'title')">
          {{ getEditedValue('title', article.title) }}
          <span v-if="isFieldEdited('title')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
        </h1>
        <!-- Editable subtitle -->
        <div v-if="editMode && editingHeaderField === 'subtitle'">
          <text-editor :model-value="getEditedValue('subtitle', article.subtitle || '')" @update:model-value="saveEdit('subtitle', $event); editingHeaderField = null" @done="editingHeaderField = null" placeholder="Subtitle"></text-editor>
        </div>
        <p v-else-if="article.subtitle || editMode" class="text-lg text-text-secondary dark:text-dark-text-secondary font-serif italic"
          :class="{'cursor-pointer hover:opacity-80': editMode}" @click="editMode && (editingHeaderField = 'subtitle')">
          {{ getEditedValue('subtitle', article.subtitle || 'Add subtitle...') }}
          <span v-if="isFieldEdited('subtitle')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
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
            <template v-for="(section, idx) in getEditedSections()" :key="section.id || idx">

              <!-- Edit mode: block controls -->
              <div v-if="editMode" class="wiki-block-controls flex items-center gap-1 -mb-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button @click="moveSectionUp(idx)" :disabled="idx === 0" class="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30" title="Move up">↑</button>
                <button @click="moveSectionDown(idx)" :disabled="idx >= getEditedSections().length - 1" class="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30" title="Move down">↓</button>
                <span class="text-[10px] text-text-muted px-1 uppercase tracking-wider">{{ section.type }}</span>
                <button @click="removeSection(idx)" class="p-1 rounded text-text-muted hover:text-accent-ferment ml-auto" title="Remove block">×</button>
              </div>

              <!-- Heading -->
              <div v-if="section.type === 'heading'">
                <div v-if="editMode && editingSectionIdx === idx">
                  <div class="flex items-center gap-2 mb-1">
                    <select :value="section.level || 2" @change="saveSectionField(idx, 'level', parseInt($event.target.value))"
                      class="text-xs px-2 py-1 rounded bg-bg-secondary dark:bg-dark-secondary border-0">
                      <option :value="2">H2</option><option :value="3">H3</option>
                    </select>
                  </div>
                  <text-editor :model-value="section.content" @update:model-value="saveSectionContent(idx, $event)" @done="editingSectionIdx = null" placeholder="Section heading"></text-editor>
                </div>
                <component v-else :is="'h' + (section.level || 2)"
                  :id="'section-' + section.id"
                  :class="[
                    'font-serif text-text-primary dark:text-dark-text scroll-mt-20',
                    section.level === 2 ? 'text-2xl sm:text-3xl mt-10 mb-4 pt-6 border-t border-bg-secondary dark:border-dark-secondary' : 'text-xl sm:text-2xl mt-6 mb-3',
                    editMode ? 'cursor-pointer hover:opacity-80' : ''
                  ]"
                  @click="editSection(idx)">
                  {{ section.content }}
                </component>
              </div>

              <!-- Paragraph -->
              <div v-else-if="section.type === 'paragraph'">
                <div v-if="editMode && editingSectionIdx === idx">
                  <text-editor :model-value="section.content" :multiline="true" @update:model-value="saveSectionContent(idx, $event)" @done="editingSectionIdx = null" placeholder="Paragraph text. Use [cite:c1] for citations, [[article:slug]] for cross-links."></text-editor>
                </div>
                <p v-else
                  :id="section.id ? 'section-' + section.id : undefined"
                  :class="['text-text-secondary dark:text-dark-text-secondary leading-relaxed text-[15px]',
                    editMode ? 'cursor-pointer hover:bg-accent-brine/5 rounded-lg -mx-2 px-2 -my-1 py-1 transition-colors' : '']"
                  v-html="renderText(section.content)"
                  @click="editSection(idx)">
                </p>
              </div>

              <!-- Callout -->
              <div v-else-if="section.type === 'callout'">
                <div v-if="editMode && editingSectionIdx === idx" class="space-y-2 p-3 border border-accent-brine/20 rounded-xl">
                  <div class="flex items-center gap-2">
                    <select :value="section.style || 'info'" @change="saveSectionField(idx, 'style', $event.target.value)"
                      class="text-xs px-2 py-1 rounded bg-bg-secondary dark:bg-dark-secondary border-0">
                      <option value="info">Info</option><option value="warning">Warning</option><option value="tip">Tip</option>
                    </select>
                    <input :value="section.title" @change="saveSectionField(idx, 'title', $event.target.value)" placeholder="Callout title"
                      class="flex-1 text-sm px-2 py-1 rounded bg-bg-secondary dark:bg-dark-secondary border-0">
                  </div>
                  <text-editor :model-value="section.content" :multiline="true" @update:model-value="saveSectionContent(idx, $event)" @done="editingSectionIdx = null" placeholder="Callout content..."></text-editor>
                </div>
                <div v-else :class="['rounded-xl border-l-4 p-4 sm:p-5 my-4', calloutClasses(section.style), editMode ? 'cursor-pointer hover:opacity-80' : '']" @click="editSection(idx)">
                  <div class="flex items-start gap-2 mb-2">
                    <span class="text-lg">{{ calloutIcon(section.style) }}</span>
                    <h4 class="font-medium text-sm text-text-primary dark:text-dark-text">{{ section.title }}</h4>
                  </div>
                  <div class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed pl-7"
                    v-html="renderText(section.content)"></div>
                </div>
              </div>

              <!-- Table -->
              <div v-else-if="section.type === 'table'" class="my-6 overflow-x-auto" :class="{'cursor-pointer hover:opacity-90': editMode && editingSectionIdx !== idx}" @click="editMode && editingSectionIdx !== idx && editSection(idx)">
                <p v-if="section.caption" class="text-xs text-text-muted mb-2 italic">{{ section.caption }}</p>
                <table class="w-full text-sm border-collapse">
                  <thead>
                    <tr class="border-b-2 border-accent-brine/30">
                      <th v-for="(h, hi) in section.headers" :key="hi" class="text-left px-3 py-2 font-medium text-text-primary dark:text-dark-text text-xs uppercase tracking-wider">
                        <input v-if="editMode && editingSectionIdx === idx" :value="h" @change="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].headers[hi] = $event.target.value; saveEdit('sections', s); })()" class="w-full bg-transparent border-b border-accent-brine/30 text-xs font-medium uppercase tracking-wider focus:outline-none">
                        <span v-else>{{ h }}</span>
                      </th>
                      <th v-if="editMode && editingSectionIdx === idx" class="w-8">
                        <button @click="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].headers.push('New'); s[idx].rows.forEach(r => r.push('')); saveEdit('sections', s); })()" class="text-accent-brine text-xs">+col</button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in section.rows" :key="ri" class="border-b border-bg-secondary dark:border-dark-secondary hover:bg-bg-secondary/30 dark:hover:bg-dark-secondary/30 transition-colors">
                      <td v-for="(cell, ci) in row" :key="ci" class="px-3 py-2.5 text-text-secondary dark:text-dark-text-secondary text-[13px] leading-relaxed">
                        <input v-if="editMode && editingSectionIdx === idx" :value="cell" @change="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].rows[ri][ci] = $event.target.value; saveEdit('sections', s); })()" class="w-full bg-transparent border-b border-bg-secondary dark:border-dark-secondary text-[13px] focus:outline-none focus:border-accent-brine">
                        <span v-else v-html="renderText(cell)"></span>
                      </td>
                      <td v-if="editMode && editingSectionIdx === idx" class="w-8">
                        <button @click="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].rows.splice(ri, 1); saveEdit('sections', s); })()" class="text-accent-ferment text-xs">×</button>
                      </td>
                    </tr>
                    <tr v-if="editMode && editingSectionIdx === idx">
                      <td :colspan="section.headers.length + 1" class="px-3 py-2">
                        <button @click="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].rows.push(new Array(s[idx].headers.length).fill('')); saveEdit('sections', s); })()" class="text-xs text-accent-brine hover:text-accent-aged">+ Add row</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button v-if="editMode && editingSectionIdx === idx" @click="editingSectionIdx = null" class="mt-2 text-xs text-text-muted hover:text-text-primary">Done editing table</button>
              </div>

              <!-- List -->
              <div v-else-if="section.type === 'list'">
                <div v-if="editMode && editingSectionIdx === idx" class="space-y-2 p-3 border border-accent-brine/20 rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <label class="text-xs text-text-muted">
                      <input type="checkbox" :checked="section.ordered" @change="saveSectionField(idx, 'ordered', $event.target.checked)" class="mr-1"> Numbered
                    </label>
                  </div>
                  <div v-for="(item, li) in section.items" :key="li" class="flex items-center gap-2">
                    <span class="text-xs text-text-muted w-5 text-right">{{ section.ordered ? (li+1)+'.' : '•' }}</span>
                    <input :value="item" @change="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].items[li] = $event.target.value; saveEdit('sections', s); })()" class="flex-1 text-sm px-2 py-1 rounded bg-bg-secondary/50 dark:bg-dark-secondary/50 border-0 focus:outline-none focus:ring-1 focus:ring-accent-brine/50">
                    <button @click="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].items.splice(li, 1); saveEdit('sections', s); })()" class="text-accent-ferment text-xs">×</button>
                  </div>
                  <button @click="(() => { const s = JSON.parse(JSON.stringify(getEditedSections())); s[idx].items.push('New item'); saveEdit('sections', s); })()" class="text-xs text-accent-brine hover:text-accent-aged">+ Add item</button>
                  <button @click="editingSectionIdx = null" class="text-xs text-text-muted ml-2">Done</button>
                </div>
                <component v-else :is="section.ordered ? 'ol' : 'ul'"
                  :class="['my-4 space-y-2 text-[15px] text-text-secondary dark:text-dark-text-secondary',
                    section.ordered ? 'list-decimal pl-6' : 'list-disc pl-6',
                    editMode ? 'cursor-pointer hover:opacity-80' : '']"
                  @click="editSection(idx)">
                  <li v-for="(item, li) in section.items" :key="li" class="leading-relaxed pl-1" v-html="renderText(item)"></li>
                </component>
              </div>

              <!-- Image -->
              <figure v-else-if="section.type === 'image'" class="my-6" :class="{'cursor-pointer hover:opacity-80': editMode}" @click="editSection(idx)">
                <div v-if="editMode && editingSectionIdx === idx" class="space-y-2 p-3 border border-accent-brine/20 rounded-xl">
                  <input :value="section.url" @change="saveSectionField(idx, 'url', $event.target.value)" placeholder="Image URL" class="w-full text-sm px-2 py-1 rounded bg-bg-secondary/50 dark:bg-dark-secondary/50 border-0">
                  <input :value="section.caption" @change="saveSectionField(idx, 'caption', $event.target.value)" placeholder="Caption" class="w-full text-sm px-2 py-1 rounded bg-bg-secondary/50 dark:bg-dark-secondary/50 border-0">
                  <input :value="section.attribution" @change="saveSectionField(idx, 'attribution', $event.target.value)" placeholder="Attribution" class="w-full text-sm px-2 py-1 rounded bg-bg-secondary/50 dark:bg-dark-secondary/50 border-0">
                  <button @click="editingSectionIdx = null" class="text-xs text-text-muted">Done</button>
                </div>
                <template v-else>
                  <img v-if="section.url" :src="section.url" :alt="section.caption || ''"
                    :class="['rounded-xl', section.width === 'full' ? 'w-full' : 'max-w-lg mx-auto']"
                    loading="lazy">
                  <figcaption v-if="section.caption" class="text-xs text-text-muted mt-2 text-center italic">
                    {{ section.caption }}
                    <span v-if="section.attribution" class="block mt-0.5">{{ section.attribution }}</span>
                  </figcaption>
                </template>
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

              <!-- Add block button (edit mode) -->
              <div v-if="editMode" class="relative flex items-center justify-center py-1">
                <button @click="toggleAddBlock(idx)"
                  class="w-7 h-7 rounded-full border-2 border-dashed border-accent-brine/30 hover:border-accent-brine text-accent-brine/50 hover:text-accent-brine flex items-center justify-center text-lg transition-colors">+</button>
                <div v-if="addBlockAfter === idx" class="absolute top-full mt-1 z-20 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl shadow-lg p-2 flex flex-wrap gap-1">
                  <button v-for="btype in ['heading','paragraph','callout','list','table','image']" :key="btype" @click="addSection(idx, btype)"
                    class="px-3 py-1.5 text-xs rounded-lg bg-bg-secondary dark:bg-dark-secondary hover:bg-accent-brine/20 hover:text-accent-brine transition-colors capitalize">{{ btype }}</button>
                </div>
              </div>

            </template>
          </div>

          <!-- Bibliography -->
          <div id="wiki-references" v-if="(article.citations && article.citations.length > 0) || editMode" class="mt-12 pt-8 border-t border-bg-secondary dark:border-dark-secondary">
            <h2 class="font-serif text-2xl text-text-primary dark:text-dark-text mb-4">
              References
              <span v-if="isFieldEdited('citations')" class="inline-block w-2 h-2 bg-accent-brine rounded-full ml-1 align-middle"></span>
            </h2>
            <citation-editor v-if="editMode" :model-value="getEditedValue('citations', article.citations || [])"
              @update:model-value="saveEdit('citations', $event)"></citation-editor>
            <ol v-else class="space-y-3">
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
      </template>
    </div>
  `
};
