/**
 * FERMENT - TextEditor Component
 * Inline text editing: short text (input) and long text (auto-growing textarea)
 */

const TextEditorComponent = {
  name: 'text-editor',

  props: {
    modelValue: { type: String, default: '' },
    multiline: { type: Boolean, default: false },
    placeholder: { type: String, default: 'Enter text...' },
    maxLength: { type: Number, default: 0 },
  },

  emits: ['update:modelValue', 'done'],

  data() {
    return {
      localValue: this.modelValue || '',
    };
  },

  watch: {
    modelValue(v) { this.localValue = v || ''; },
  },

  mounted() {
    this.$nextTick(() => {
      const el = this.$refs.input;
      if (el) {
        el.focus();
        if (this.multiline) this.autoGrow();
      }
    });
  },

  methods: {
    save() {
      this.$emit('update:modelValue', this.localValue);
      this.$emit('done');
    },

    cancel() {
      this.localValue = this.modelValue || '';
      this.$emit('done');
    },

    onKeydown(e) {
      if (!this.multiline && e.key === 'Enter') {
        e.preventDefault();
        this.save();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancel();
      }
    },

    autoGrow() {
      const el = this.$refs.input;
      if (el) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    },
  },

  template: `
    <div class="text-editor">
      <!-- Single-line input -->
      <input v-if="!multiline" ref="input"
        v-model="localValue"
        :placeholder="placeholder"
        :maxlength="maxLength || undefined"
        @keydown="onKeydown"
        @blur="save"
        class="w-full px-3 py-2 bg-bg-card dark:bg-dark-card border border-accent-brine/30 rounded-lg text-sm text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-brine/30 focus:border-accent-brine transition-all"
      />

      <!-- Multi-line textarea -->
      <textarea v-else ref="input"
        v-model="localValue"
        :placeholder="placeholder"
        :maxlength="maxLength || undefined"
        @keydown="onKeydown"
        @input="autoGrow"
        @blur="save"
        rows="3"
        class="w-full px-3 py-2 bg-bg-card dark:bg-dark-card border border-accent-brine/30 rounded-lg text-sm text-text-primary dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-brine/30 focus:border-accent-brine transition-all resize-none leading-relaxed"
      ></textarea>

      <!-- Character count -->
      <div v-if="maxLength" class="text-right mt-1">
        <span :class="['text-xs', localValue.length > maxLength * 0.9 ? 'text-accent-ferment' : 'text-text-muted']">
          {{ localValue.length }}/{{ maxLength }}
        </span>
      </div>

      <!-- Action buttons for textarea -->
      <div v-if="multiline" class="flex items-center justify-end gap-2 mt-2">
        <button @click="cancel" class="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1">Cancel</button>
        <button @click="save" class="text-xs bg-accent-brine/10 text-accent-aged dark:text-accent-brine hover:bg-accent-brine/20 transition-colors px-3 py-1 rounded-lg font-medium">Save</button>
      </div>
    </div>
  `
};
