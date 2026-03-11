/**
 * FERMENT - CitationEditor Component
 * Structured citation form with add/remove and preview
 */

const CitationEditorComponent = {
  name: 'citation-editor',

  props: {
    modelValue: { type: Array, default: () => [] },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      citations: JSON.parse(JSON.stringify(this.modelValue || [])),
      editingIndex: null,
    };
  },

  watch: {
    modelValue: {
      handler(v) { this.citations = JSON.parse(JSON.stringify(v || [])); },
      deep: true
    }
  },

  methods: {
    save() {
      this.$emit('update:modelValue', JSON.parse(JSON.stringify(this.citations)));
    },

    addCitation() {
      const id = 'c' + (this.citations.length + 1);
      this.citations.push({
        id,
        text: '',
        source: '',
        url: '',
        author: '',
        year: new Date().getFullYear(),
        license: '',
      });
      this.editingIndex = this.citations.length - 1;
      this.save();
    },

    removeCitation(index) {
      this.citations.splice(index, 1);
      // Re-index IDs
      this.citations.forEach((c, i) => { c.id = 'c' + (i + 1); });
      this.save();
    },
  },

  template: `
    <div class="citation-editor space-y-3">
      <!-- Citation list -->
      <div v-for="(cite, index) in citations" :key="cite.id"
        class="border border-bg-secondary dark:border-dark-secondary rounded-lg overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-3 py-2 bg-bg-secondary/30 dark:bg-dark-secondary/30 cursor-pointer"
          @click="editingIndex = editingIndex === index ? null : index">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-mono text-accent-brine flex-shrink-0">[{{ index + 1 }}]</span>
            <span class="text-sm text-text-secondary dark:text-dark-text-secondary truncate">
              {{ cite.text || cite.source || 'New citation' }}
            </span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button @click.stop="removeCitation(index)" class="text-text-muted hover:text-accent-ferment p-0.5 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <svg :class="['w-4 h-4 text-text-muted transition-transform', editingIndex === index ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>

        <!-- Expandable form -->
        <div v-show="editingIndex === index" class="p-3 space-y-2">
          <div>
            <label class="text-xs text-text-muted mb-0.5 block">Full citation text</label>
            <textarea v-model="cite.text" @blur="save" rows="2" placeholder="Author. Title. Publisher, Year."
              class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none resize-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-text-muted mb-0.5 block">Source</label>
              <input v-model="cite.source" @blur="save" placeholder="Publisher / Journal"
                class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
            </div>
            <div>
              <label class="text-xs text-text-muted mb-0.5 block">Author</label>
              <input v-model="cite.author" @blur="save" placeholder="Author name"
                class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-xs text-text-muted mb-0.5 block">Year</label>
              <input v-model.number="cite.year" @blur="save" type="number" placeholder="2024"
                class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
            </div>
            <div class="col-span-2">
              <label class="text-xs text-text-muted mb-0.5 block">URL</label>
              <input v-model="cite.url" @blur="save" type="url" placeholder="https://..."
                class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
            </div>
          </div>
          <div>
            <label class="text-xs text-text-muted mb-0.5 block">License</label>
            <input v-model="cite.license" @blur="save" placeholder="CC BY-SA, Book, Academic, etc."
              class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
          </div>
          <p class="text-xs text-text-muted">Use <code class="bg-bg-secondary dark:bg-dark-secondary px-1 rounded">[cite:{{ cite.id }}]</code> in text to reference this citation.</p>
        </div>
      </div>

      <!-- Add button -->
      <button @click="addCitation"
        class="flex items-center gap-2 text-sm text-accent-brine hover:text-accent-aged transition-colors px-2 py-1.5 rounded-lg hover:bg-accent-brine/5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add citation
      </button>
    </div>
  `
};
