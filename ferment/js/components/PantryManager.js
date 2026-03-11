/**
 * FERMENT - PantryManager Component
 * Full pantry inventory management with recipe matching
 */

const PantryManagerComponent = {
  name: 'pantry-manager',

  props: {
    pantry: {
      type: Array,
      default: () => []
    },
    recipes: {
      type: Array,
      default: () => []
    }
  },

  emits: ['update:pantry', 'browse-matching'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Pantry error in', info, err);
    this.pantryError = (err && err.message) || 'An error occurred in the pantry.';
    return false;
  },

  data() {
    return {
      pantryError: null,
      searchQuery: '',
      showAddForm: false,
      showAddDetails: false,
      showEquipmentSuggestions: false,
      editingItemId: null,
      collapsedCategories: {},
      newItem: this.emptyItem(),
      editItem: null,
      equipmentSuggestions: [
        { name: 'Mason Jar (1L)', unit: 'pcs', description: 'Wide-mouth glass jar for most ferments' },
        { name: 'Airlock Lid', unit: 'pcs', description: 'One-way valve lid for CO\u2082 release' },
        { name: 'Glass Fermentation Weight', unit: 'pcs', description: 'Keeps vegetables submerged below brine' },
        { name: 'Fine Sea Salt', unit: 'g', description: 'Non-iodized, no anti-caking agents' },
        { name: 'Digital Kitchen Scale', unit: 'pcs', description: 'For precise salt-to-vegetable ratios' },
        { name: 'pH Test Strips', unit: 'pcs', description: 'Check acidity for safe fermentation' },
        { name: 'Mandoline Slicer', unit: 'pcs', description: 'Uniform cuts for even fermentation' },
        { name: 'Fermentation Crock (2L)', unit: 'pcs', description: 'Traditional water-sealed ceramic vessel' },
      ],
    };
  },

  computed: {
    categories() {
      return [
        { id: 'produce', label: 'Produce', emoji: '🥬' },
        { id: 'spice', label: 'Spices', emoji: '🌶️' },
        { id: 'salt', label: 'Salt & Minerals', emoji: '🧂' },
        { id: 'liquid', label: 'Liquids', emoji: '💧' },
        { id: 'culture', label: 'Cultures & Starters', emoji: '🦠' },
        { id: 'equipment', label: 'Equipment', emoji: '🫙' },
        { id: 'other', label: 'Other', emoji: '📦' },
      ];
    },

    filteredPantry() {
      if (!this.searchQuery.trim()) return this.pantry;
      const q = this.searchQuery.toLowerCase();
      return this.pantry.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    },

    groupedItems() {
      const groups = {};
      for (const cat of this.categories) {
        const items = this.filteredPantry.filter(item => item.category === cat.id);
        if (items.length > 0) {
          groups[cat.id] = items;
        }
      }
      return groups;
    },

    expiringItems() {
      const now = new Date();
      return this.pantry.filter(item => {
        if (!item.expiryDate) return false;
        const expiry = new Date(item.expiryDate);
        const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
        return diffDays <= 5;
      }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    },

    expiredItems() {
      const now = new Date();
      return this.pantry.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < now;
      });
    },

    matchSummary() {
      if (this.pantry.length === 0) return { exact: 0, close: 0 };
      let exact = 0;
      let close = 0;
      for (const recipe of this.recipes) {
        try {
          const match = FermentMatching.matchRecipe(recipe, this.pantry);
          if (match.canMake) exact++;
          else if (match.missingCount <= 2) close++;
        } catch (e) {
          console.warn('[FERMENT] Match summary error for', recipe.id, e);
        }
      }
      return { exact, close };
    },

    pantryIsEmpty() {
      return this.pantry.length === 0;
    }
  },

  methods: {
    emptyItem() {
      return {
        id: '',
        name: '',
        category: 'produce',
        quantity: '',
        unit: 'g',
        expiryDate: '',
        notes: '',
        imageUrl: '',
        productLink: '',
        description: '',
      };
    },

    quickAddEquipment(suggestion) {
      const item = {
        id: FermentFormat.uid(),
        name: suggestion.name,
        category: 'equipment',
        quantity: 1,
        unit: suggestion.unit || 'pcs',
        expiryDate: '',
        notes: '',
        imageUrl: '',
        productLink: '',
        description: suggestion.description || '',
        addedAt: new Date().toISOString(),
      };
      this.$emit('update:pantry', [...this.pantry, item]);
    },

    categoryInfo(catId) {
      return this.categories.find(c => c.id === catId) || this.categories[this.categories.length - 1];
    },

    isCategoryCollapsed(catId) {
      return !!this.collapsedCategories[catId];
    },

    toggleCategory(catId) {
      this.collapsedCategories[catId] = !this.collapsedCategories[catId];
    },

    expiryStatus(item) {
      if (!item.expiryDate) return 'none';
      const now = new Date();
      const expiry = new Date(item.expiryDate);
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) return 'expired';
      if (diffDays <= 3) return 'soon';
      return 'fine';
    },

    expiryLabel(item) {
      if (!item.expiryDate) return '';
      const status = this.expiryStatus(item);
      const d = FermentFormat.formatDateShort(item.expiryDate);
      if (status === 'expired') return 'Expired ' + d;
      if (status === 'soon') return 'Expires ' + d;
      return d;
    },

    addItem() {
      if (!this.newItem.name.trim()) return;
      const item = {
        ...this.newItem,
        id: FermentFormat.uid(),
        name: this.newItem.name.trim(),
        quantity: parseFloat(this.newItem.quantity) || 0,
        addedAt: new Date().toISOString(),
      };
      const updated = [...this.pantry, item];
      this.$emit('update:pantry', updated);
      this.newItem = this.emptyItem();
      this.showAddForm = false;
    },

    startEdit(item) {
      this.editingItemId = item.id;
      this.editItem = { ...item };
    },

    saveEdit() {
      if (!this.editItem || !this.editItem.name.trim()) return;
      const updated = this.pantry.map(item =>
        item.id === this.editItem.id
          ? { ...this.editItem, name: this.editItem.name.trim(), quantity: parseFloat(this.editItem.quantity) || 0 }
          : item
      );
      this.$emit('update:pantry', updated);
      this.editingItemId = null;
      this.editItem = null;
    },

    cancelEdit() {
      this.editingItemId = null;
      this.editItem = null;
    },

    deleteItem(itemId) {
      const updated = this.pantry.filter(item => item.id !== itemId);
      this.$emit('update:pantry', updated);
      if (this.editingItemId === itemId) {
        this.editingItemId = null;
        this.editItem = null;
      }
    },

    clearExpired() {
      const now = new Date();
      const updated = this.pantry.filter(item => {
        if (!item.expiryDate) return true;
        return new Date(item.expiryDate) >= now;
      });
      this.$emit('update:pantry', updated);
    },

    clearAll() {
      if (!confirm('Remove all pantry items? This cannot be undone.')) return;
      this.$emit('update:pantry', []);
    },

    browseMatching() {
      this.$emit('browse-matching');
    },
  },

  template: `
    <div class="space-y-6">
      <div v-if="pantryError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong in the pantry.</p>
        <p class="text-xs text-text-muted mt-1">{{ pantryError }}</p>
        <button @click="pantryError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!pantryError">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="font-serif text-3xl text-text-primary dark:text-dark-text">My Pantry</h2>
          <p class="text-text-muted dark:text-dark-text-secondary mt-1">
            {{ pantry.length }} item{{ pantry.length === 1 ? '' : 's' }} in your pantry
          </p>
        </div>
        <button
          @click="showAddForm = !showAddForm"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-culture text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <!-- Add Item Form -->
      <transition name="slide">
        <div v-if="showAddForm" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-5 space-y-4">
          <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Add Pantry Item</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Name *</label>
              <input
                v-model="newItem.name"
                type="text"
                placeholder="e.g., Napa Cabbage"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all"
                @keyup.enter="addItem"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Category</label>
              <select
                v-model="newItem.category"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all"
              >
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.emoji }} {{ cat.label }}
                </option>
              </select>
            </div>

            <!-- Quantity + Unit -->
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Quantity</label>
                <input
                  v-model="newItem.quantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all font-mono"
                />
              </div>
              <div class="w-24">
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Unit</label>
                <select
                  v-model="newItem.unit"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-culture focus:outline-none transition-all"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="oz">oz</option>
                  <option value="lb">lb</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="pcs">pcs</option>
                  <option value="bunch">bunch</option>
                  <option value="head">head</option>
                </select>
              </div>
            </div>

            <!-- Expiry Date -->
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Expiry Date (optional)</label>
              <input
                v-model="newItem.expiryDate"
                type="date"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all"
              />
            </div>

            <!-- Notes -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Notes (optional)</label>
              <input
                v-model="newItem.notes"
                type="text"
                placeholder="e.g., from farmer's market"
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all"
              />
            </div>
          </div>

          <!-- More Details (collapsible) -->
          <button @click="showAddDetails = !showAddDetails" type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-culture transition-colors">
            <svg :class="['w-3.5 h-3.5 transition-transform', showAddDetails ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            More details (image, product link, description)
          </button>
          <div v-show="showAddDetails" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Image URL</label>
              <input v-model="newItem.imageUrl" type="url" placeholder="https://..."
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Product Link</label>
              <input v-model="newItem.productLink" type="url" placeholder="https://..."
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all text-sm" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Description</label>
              <textarea v-model="newItem.description" rows="2" placeholder="Short description of the item..."
                class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all text-sm resize-none"></textarea>
            </div>
          </div>

          <!-- Equipment Suggestions -->
          <div v-if="newItem.category === 'equipment'">
            <p class="text-xs font-medium text-text-muted mb-2">Quick add equipment:</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in equipmentSuggestions" :key="s.name" @click="quickAddEquipment(s)" type="button"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-secondary dark:bg-dark-secondary text-text-secondary hover:bg-accent-culture/10 hover:text-accent-culture border border-transparent hover:border-accent-culture/20 transition-all">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ s.name }}
              </button>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button @click="showAddForm = false" class="px-4 py-2 rounded-xl text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">
              Cancel
            </button>
            <button
              @click="addItem"
              :disabled="!newItem.name.trim()"
              :class="[
                'px-5 py-2 rounded-xl font-medium transition-all duration-300',
                newItem.name.trim()
                  ? 'bg-accent-culture text-white shadow-warm hover:shadow-warm-lg'
                  : 'bg-bg-secondary text-text-muted cursor-not-allowed dark:bg-dark-secondary'
              ]"
            >
              Add to Pantry
            </button>
          </div>
        </div>
      </transition>

      <!-- What Can I Make + Expiring Warnings Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="pantry.length > 0">
        <!-- What Can I Make -->
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">🧑‍🍳</span>
            <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">What Can I Make?</h3>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Exact matches</span>
              <span class="font-mono font-medium text-accent-culture text-lg">{{ matchSummary.exact }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Missing 1-2 items</span>
              <span class="font-mono font-medium text-accent-brine text-lg">{{ matchSummary.close }}</span>
            </div>
          </div>
          <button
            v-if="matchSummary.exact > 0 || matchSummary.close > 0"
            @click="browseMatching"
            class="mt-4 w-full px-4 py-2 bg-accent-culture/10 text-accent-culture rounded-xl font-medium hover:bg-accent-culture/20 transition-all duration-300 text-sm"
          >
            Browse Matching Recipes
          </button>
        </div>

        <!-- Expiring Items Warning -->
        <div v-if="expiringItems.length > 0" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-accent-ferment/20 p-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">⚠️</span>
            <h3 class="font-serif text-lg text-accent-ferment">Expiring Soon</h3>
          </div>
          <ul class="space-y-2">
            <li v-for="item in expiringItems.slice(0, 5)" :key="item.id" class="flex items-center justify-between text-sm">
              <span class="text-text-primary dark:text-dark-text">{{ categoryInfo(item.category).emoji }} {{ item.name }}</span>
              <span :class="[
                'font-mono text-xs px-2 py-0.5 rounded-full',
                expiryStatus(item) === 'expired' ? 'bg-accent-ferment/15 text-accent-ferment' : 'bg-accent-brine/15 text-accent-brine'
              ]">
                {{ expiryLabel(item) }}
              </span>
            </li>
          </ul>
          <p v-if="expiringItems.length > 5" class="text-xs text-text-muted mt-2">
            +{{ expiringItems.length - 5 }} more items
          </p>
        </div>
      </div>

      <!-- Search + Bulk Actions -->
      <div class="flex flex-col sm:flex-row gap-3" v-if="pantry.length > 0">
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search pantry..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-card dark:bg-dark-card text-text-primary dark:text-dark-text placeholder-text-muted border border-bg-secondary dark:border-dark-secondary focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all shadow-warm"
          />
        </div>
        <div class="flex gap-2">
          <button
            v-if="expiredItems.length > 0"
            @click="clearExpired"
            class="px-4 py-2.5 rounded-xl text-sm font-medium text-accent-ferment bg-accent-ferment/10 hover:bg-accent-ferment/20 transition-all whitespace-nowrap"
          >
            Clear Expired ({{ expiredItems.length }})
          </button>
          <button
            @click="clearAll"
            class="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all whitespace-nowrap"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="pantryIsEmpty" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary p-12 text-center">
        <div class="text-5xl mb-4">🧺</div>
        <h3 class="font-serif text-2xl text-text-primary dark:text-dark-text mb-2">Your pantry is empty</h3>
        <p class="text-text-muted dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
          Add your ingredients and we'll tell you which fermentation recipes you can make right now.
        </p>
        <button
          @click="showAddForm = true"
          class="inline-flex items-center gap-2 px-6 py-3 bg-accent-culture text-white rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all duration-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Your First Item
        </button>
      </div>

      <!-- Grouped Pantry Items -->
      <div v-else class="space-y-3">
        <div v-for="(items, catId) in groupedItems" :key="catId"
          class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden"
        >
          <!-- Category Header -->
          <button
            @click="toggleCategory(catId)"
            class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bg-secondary/30 dark:hover:bg-dark-secondary/30 transition-all"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-lg">{{ categoryInfo(catId).emoji }}</span>
              <span class="font-serif text-base text-text-primary dark:text-dark-text">{{ categoryInfo(catId).label }}</span>
              <span class="text-xs font-medium text-text-muted bg-bg-secondary dark:bg-dark-secondary rounded-full px-2 py-0.5">
                {{ items.length }}
              </span>
            </div>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', isCategoryCollapsed(catId) ? '' : 'rotate-180']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Items List -->
          <div v-show="!isCategoryCollapsed(catId)" class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary">
            <div v-for="item in items" :key="item.id" class="px-5 py-3">
              <!-- View Mode -->
              <div v-if="editingItemId !== item.id" class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-text-primary dark:text-dark-text font-medium truncate">{{ item.name }}</span>
                      <a v-if="item.productLink" :href="item.productLink" target="_blank" rel="noopener" @click.stop
                        class="text-accent-culture hover:text-accent-brine transition-colors flex-shrink-0" title="Product link">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </a>
                      <span v-if="item.quantity" class="text-sm font-mono text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                        {{ item.quantity }} {{ item.unit }}
                      </span>
                    </div>
                    <p v-if="item.description" class="text-xs text-text-muted dark:text-dark-text-secondary truncate">{{ item.description }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="item.expiryDate" :class="[
                    'text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap',
                    expiryStatus(item) === 'expired' ? 'bg-accent-ferment/15 text-accent-ferment' :
                    expiryStatus(item) === 'soon' ? 'bg-accent-brine/15 text-accent-brine' :
                    'bg-accent-culture/15 text-accent-culture'
                  ]">
                    {{ expiryLabel(item) }}
                  </span>
                  <button @click="startEdit(item)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-brine hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="deleteItem(item.id)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input v-model="editItem.name" type="text"
                    class="sm:col-span-2 px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-accent-culture/30 focus:border-accent-culture focus:ring-1 focus:ring-accent-culture focus:outline-none transition-all text-sm"
                  />
                  <input v-model="editItem.quantity" type="number" step="any" min="0"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm font-mono"
                  />
                  <select v-model="editItem.unit"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm"
                  >
                    <option v-for="u in ['g','kg','oz','lb','ml','L','cup','tbsp','tsp','pcs','bunch','head']" :key="u" :value="u">{{ u }}</option>
                  </select>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input v-model="editItem.expiryDate" type="date"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm"
                  />
                  <select v-model="editItem.category"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm"
                  >
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.emoji }} {{ cat.label }}</option>
                  </select>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input v-model="editItem.imageUrl" type="url" placeholder="Image URL"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm"
                  />
                  <input v-model="editItem.productLink" type="url" placeholder="Product link"
                    class="px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm"
                  />
                </div>
                <textarea v-model="editItem.description" rows="2" placeholder="Description"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-accent-culture/30 focus:border-accent-culture focus:outline-none transition-all text-sm resize-none"
                ></textarea>
                <div class="flex gap-2 justify-end">
                  <button @click="cancelEdit" class="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">Cancel</button>
                  <button @click="saveEdit" class="px-4 py-1.5 rounded-lg text-sm font-medium bg-accent-culture text-white hover:bg-accent-culture/90 transition-all">Save</button>
                </div>
              </div>

              <!-- Notes -->
              <p v-if="item.notes && editingItemId !== item.id" class="text-xs text-text-muted dark:text-dark-text-secondary mt-1 pl-0">{{ item.notes }}</p>
            </div>
          </div>
        </div>
      </div>
      </template>
    </div>
  `
};
