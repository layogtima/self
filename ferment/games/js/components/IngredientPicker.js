/* THE FERMENT ALCHEMIST — Ingredient Picker */

const IngredientPicker = {
  name: 'IngredientPicker',
  props: ['selected', 'playerLevel', 'order'],
  emits: ['update:selected', 'play-sound'],
  template: `
    <div class="screen-enter">
      <!-- Selected ingredients bar -->
      <div class="mb-4">
        <div class="text-xs uppercase tracking-wider mb-2 font-medium" style="color: var(--ink-muted)">
          Your Workbench ({{ selected.length }} items)
        </div>
        <div class="flex flex-wrap gap-2 min-h-[44px]">
          <button
            v-for="id in selected"
            :key="'sel-'+id"
            class="game-chip game-chip-selected splash-in"
            @click="removeIngredient(id)"
          >
            {{ getIcon(id) }} {{ getName(id) }} ✕
          </button>
          <div v-if="selected.length === 0" class="text-sm py-2" style="color: var(--ink-muted)">
            Tap ingredients below to add them...
          </div>
        </div>
      </div>

      <!-- Category filter -->
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1" style="scrollbar-width: none;">
        <button
          v-for="(cat, catId) in categories"
          :key="catId"
          class="game-chip whitespace-nowrap text-xs"
          :class="{ 'game-chip-selected': activeCategory === catId }"
          @click="activeCategory = activeCategory === catId ? null : catId"
        >
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>

      <!-- Ingredient grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="ing in filteredIngredients"
          :key="ing.id"
          class="game-chip justify-start"
          :class="{
            'game-chip-selected': selected.includes(ing.id),
            'opacity-40 pointer-events-none': ing.unlockLevel > effectiveLevel
          }"
          @click="toggleIngredient(ing)"
        >
          <span class="text-lg">{{ ing.icon }}</span>
          <span class="truncate">{{ ing.name }}</span>
          <span v-if="ing.unlockLevel > effectiveLevel" class="ml-auto text-xs">🔒</span>
        </button>
      </div>

      <!-- Count hint -->
      <div v-if="order" class="mt-3 text-xs text-center" style="color: var(--ink-muted)">
        This order needs {{ order.requiredIngredients.length }} key ingredients
        <span v-if="order.optionalIngredients.length > 0">
          (+ {{ order.optionalIngredients.length }} optional)
        </span>
      </div>
    </div>
  `,

  data() {
    return {
      activeCategory: null,
    };
  },

  computed: {
    categories() {
      return GameIngredients.categories;
    },
    effectiveLevel() {
      return this.playerLevel || 25; // Sandbox mode: all unlocked
    },
    filteredIngredients() {
      let items = GameIngredients.items;
      if (this.activeCategory) {
        items = items.filter(i => i.category === this.activeCategory);
      }
      return items.sort((a, b) => a.unlockLevel - b.unlockLevel);
    },
  },

  methods: {
    toggleIngredient(ing) {
      if (ing.unlockLevel > this.effectiveLevel) return;

      const list = [...this.selected];
      const idx = list.indexOf(ing.id);
      if (idx >= 0) {
        list.splice(idx, 1);
        this.$emit('play-sound', 'ingredient-remove');
      } else {
        list.push(ing.id);
        this.$emit('play-sound', 'ingredient-add');
      }
      this.$emit('update:selected', list);
    },

    removeIngredient(id) {
      const list = this.selected.filter(i => i !== id);
      this.$emit('play-sound', 'ingredient-remove');
      this.$emit('update:selected', list);
    },

    getIcon(id) {
      const ing = GameIngredients.getById(id);
      return ing ? ing.icon : '❓';
    },

    getName(id) {
      const ing = GameIngredients.getById(id);
      return ing ? ing.name : id;
    },
  }
};

window.IngredientPicker = IngredientPicker;
