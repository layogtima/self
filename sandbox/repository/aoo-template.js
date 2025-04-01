// Define main App template as string template literal
// This is imported by app.js
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

// Export the template
export default AppTemplate;