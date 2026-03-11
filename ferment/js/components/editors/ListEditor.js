/**
 * FERMENT - ListEditor Component
 * Reorderable list editor for ingredients, steps, equipment
 * Supports drag-to-reorder, add, remove, and inline field editing
 */

const ListEditorComponent = {
  name: 'list-editor',

  props: {
    modelValue: { type: Array, default: () => [] },
    itemType: { type: String, default: 'generic' }, // 'ingredient', 'step', 'equipment', 'generic'
    placeholder: { type: String, default: 'Add item...' },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      items: JSON.parse(JSON.stringify(this.modelValue || [])),
      editingIndex: null,
      dragIndex: null,
      newItem: '',
    };
  },

  watch: {
    modelValue: {
      handler(v) { this.items = JSON.parse(JSON.stringify(v || [])); },
      deep: true
    }
  },

  methods: {
    save() {
      this.$emit('update:modelValue', JSON.parse(JSON.stringify(this.items)));
    },

    addItem() {
      if (this.itemType === 'ingredient') {
        this.items.push({ name: 'New ingredient', amount: '', unit: '', essential: true });
      } else if (this.itemType === 'step') {
        this.items.push({
          step: this.items.length + 1,
          title: 'New step',
          instruction: '',
          tips: [],
          checkpoint: ''
        });
      } else if (this.itemType === 'equipment') {
        this.items.push({ name: 'New item', essential: false, notes: '' });
      } else {
        this.items.push({ text: '' });
      }
      this.editingIndex = this.items.length - 1;
      this.save();
    },

    removeItem(index) {
      this.items.splice(index, 1);
      if (this.itemType === 'step') {
        this.items.forEach((item, i) => { item.step = i + 1; });
      }
      this.save();
    },

    updateItem(index, field, value) {
      if (typeof this.items[index] === 'object') {
        this.items[index][field] = value;
      } else {
        this.items[index] = value;
      }
      this.save();
    },

    moveItem(from, to) {
      if (to < 0 || to >= this.items.length) return;
      const item = this.items.splice(from, 1)[0];
      this.items.splice(to, 0, item);
      if (this.itemType === 'step') {
        this.items.forEach((item, i) => { item.step = i + 1; });
      }
      this.save();
    },

    onDragStart(index) {
      this.dragIndex = index;
    },

    onDragOver(e, index) {
      e.preventDefault();
      if (this.dragIndex !== null && this.dragIndex !== index) {
        this.moveItem(this.dragIndex, index);
        this.dragIndex = index;
      }
    },

    onDragEnd() {
      this.dragIndex = null;
    },

    displayName(item) {
      if (typeof item === 'string') return item;
      if (this.itemType === 'ingredient') {
        return `${item.amount || ''} ${item.unit || ''} ${item.name || ''}`.trim();
      }
      if (this.itemType === 'step') return item.title || item.instruction || `Step ${item.step}`;
      if (this.itemType === 'equipment') return item.name || '';
      return item.text || item.name || JSON.stringify(item);
    },
  },

  template: `
    <div class="list-editor space-y-1">
      <!-- Items -->
      <div v-for="(item, index) in items" :key="index"
        :draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragend="onDragEnd"
        :class="['flex items-start gap-2 group rounded-lg p-2 -mx-2 transition-colors',
          dragIndex === index ? 'bg-accent-brine/10' : 'hover:bg-bg-secondary/50 dark:hover:bg-dark-secondary/50']">

        <!-- Drag handle -->
        <div class="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>

        <!-- Ingredient fields -->
        <template v-if="itemType === 'ingredient'">
          <div class="flex-1 min-w-0" v-if="editingIndex === index">
            <div class="grid grid-cols-4 gap-2">
              <input v-model="item.name" placeholder="Name" @blur="save"
                class="col-span-2 px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
              <input v-model="item.amount" placeholder="Amount" @blur="save" type="text"
                class="px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
              <input v-model="item.unit" placeholder="Unit" @blur="save"
                class="px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
            </div>
          </div>
          <div v-else class="flex-1 min-w-0 cursor-pointer" @click="editingIndex = index">
            <span class="text-sm text-text-primary dark:text-dark-text">{{ displayName(item) }}</span>
            <span v-if="item.essential" class="ml-1 text-xs text-accent-culture">*</span>
          </div>
        </template>

        <!-- Step fields -->
        <template v-else-if="itemType === 'step'">
          <span class="text-xs font-mono text-text-muted mt-1.5 flex-shrink-0 w-6 text-right">{{ item.step }}.</span>
          <div class="flex-1 min-w-0" v-if="editingIndex === index">
            <input v-model="item.title" placeholder="Step title" @blur="save"
              class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm font-medium focus:border-accent-brine focus:outline-none mb-1.5">
            <textarea v-model="item.instruction" placeholder="Instructions..." @blur="save" rows="2"
              class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none resize-none"></textarea>
          </div>
          <div v-else class="flex-1 min-w-0 cursor-pointer" @click="editingIndex = index">
            <span class="text-sm font-medium text-text-primary dark:text-dark-text">{{ item.title || 'Untitled step' }}</span>
            <p class="text-xs text-text-muted mt-0.5 line-clamp-1">{{ item.instruction }}</p>
          </div>
        </template>

        <!-- Equipment fields -->
        <template v-else-if="itemType === 'equipment'">
          <div class="flex-1 min-w-0" v-if="editingIndex === index">
            <div class="flex items-center gap-2">
              <input v-model="item.name" placeholder="Equipment name" @blur="save"
                class="flex-1 px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
              <label class="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
                <input type="checkbox" v-model="item.essential" @change="save" class="rounded border-bg-secondary">
                Essential
              </label>
            </div>
          </div>
          <div v-else class="flex-1 min-w-0 cursor-pointer" @click="editingIndex = index">
            <span class="text-sm text-text-primary dark:text-dark-text">{{ item.name }}</span>
            <span v-if="item.essential" class="ml-1 text-xs text-accent-culture">essential</span>
          </div>
        </template>

        <!-- Generic text item -->
        <template v-else>
          <div class="flex-1 min-w-0" v-if="editingIndex === index">
            <input v-model="item.text" placeholder="Item text" @blur="save" @keydown.enter="editingIndex = null"
              class="w-full px-2 py-1.5 bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded text-sm focus:border-accent-brine focus:outline-none">
          </div>
          <div v-else class="flex-1 min-w-0 cursor-pointer" @click="editingIndex = index">
            <span class="text-sm text-text-secondary dark:text-dark-text-secondary">{{ displayName(item) }}</span>
          </div>
        </template>

        <!-- Remove button -->
        <button @click="removeItem(index)"
          class="text-text-muted hover:text-accent-ferment transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Add button -->
      <button @click="addItem"
        class="flex items-center gap-2 text-sm text-accent-brine hover:text-accent-aged transition-colors mt-2 px-2 py-1.5 rounded-lg hover:bg-accent-brine/5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add {{ itemType === 'ingredient' ? 'ingredient' : itemType === 'step' ? 'step' : itemType === 'equipment' ? 'equipment' : 'item' }}
      </button>
    </div>
  `
};
