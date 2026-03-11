/**
 * FERMENT - TagEditor Component
 * Tag pill bar with typeahead for adding tags
 */

const TagEditorComponent = {
  name: 'tag-editor',

  props: {
    modelValue: { type: Array, default: () => [] },
    suggestions: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Add tag...' },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      tags: [...(this.modelValue || [])],
      inputValue: '',
      showSuggestions: false,
    };
  },

  watch: {
    modelValue(v) { this.tags = [...(v || [])]; }
  },

  computed: {
    filteredSuggestions() {
      if (!this.inputValue.trim()) return [];
      const q = this.inputValue.toLowerCase();
      return this.suggestions
        .filter(s => s.toLowerCase().includes(q) && !this.tags.includes(s))
        .slice(0, 5);
    },
  },

  methods: {
    addTag(tag) {
      const t = (tag || this.inputValue).trim().toLowerCase();
      if (t && !this.tags.includes(t)) {
        this.tags.push(t);
        this.$emit('update:modelValue', [...this.tags]);
      }
      this.inputValue = '';
      this.showSuggestions = false;
    },

    removeTag(index) {
      this.tags.splice(index, 1);
      this.$emit('update:modelValue', [...this.tags]);
    },

    onKeydown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag();
      }
      if (e.key === 'Backspace' && !this.inputValue && this.tags.length) {
        this.removeTag(this.tags.length - 1);
      }
    },
  },

  template: `
    <div class="tag-editor">
      <div class="flex flex-wrap items-center gap-1.5 p-2 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-lg min-h-[38px]">
        <!-- Tags -->
        <span v-for="(tag, index) in tags" :key="tag"
          class="inline-flex items-center gap-1 bg-accent-brine/10 text-accent-aged dark:text-accent-brine px-2 py-0.5 rounded-full text-xs font-medium">
          {{ tag }}
          <button @click="removeTag(index)" class="hover:text-accent-ferment transition-colors ml-0.5">×</button>
        </span>

        <!-- Input -->
        <div class="relative flex-1 min-w-[80px]">
          <input v-model="inputValue" :placeholder="tags.length === 0 ? placeholder : ''"
            @keydown="onKeydown"
            @focus="showSuggestions = true"
            @blur="setTimeout(() => showSuggestions = false, 150)"
            class="w-full bg-transparent text-sm text-text-primary dark:text-dark-text focus:outline-none py-0.5">

          <!-- Suggestions dropdown -->
          <div v-if="showSuggestions && filteredSuggestions.length > 0"
            class="absolute left-0 right-0 top-full mt-1 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-lg shadow-lg z-10 py-1">
            <button v-for="s in filteredSuggestions" :key="s"
              @mousedown.prevent="addTag(s)"
              class="w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-colors">
              {{ s }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
};
