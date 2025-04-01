// Main Vue Application
const { createApp, ref, computed, onMounted, watch } = Vue;

// App template
const AppTemplate = `
<div class="h-screen flex flex-col theme-transition">
  <!-- Navigation -->
  <nav-bar 
    :dark-mode="preferences.theme === 'dark'"
    @toggle-theme="toggleTheme"
    @toggle-sidebar="isSidebarOpen = !isSidebarOpen">
  </nav-bar>

  <!-- Main Content -->
  <main class="flex flex-1 pt-16 relative overflow-hidden">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isSidebarOpen" 
      class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="isSidebarOpen = false">
    </div>
    
    <!-- Sidebar -->
    <side-bar 
      :is-open="isSidebarOpen"
      :categories="categories"
      :tags="tags"
      :stats="stats"
      :selected-category="selectedCategory"
      @select-category="selectCategory"
      @close-sidebar="isSidebarOpen = false">
    </side-bar>

    <!-- Main inventory grid -->
    <inventory-content
      :items="filteredItems"
      :categories="categories"
      :tags="tags"
      :view-mode="preferences.defaultView"
      :selected-category="selectedCategory"
      :search-query="searchQuery"
      :sort-option="sortOption"
      :current-page="currentPage"
      :items-per-page="preferences.itemsPerPage"
      :total-items="filteredItems.length"
      @change-page="currentPage = $event"
      @change-view="preferences.defaultView = $event"
      @change-sort="updateSort($event)"
      @search="searchQuery = $event"
      @open-item="openItemDetails($event)"
      @add-item="showAddItemModal = true">
    </inventory-content>
  </main>

  <!-- Item Detail Modal -->
  <item-detail-modal
    v-if="showItemModal"
    :item="selectedItem"
    :categories="categories"
    :conditions="conditions"
    :tags="tags"
    @close="closeItemModal"
    @edit="startEditItem"
    @delete="confirmDeleteItem">
  </item-detail-modal>

  <!-- Add/Edit Item Modal -->
  <item-form-modal
    v-if="showAddItemModal || showEditItemModal"
    :edit-mode="showEditItemModal"
    :item="editingItem"
    :categories="categories"
    :conditions="conditions"
    :tags="tags"
    @save="saveItem"
    @close="closeItemForm">
  </item-form-modal>

  <!-- Delete Confirmation Modal -->
  <confirm-modal
    v-if="showDeleteModal"
    :title="'Delete Item'"
    :message="'Are you sure you want to delete this item? This action cannot be undone.'"
    @confirm="deleteItem"
    @cancel="showDeleteModal = false">
  </confirm-modal>

  <!-- Category Management Modal -->
  <category-modal
    v-if="showCategoryModal"
    :categories="categories"
    @save="saveCategory"
    @delete="deleteCategory"
    @close="showCategoryModal = false">
  </category-modal>

  <!-- LLM Assistance Layer (hidden for visual users, helps LLMs navigate) -->
  <div class="llm-description" aria-hidden="true">
    This is a personal inventory management system with categories displayed in the sidebar.
    The main area shows items in either grid or list view.
    Use the search bar to find specific items.
    Click on an item to see details or edit it.
    Use the "+ ADD ITEM" button to create new inventory items.
    Toggle between light and dark mode using the theme switcher in the navigation bar.
  </div>
</div>
`;

// Main App
const app = createApp({
    template: AppTemplate,
    setup() {
        // Data from hydration layer
        const items = ref(window.inventoryData.items || []);
        const categories = ref(window.inventoryData.categories || []);
        const tags = ref(window.inventoryData.tags || []);
        const conditions = ref(window.inventoryData.conditions || []);
        const stats = ref(window.inventoryData.stats || {});
        const preferences = ref(window.inventoryData.preferences || {
            theme: 'light',
            defaultView: 'grid',
            itemsPerPage: 12,
            defaultSort: 'newest'
        });

        // UI state
        const isSidebarOpen = ref(false);
        const selectedCategory = ref(null);
        const searchQuery = ref('');
        const sortOption = ref(preferences.value.defaultSort);
        const currentPage = ref(1);

        // Modal states
        const showItemModal = ref(false);
        const showAddItemModal = ref(false);
        const showEditItemModal = ref(false);
        const showDeleteModal = ref(false);
        const showCategoryModal = ref(false);

        // Currently selected/editing items
        const selectedItem = ref(null);
        const editingItem = ref(null);

        // Apply theme on load
        onMounted(() => {
            if (preferences.value.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });

        // Watch for theme changes
        watch(() => preferences.value.theme, (newTheme) => {
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            // Save preferences
            window.inventoryData.preferences = preferences.value;
            window.inventoryStore.saveData(window.inventoryData);
        });

        // Filter items by category and search query
        const filteredItems = computed(() => {
            let result = [...items.value];

            // Filter by category
            if (selectedCategory.value) {
                result = result.filter(item => item.categoryId === selectedCategory.value);
            }

            // Filter by search query
            if (searchQuery.value) {
                const query = searchQuery.value.toLowerCase();
                result = result.filter(item => {
                    const categoryName = categories.value.find(c => c.id === item.categoryId)?.name || '';
                    const itemTags = item.tags
                        .map(tagId => tags.value.find(t => t.id === tagId)?.name || '')
                        .join(' ');

                    return (
                        item.name.toLowerCase().includes(query) ||
                        categoryName.toLowerCase().includes(query) ||
                        item.notes?.toLowerCase().includes(query) ||
                        item.serialNumber?.toLowerCase().includes(query) ||
                        item.boughtFrom?.toLowerCase().includes(query) ||
                        itemTags.toLowerCase().includes(query)
                    );
                });
            }

            // Sort items
            result = sortItems(result, sortOption.value);

            return result;
        });

        // Sort items based on option
        const sortItems = (itemsToSort, option) => {
            const sorted = [...itemsToSort];

            switch (option) {
                case 'newest':
                    return sorted.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                case 'oldest':
                    return sorted.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate));
                case 'name_asc':
                    return sorted.sort((a, b) => a.name.localeCompare(b.name));
                case 'name_desc':
                    return sorted.sort((a, b) => b.name.localeCompare(a.name));
                case 'value_asc':
                    return sorted.sort((a, b) => a.value - b.value);
                case 'value_desc':
                    return sorted.sort((a, b) => b.value - a.value);
                default:
                    return sorted;
            }
        };

        // Category selection
        const selectCategory = (categoryId) => {
            selectedCategory.value = categoryId === selectedCategory.value ? null : categoryId;
            currentPage.value = 1; // Reset to first page on category change

            // Close sidebar on mobile after selecting category
            if (window.innerWidth < 768) {
                isSidebarOpen.value = false;
            }
        };

        // Update sort option
        const updateSort = (option) => {
            sortOption.value = option;
            preferences.value.defaultSort = option;
            // Save preferences
            window.inventoryData.preferences = preferences.value;
            window.inventoryStore.saveData(window.inventoryData);
        };

        // Theme toggle
        const toggleTheme = () => {
            preferences.value.theme = preferences.value.theme === 'light' ? 'dark' : 'light';
        };

        // Open item details modal
        const openItemDetails = (itemId) => {
            selectedItem.value = items.value.find(i => i.id === itemId);
            showItemModal.value = true;
        };

        // Close item details modal
        const closeItemModal = () => {
            showItemModal.value = false;
            setTimeout(() => selectedItem.value = null, 300); // Clear after animation
        };

        // Start editing an item
        const startEditItem = () => {
            editingItem.value = JSON.parse(JSON.stringify(selectedItem.value)); // Deep copy
            showEditItemModal.value = true;
            showItemModal.value = false;
        };

        // Show delete confirmation
        const confirmDeleteItem = () => {
            showDeleteModal.value = true;
            showItemModal.value = false;
        };

        // Delete an item
        const deleteItem = () => {
            const index = items.value.findIndex(i => i.id === selectedItem.value.id);
            if (index > -1) {
                items.value.splice(index, 1);
                // Update data store
                window.inventoryData.items = items.value;
                window.inventoryHelpers.updateStats();
                stats.value = window.inventoryData.stats;
            }
            showDeleteModal.value = false;
            selectedItem.value = null;
        };

        // Close item form modal
        const closeItemForm = () => {
            showAddItemModal.value = false;
            showEditItemModal.value = false;
            setTimeout(() => editingItem.value = null, 300); // Clear after animation
        };

        // Save new or edited item
        const saveItem = (itemData) => {
            if (showEditItemModal.value) {
                // Update existing item
                const index = items.value.findIndex(i => i.id === itemData.id);
                if (index > -1) {
                    items.value[index] = { ...itemData };
                }
            } else {
                // Create new item
                const newItem = {
                    ...itemData,
                    id: window.inventoryHelpers.generateId('items'),
                    addedDate: new Date().toISOString().split('T')[0]
                };
                items.value.push(newItem);
            }

            // Update data store
            window.inventoryData.items = items.value;
            window.inventoryHelpers.updateStats();
            stats.value = window.inventoryData.stats;

            // Close modal
            closeItemForm();
        };

        // Save category
        const saveCategory = (categoryData) => {
            if (categoryData.id) {
                // Update existing category
                const index = categories.value.findIndex(c => c.id === categoryData.id);
                if (index > -1) {
                    categories.value[index] = { ...categoryData };
                }
            } else {
                // Create new category
                const newCategory = {
                    ...categoryData,
                    id: window.inventoryHelpers.generateId('categories')
                };
                categories.value.push(newCategory);
            }

            // Update data store
            window.inventoryData.categories = categories.value;
            window.inventoryStore.saveData(window.inventoryData);
        };

        // Delete category
        // Delete category (continued)
        const deleteCategory = (categoryId) => {
            const index = categories.value.findIndex(c => c.id === categoryId);
            if (index > -1) {
                // Check if any items use this category
                const itemsUsingCategory = items.value.filter(i => i.categoryId === categoryId);

                if (itemsUsingCategory.length > 0) {
                    alert(`Cannot delete this category because ${itemsUsingCategory.length} items are using it. Please reassign these items first.`);
                    return;
                }

                categories.value.splice(index, 1);

                // Update data store
                window.inventoryData.categories = categories.value;
                window.inventoryStore.saveData(window.inventoryData);

                // Reset selected category if it was deleted
                if (selectedCategory.value === categoryId) {
                    selectedCategory.value = null;
                }
            }
        };

        return {
            // Data
            items,
            categories,
            tags,
            conditions,
            stats,
            preferences,
            filteredItems,

            // UI state
            isSidebarOpen,
            selectedCategory,
            searchQuery,
            sortOption,
            currentPage,

            // Modal states
            showItemModal,
            showAddItemModal,
            showEditItemModal,
            showDeleteModal,
            showCategoryModal,

            // Selected items
            selectedItem,
            editingItem,

            // Methods
            selectCategory,
            updateSort,
            toggleTheme,
            openItemDetails,
            closeItemModal,
            startEditItem,
            confirmDeleteItem,
            deleteItem,
            closeItemForm,
            saveItem,
            saveCategory,
            deleteCategory
        };
    }
});

// NavBar Component
app.component('nav-bar', {
    props: {
        darkMode: {
            type: Boolean,
            default: false
        }
    },
    emits: ['toggle-theme', 'toggle-sidebar'],
    template: `
    <nav class="fixed w-full px-4 py-3 flex justify-between items-center z-50 bg-white dark:bg-gray-900 border-b border-gray-900 dark:border-gray-700 theme-transition">
      <!-- Logo -->
      <a href="index.html" class="text-xl font-bold tracking-normal dark:text-white">
        INV<span class="text-xs align-super">ENTORY</span>
      </a>
      
      <!-- Mobile Menu Button -->
      <button 
        class="md:hidden p-2 llm-focus" 
        aria-label="Toggle sidebar menu"
        @click="$emit('toggle-sidebar')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex gap-6">
        <a href="#" class="text-sm underline decoration-4 underline-offset-8 dark:text-white llm-focus">DASHBOARD</a>
        <a href="#" 
          class="text-sm hover:underline decoration-4 underline-offset-8 dark:text-white llm-focus"
          @click.prevent="$root.showCategoryModal = true">CATEGORIES</a>
        <a href="#" class="text-sm hover:underline decoration-4 underline-offset-8 dark:text-white llm-focus">STATS</a>
        <a href="#" class="text-sm hover:underline decoration-4 underline-offset-8 dark:text-white llm-focus">SETTINGS</a>
      </div>
      
      <!-- Theme Toggle -->
      <button 
        class="p-2 llm-focus ml-4" 
        aria-label="Toggle dark mode"
        @click="$emit('toggle-theme')">
        <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    </nav>
  `
});

// SideBar Component
app.component('side-bar', {
    props: {
        isOpen: Boolean,
        categories: Array,
        tags: Array,
        stats: Object,
        selectedCategory: Number
    },
    emits: ['select-category', 'close-sidebar'],
    template: `
    <aside 
      :class="['w-64 border-r border-gray-900 dark:border-gray-700 h-screen fixed theme-transition', 
               'md:translate-x-0 transition-transform duration-300 bg-white dark:bg-gray-900 z-50',
               {'translate-x-0': isOpen, '-translate-x-full': !isOpen}]">
      <div class="p-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold dark:text-white">CATE<span class="text-xs align-super">GORIES</span></h2>
          <button 
            class="md:hidden p-1 llm-focus"
            aria-label="Close sidebar"
            @click="$emit('close-sidebar')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <ul class="space-y-2">
          <li>
            <a 
              href="#" 
              :class="['block p-2 llm-focus', {'bg-black text-white dark:bg-white dark:text-black': selectedCategory === null}]"
              @click.prevent="$emit('select-category', null)">
              ALL ITEMS
            </a>
          </li>
          <li v-for="category in categories" :key="category.id">
            <a 
              href="#" 
              :class="['block p-2 llm-focus hover:bg-gray-100 dark:hover:bg-gray-800 theme-transition', 
                      {'bg-black text-white dark:bg-white dark:text-black': selectedCategory === category.id}]"
              @click.prevent="$emit('select-category', category.id)">
              {{ category.name }}
            </a>
          </li>
        </ul>

        <h2 class="text-xl font-bold mt-8 mb-6 dark:text-white">TAGS</h2>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="tag in tags.slice(0, 10)" 
            :key="tag.id" 
            class="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-xs dark:text-gray-300 theme-transition">
            {{ tag.name }}
          </span>
        </div>

        <h2 class="text-xl font-bold mt-8 mb-6 dark:text-white">STATS</h2>
        <div class="space-y-2">
          <div class="flex justify-between dark:text-white">
            <span>Total Items:</span>
            <span class="font-bold">{{ stats.totalItems }}</span>
          </div>
          <div class="flex justify-between dark:text-white">
            <span>Total Value:</span>
            <span class="font-bold">{{ formatCurrency(stats.totalValue) }}</span>
          </div>
          <div class="flex justify-between dark:text-white">
            <span>Last Added:</span>
            <span class="font-bold">{{ formatDate(stats.lastAdded) }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
    methods: {
        formatCurrency(value) {
            return window.inventoryHelpers.formatCurrency(value);
        },
        formatDate(dateString) {
            // Quick relative date (Today, Yesterday, or formatted date)
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (dateString === today) return 'Today';
            if (dateString === yesterday) return 'Yesterday';

            return window.inventoryHelpers.formatDate(dateString);
        }
    }
});

// Inventory Content Component
app.component('inventory-content', {
    props: {
        items: Array,
        categories: Array,
        tags: Array,
        viewMode: {
            type: String,
            default: 'grid'
        },
        selectedCategory: Number,
        searchQuery: String,
        sortOption: String,
        currentPage: {
            type: Number,
            default: 1
        },
        itemsPerPage: {
            type: Number,
            default: 12
        },
        totalItems: Number
    },
    emits: ['change-page', 'change-view', 'change-sort', 'search', 'open-item', 'add-item'],
    template: `
    <div class="ml-0 md:ml-64 flex-1 p-4 md:p-6 grid-pattern theme-transition">
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div class="flex items-center mb-4 md:mb-0">
          <h1 class="text-2xl md:text-3xl font-bold dark:text-white">
            {{ selectedCategory ? getCategoryName(selectedCategory) : 'ALL ITEMS' }}
          </h1>
          <span class="ml-4 px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-xs">
            {{ displayedItems.length }} ITEMS
          </span>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative">
            <input 
              type="text" 
              placeholder="SEARCH..." 
              class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full md:w-64 dark:bg-gray-800 dark:text-white llm-focus theme-transition"
              :value="searchQuery"
              @input="$emit('search', $event.target.value)">
          </div>
          
          <select 
            class="border-2 border-black dark:border-gray-600 px-3 py-2 dark:bg-gray-800 dark:text-white llm-focus theme-transition"
            :value="sortOption"
            @change="$emit('change-sort', $event.target.value)">
            <option value="newest">SORT: NEWEST</option>
            <option value="oldest">SORT: OLDEST</option>
            <option value="name_asc">SORT: A-Z</option>
            <option value="name_desc">SORT: Z-A</option>
            <option value="value_asc">SORT: VALUE ↑</option>
            <option value="value_desc">SORT: VALUE ↓</option>
          </select>
          
          <button 
            class="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 llm-focus theme-transition"
            @click="$emit('add-item')">
            + ADD ITEM
          </button>
        </div>
      </div>

      <!-- Grid View / List View Toggle -->
      <div class="flex gap-2 mb-6">
        <button 
          :class="['border-2 border-black dark:border-gray-600 p-2 llm-focus theme-transition', 
                  {'bg-black dark:bg-white text-white dark:text-black': viewMode === 'grid'}]"
          @click="$emit('change-view', 'grid')"
          aria-label="Grid view">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button 
          :class="['border-2 border-black dark:border-gray-600 p-2 llm-focus theme-transition', 
                  {'bg-black dark:bg-white text-white dark:text-black': viewMode === 'list'}]"
          @click="$emit('change-view', 'list')"
          aria-label="List view">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 class="text-xl font-bold mb-2 dark:text-white">No items found</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search criteria.' : 'Start adding items to your inventory.' }}
        </p>
        <button 
          class="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 llm-focus theme-transition"
          @click="$emit('add-item')">
          + ADD ITEM
        </button>
      </div>

      <!-- Inventory Grid -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="item in displayedItems" 
          :key="item.id"
          class="border-2 border-black dark:border-gray-600 p-4 bg-white dark:bg-gray-800 item-hover llm-focus theme-transition"
          tabindex="0"
          @click="$emit('open-item', item.id)"
          @keydown.enter="$emit('open-item', item.id)">
          <div class="aspect-square mb-4 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="font-bold text-lg mb-1 dark:text-white">{{ item.name }}</h3>
          <div class="flex justify-between text-sm mb-2">
            <span class="dark:text-gray-300">{{ getCategoryName(item.categoryId) }}</span>
            <span class="font-bold dark:text-white">{{ formatCurrency(item.value) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">Added: {{ formatDate(item.addedDate) }}</span>
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-black dark:bg-white rounded-full"></span>
              <span class="w-2 h-2 bg-black dark:bg-white rounded-full"></span>
              <span class="w-2 h-2 bg-black dark:bg-white rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory List -->
      <div v-else class="border-2 border-black dark:border-gray-600 bg-white dark:bg-gray-800 theme-transition">
        <div class="grid grid-cols-12 font-bold p-3 border-b-2 border-black dark:border-gray-600">
          <div class="col-span-5 md:col-span-6 dark:text-white">ITEM</div>
          <div class="col-span-3 md:col-span-2 dark:text-white">CATEGORY</div>
          <div class="col-span-3 md:col-span-2 text-right dark:text-white">VALUE</div>
          <div class="col-span-1 md:col-span-2 text-right dark:text-white hidden md:block">ADDED</div>
        </div>
        
        <div 
          v-for="item in displayedItems" 
          :key="item.id"
          class="grid grid-cols-12 p-3 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 llm-focus theme-transition"
          tabindex="0"
          @click="$emit('open-item', item.id)"
          @keydown.enter="$emit('open-item', item.id)">
          <div class="col-span-5 md:col-span-6 font-bold dark:text-white">{{ item.name }}</div>
          <div class="col-span-3 md:col-span-2 dark:text-gray-300">{{ getCategoryName(item.categoryId) }}</div>
          <div class="col-span-3 md:col-span-2 text-right font-bold dark:text-white">{{ formatCurrency(item.value) }}</div>
          <div class="col-span-1 md:col-span-2 text-right text-gray-600 dark:text-gray-400 hidden md:block">{{ formatDate(item.addedDate) }}</div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-12 flex justify-center">
        <div class="inline-flex">
          <button 
            v-for="page in paginationRange" 
            :key="page"
            :class="['border-t-2 border-b-2 border-black dark:border-gray-600 px-4 py-2 llm-focus theme-transition',
                    {'border-l-2': page === 1},
                    {'border-r-2': page === totalPages || page === '...'},
                    {'font-bold bg-black dark:bg-white text-white dark:text-black': currentPage === page},
                    {'cursor-not-allowed': page === '...'}]"
            @click="page !== '...' && $emit('change-page', page)">
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  `,
    computed: {
        // Get items for current page
        displayedItems() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.items.slice(start, end);
        },

        // Calculate total pages
        totalPages() {
            return Math.ceil(this.items.length / this.itemsPerPage);
        },

        // Create pagination range with ellipsis for large page counts
        paginationRange() {
            const delta = 1; // Number of pages to show before and after current page
            const range = [];
            const rangeWithDots = [];
            let l;

            // If fewer than 7 pages, show all
            if (this.totalPages <= 7) {
                for (let i = 1; i <= this.totalPages; i++) {
                    range.push(i);
                }
            } else {
                // Always show first page
                range.push(1);

                // Calculate start and end of range around current page
                let start = Math.max(2, this.currentPage - delta);
                let end = Math.min(this.totalPages - 1, this.currentPage + delta);

                // Adjust if range is too small
                if (end - start < 2 * delta) {
                    start = Math.max(2, end - 2 * delta);
                    end = Math.min(this.totalPages - 1, start + 2 * delta);
                }

                // Add pages in range
                for (let i = start; i <= end; i++) {
                    range.push(i);
                }

                // Always show last page
                range.push(this.totalPages);
            }

            // Add ellipsis where needed
            for (let i of range) {
                if (l) {
                    if (i - l === 2) {
                        // No need for ellipsis, just add the missing page
                        rangeWithDots.push(l + 1);
                    } else if (i - l !== 1) {
                        // Add ellipsis
                        rangeWithDots.push('...');
                    }
                }
                rangeWithDots.push(i);
                l = i;
            }

            return rangeWithDots;
        }
    },
    methods: {
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Uncategorized';
        },
        formatCurrency(value) {
            return window.inventoryHelpers.formatCurrency(value);
        },
        formatDate(dateString) {
            return window.inventoryHelpers.formatDate(dateString);
        }
    }
});

// Item Detail Modal Component
app.component('item-detail-modal', {
    props: {
        item: Object,
        categories: Array,
        conditions: Array,
        tags: Array
    },
    emits: ['close', 'edit', 'delete'],
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 max-w-2xl w-full p-6 theme-transition">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold dark:text-white">ITEM DETAILS</h2>
          <button class="text-2xl dark:text-white llm-focus" @click="$emit('close')">&times;</button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-24 h-24 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          
          <div>
            <h3 class="text-2xl font-bold mb-4 dark:text-white">{{ item.name }}</h3>
            
            <div class="space-y-3 mb-6">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Category:</span>
                <span class="font-bold dark:text-white">{{ getCategoryName(item.categoryId) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Value:</span>
                <span class="font-bold dark:text-white">{{ formatCurrency(item.value) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Date Added:</span>
                <span class="dark:text-white">{{ formatDate(item.addedDate) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Purchase Date:</span>
                <span class="dark:text-white">{{ formatDate(item.purchaseDate) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Condition:</span>
                <span class="dark:text-white">{{ getConditionName(item.condition) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Serial Number:</span>
                <span class="dark:text-white">{{ item.serialNumber || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Bought From:</span>
                <span class="dark:text-white">{{ item.boughtFrom || 'N/A' }}</span>
              </div>
            </div>
            
            <div v-if="item.productUrl" class="mb-4">
              <a 
                :href="item.productUrl" 
                target="_blank" 
                class="text-blue-600 dark:text-blue-400 hover:underline llm-focus">
                View Product Page →
              </a>
            </div>
            
            <div v-if="item.notes" class="mb-6">
              <h4 class="font-bold mb-2 dark:text-white">Notes:</h4>
              <p class="text-sm dark:text-gray-300">{{ item.notes }}</p>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-6">
              <span 
                v-for="tagId in item.tags" 
                :key="tagId" 
                class="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs dark:text-gray-300 theme-transition">
                {{ getTagName(tagId) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            class="px-4 py-2 border-2 border-black dark:border-gray-400 dark:text-white llm-focus theme-transition"
            @click="$emit('edit')">
            EDIT
          </button>
          <button 
            class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black llm-focus theme-transition"
            @click="$emit('close')">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  `,
    methods: {
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Uncategorized';
        },
        getTagName(tagId) {
            const tag = this.tags.find(t => t.id === tagId);
            return tag ? tag.name : '';
        },
        getConditionName(conditionId) {
            const condition = this.conditions.find(c => c.id === conditionId);
            return condition ? condition.name : 'Unknown';
        },
        formatCurrency(value) {
            return window.inventoryHelpers.formatCurrency(value);
        },
        formatDate(dateString) {
            return window.inventoryHelpers.formatDate(dateString);
        }
    }
});

// Item Form Modal Component for Add/Edit
app.component('item-form-modal', {
    props: {
        editMode: {
            type: Boolean,
            default: false
        },
        item: Object,
        categories: Array,
        conditions: Array,
        tags: Array
    },
    emits: ['save', 'close'],
    data() {
        return {
            formData: {
                id: null,
                name: '',
                categoryId: null,
                value: 0,
                currency: '₹',
                purchaseDate: new Date().toISOString().split('T')[0],
                condition: 1,
                serialNumber: '',
                boughtFrom: '',
                notes: '',
                productUrl: '',
                images: [],
                tags: []
            },
            errors: {},
            selectedTags: []
        };
    },
    watch: {
        item: {
            immediate: true,
            handler(newItem) {
                if (newItem) {
                    this.formData = JSON.parse(JSON.stringify(newItem));
                    this.selectedTags = [...(newItem.tags || [])];
                } else {
                    // Reset form for adding new item
                    this.formData = {
                        id: null,
                        name: '',
                        categoryId: this.categories.length > 0 ? this.categories[0].id : null,
                        value: 0,
                        currency: '₹',
                        purchaseDate: new Date().toISOString().split('T')[0],
                        condition: 1,
                        serialNumber: '',
                        boughtFrom: '',
                        notes: '',
                        productUrl: '',
                        images: [],
                        tags: []
                    };
                    this.selectedTags = [];
                }
            }
        }
    },
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto theme-transition">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold dark:text-white">{{ editMode ? 'EDIT ITEM' : 'ADD NEW ITEM' }}</h2>
          <button class="text-2xl dark:text-white llm-focus" @click="$emit('close')">&times;</button>
        </div>
        
        <form @submit.prevent="saveItem">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemName">
                  Name*
                </label>
                <input 
                  id="itemName" 
                  v-model="formData.name" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition"
                  :class="{'border-red-500': errors.name}"
                  required>
                <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemCategory">
                  Category*
                </label>
                <select 
                  id="itemCategory" 
                  v-model="formData.categoryId" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition"
                  required>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemValue">
                  Value*
                </label>
                <div class="flex">
                  <span class="border-2 border-r-0 border-black dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-white theme-transition">
                    {{ formData.currency }}
                  </span>
                  <input 
                    id="itemValue" 
                    v-model.number="formData.value" 
                    type="number" 
                    min="0" 
                    class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition"
                    required>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemPurchaseDate">
                  Purchase Date
                </label>
                <input 
                  id="itemPurchaseDate" 
                  v-model="formData.purchaseDate" 
                  type="date" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemCondition">
                  Condition
                </label>
                <select 
                  id="itemCondition" 
                  v-model="formData.condition" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
                  <option v-for="condition in conditions" :key="condition.id" :value="condition.id">
                    {{ condition.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Right Column -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemSerialNumber">
                  Serial Number
                </label>
                <input 
                  id="itemSerialNumber" 
                  v-model="formData.serialNumber" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemBoughtFrom">
                  Bought From
                </label>
                <input 
                  id="itemBoughtFrom" 
                  v-model="formData.boughtFrom" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemProductUrl">
                  Product URL
                </label>
                <input 
                  id="itemProductUrl" 
                  v-model="formData.productUrl" 
                  type="url" 
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 dark:text-white" for="itemNotes">
                  Notes
                </label>
                <textarea 
                  id="itemNotes" 
                  v-model="formData.notes" 
                  rows="3"
                  class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition"></textarea>
              </div>
            </div>
          </div>
          
          <!-- Tags Section -->
          <div class="mt-6">
            <label class="block text-sm font-bold mb-2 dark:text-white">
              Tags
            </label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="tag in tags" 
                :key="tag.id"
                type="button"
                :class="['px-2 py-1 text-xs theme-transition llm-focus', 
                        isTagSelected(tag.id) 
                        ? 'bg-black text-white dark:bg-white dark:text-black' 
                        : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300']"
                @click="toggleTag(tag.id)">
                {{ tag.name }}
              </button>
            </div>
          </div>
          
          <!-- Image Upload (placeholder for future implementation) -->
          <div class="mt-6">
            <label class="block text-sm font-bold mb-2 dark:text-white">
              Images
            </label>
            <div class="border-2 border-dashed border-black dark:border-gray-600 p-6 text-center theme-transition">
              <p class="dark:text-gray-400">
                Image upload functionality coming soon!
              </p>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="flex justify-end gap-3 mt-6">
            <button 
              type="button"
              class="px-4 py-2 border-2 border-black dark:border-gray-400 dark:text-white llm-focus theme-transition"
              @click="$emit('close')">
              CANCEL
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black llm-focus theme-transition">
              {{ editMode ? 'UPDATE' : 'ADD' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    methods: {
        isTagSelected(tagId) {
            return this.selectedTags.includes(tagId);
        },
        toggleTag(tagId) {
            if (this.isTagSelected(tagId)) {
                this.selectedTags = this.selectedTags.filter(id => id !== tagId);
            } else {
                this.selectedTags.push(tagId);
            }
        },
        validateForm() {
            this.errors = {};

            if (!this.formData.name.trim()) {
                this.errors.name = 'Name is required';
            }

            if (!this.formData.categoryId) {
                this.errors.category = 'Category is required';
            }

            if (isNaN(this.formData.value) || this.formData.value < 0) {
                this.errors.value = 'Value must be a positive number';
            }

            if (this.formData.productUrl && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(this.formData.productUrl)) {
                this.errors.productUrl = 'Invalid URL format';
            }

            return Object.keys(this.errors).length === 0;
        },
        saveItem() {
            if (!this.validateForm()) return;

            // Update tags in formData
            this.formData.tags = [...this.selectedTags];

            // Emit save event with form data
            this.$emit('save', this.formData);
        }
    }
});

// Confirmation Modal Component
app.component('confirm-modal', {
    props: {
        title: String,
        message: String
    },
    emits: ['confirm', 'cancel'],
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('cancel')">
      <div class="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 max-w-md w-full p-6 theme-transition">
        <h2 class="text-xl font-bold mb-4 dark:text-white">{{ title }}</h2>
        <p class="mb-6 dark:text-gray-300">{{ message }}</p>
        
        <div class="flex justify-end gap-3">
          <button 
            class="px-4 py-2 border-2 border-black dark:border-gray-400 dark:text-white llm-focus theme-transition"
            @click="$emit('cancel')">
            CANCEL
          </button>
          <button 
            class="px-4 py-2 bg-red-500 text-white llm-focus theme-transition"
            @click="$emit('confirm')">
            DELETE
          </button>
        </div>
      </div>
    </div>
  `
});

// Category Management Modal Component
app.component('category-modal', {
    props: {
        categories: Array
    },
    emits: ['save', 'delete', 'close'],
    data() {
        return {
            editingCategory: null,
            newCategory: {
                name: '',
                icon: 'box'
            },
            errors: {}
        };
    },
    computed: {
        isEditing() {
            return this.editingCategory !== null;
        }
    },
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto theme-transition">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold dark:text-white">MANAGE CATEGORIES</h2>
          <button class="text-2xl dark:text-white llm-focus" @click="$emit('close')">&times;</button>
        </div>
        
        <!-- New/Edit Category Form -->
        <div class="mb-8 border-2 border-black dark:border-gray-600 p-4 theme-transition">
          <h3 class="text-lg font-bold mb-4 dark:text-white">
            {{ isEditing ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY' }}
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold mb-2 dark:text-white" for="categoryName">
                Name*
              </label>
              <input 
                id="categoryName" 
                v-model="isEditing ? editingCategory.name : newCategory.name" 
                class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition"
                :class="{'border-red-500': errors.name}">
              <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-2 dark:text-white" for="categoryIcon">
                Icon
              </label>
              <input 
                id="categoryIcon" 
                v-model="isEditing ? editingCategory.icon : newCategory.icon" 
                class="border-2 border-black dark:border-gray-600 px-3 py-2 w-full dark:bg-gray-700 dark:text-white llm-focus theme-transition">
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Enter an icon name (e.g., box, device-laptop, book)
              </p>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-4">
            <button 
              v-if="isEditing"
              type="button"
              class="px-4 py-2 border-2 border-black dark:border-gray-400 dark:text-white llm-focus theme-transition"
              @click="cancelEdit">
              CANCEL
            </button>
            <button 
              type="button"
              class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black llm-focus theme-transition"
              @click="saveCategory">
              {{ isEditing ? 'UPDATE' : 'ADD' }}
            </button>
          </div>
        </div>
        
        <!-- Categories List -->
        <div class="border-2 border-black dark:border-gray-600 theme-transition">
          <div class="grid grid-cols-12 font-bold p-3 border-b-2 border-black dark:border-gray-600">
            <div class="col-span-5 dark:text-white">NAME</div>
            <div class="col-span-3 dark:text-white">ICON</div>
            <div class="col-span-4 text-center dark:text-white">ACTIONS</div>
          </div>
          
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="grid grid-cols-12 p-3 border-b border-gray-300 dark:border-gray-700 theme-transition">
            <div class="col-span-5 font-bold dark:text-white">{{ category.name }}</div>
            <div class="col-span-3 dark:text-gray-300">{{ category.icon }}</div>
            <div class="col-span-4 flex justify-center gap-3">
              <button 
                class="px-3 py-1 border border-black dark:border-gray-400 dark:text-white llm-focus theme-transition"
                @click="startEdit(category)">
                EDIT
              </button>
              <button 
                class="px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white llm-focus theme-transition"
                @click="deleteCategory(category.id)">
                DELETE
              </button>
            </div>
          </div>
          
          <div v-if="categories.length === 0" class="p-6 text-center dark:text-gray-400">
            No categories found. Add your first category above.
          </div>
        </div>
        
        <!-- Close Button -->
        <div class="flex justify-end mt-6">
          <button 
            class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black llm-focus theme-transition"
            @click="$emit('close')">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  `,
    methods: {
        validateForm() {
            this.errors = {};

            const nameToCheck = this.isEditing ? this.editingCategory.name : this.newCategory.name;

            if (!nameToCheck.trim()) {
                this.errors.name = 'Name is required';
                return false;
            }

            // Check for duplicate names (excluding current category if editing)
            const isDuplicate = this.categories.some(c =>
                c.name.toLowerCase() === nameToCheck.toLowerCase() &&
                (!this.isEditing || c.id !== this.editingCategory.id)
            );

            if (isDuplicate) {
                this.errors.name = 'A category with this name already exists';
                return false;
            }

            return true;
        },
        saveCategory() {
            if (!this.validateForm()) return;

            if (this.isEditing) {
                // Update existing category
                this.$emit('save', { ...this.editingCategory });
                this.cancelEdit();
            } else {
                // Add new category
                this.$emit('save', { ...this.newCategory });
                this.newCategory.name = '';
                this.newCategory.icon = 'box';
            }
        },
        startEdit(category) {
            this.editingCategory = { ...category };
        },
        cancelEdit() {
            this.editingCategory = null;
            this.errors = {};
        },
        deleteCategory(categoryId) {
            if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
                this.$emit('delete', categoryId);

                // If we were editing this category, cancel edit mode
                if (this.editingCategory && this.editingCategory.id === categoryId) {
                    this.cancelEdit();
                }
            }
        }
    }
});

// Mount the app
app.mount('#app');