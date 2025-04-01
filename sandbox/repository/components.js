/**
 * MONO - Inventory Management System
 * Vue Components
 * 
 * This file contains all Vue components used in the application
 */

// Format a date based on the current settings
function formatDate(dateString, format = 'DD/MM/YYYY') {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);

    // Very simple formatter - in a real app, use a library like date-fns
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return format.replace('DD', day).replace('MM', month).replace('YYYY', year);
}

// Format currency based on settings
function formatCurrency(value, currency = '₹') {
    return `${currency}${value.toLocaleString()}`;
}

// Utility function to create SVG icons
function createIconComponent(icon) {
    return {
        template: `<span class="icon">${icon}</span>`,
        props: ['size'],
        computed: {
            sizeClass() {
                return this.size ? `w-${this.size} h-${this.size}` : 'w-5 h-5';
            }
        }
    };
}

// Toast notification system
const ToastService = {
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
};

// Navigation Component
const Navigation = {
    template: `
      <nav class="fixed w-full px-4 py-3 flex justify-between items-center z-50 bg-background border-b border-border">
        <router-link to="/" class="text-xl font-bold tracking-normal text-text">
          INV<span class="text-xs align-super">ENTORY</span>
        </router-link>
        <div class="hidden md:flex gap-6">
          <router-link to="/" class="text-sm transition-all duration-300" 
            :class="$route.path === '/' ? 'underline decoration-4 underline-offset-8 text-text' : 'hover:underline decoration-4 underline-offset-8 text-text-secondary'">
            DASHBOARD
          </router-link>
          <router-link to="/categories" class="text-sm transition-all duration-300" 
            :class="$route.path === '/categories' ? 'underline decoration-4 underline-offset-8 text-text' : 'hover:underline decoration-4 underline-offset-8 text-text-secondary'">
            CATEGORIES
          </router-link>
          <router-link to="/stats" class="text-sm transition-all duration-300" 
            :class="$route.path === '/stats' ? 'underline decoration-4 underline-offset-8 text-text' : 'hover:underline decoration-4 underline-offset-8 text-text-secondary'">
            STATS
          </router-link>
          <router-link to="/settings" class="text-sm transition-all duration-300" 
            :class="$route.path === '/settings' ? 'underline decoration-4 underline-offset-8 text-text' : 'hover:underline decoration-4 underline-offset-8 text-text-secondary'">
            SETTINGS
          </router-link>
        </div>
        
        <!-- Mobile Menu Button -->
        <button @click="toggleMobileMenu" class="md:hidden text-text">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>
      
      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="fixed inset-0 bg-background z-40 md:hidden pt-16" @click="closeMobileMenu">
        <div class="p-4 flex flex-col space-y-4">
          <router-link @click.native="closeMobileMenu" to="/" class="text-lg p-2" 
            :class="$route.path === '/' ? 'bg-primary text-background' : 'text-text'">
            DASHBOARD
          </router-link>
          <router-link @click.native="closeMobileMenu" to="/categories" class="text-lg p-2" 
            :class="$route.path === '/categories' ? 'bg-primary text-background' : 'text-text'">
            CATEGORIES
          </router-link>
          <router-link @click.native="closeMobileMenu" to="/stats" class="text-lg p-2" 
            :class="$route.path === '/stats' ? 'bg-primary text-background' : 'text-text'">
            STATS
          </router-link>
          <router-link @click.native="closeMobileMenu" to="/settings" class="text-lg p-2" 
            :class="$route.path === '/settings' ? 'bg-primary text-background' : 'text-text'">
            SETTINGS
          </router-link>
        </div>
      </div>
    `,
    data() {
        return {
            mobileMenuOpen: false
        };
    },
    methods: {
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            document.body.classList.toggle('mobile-menu-open');
        },
        closeMobileMenu() {
            this.mobileMenuOpen = false;
            document.body.classList.remove('mobile-menu-open');
        }
    },
    watch: {
        '$route'() {
            this.closeMobileMenu();
        }
    }
};

// Sidebar Component
const Sidebar = {
    template: `
      <aside :class="[
        'border-r border-border h-screen overflow-y-auto transition-all duration-300',
        isMobile ? 'fixed left-0 top-0 pt-16 w-64 z-30 bg-background transform -translate-x-full' : 'w-64 fixed'
      ]" :style="{'transform': isMobile && sidebarOpen ? 'translateX(0)' : ''}">
        <div class="p-4">
          <h2 class="text-xl font-bold mb-6 text-text">CATE<span class="text-xs align-super">GORIES</span></h2>
          <ul class="space-y-2">
            <li v-for="category in categories" :key="category.id">
              <router-link 
                :to="{ name: 'categoryItems', params: { categoryId: category.id } }" 
                class="block p-2 transition-colors"
                :class="selectedCategory === category.id ? 'bg-primary text-background' : 'hover:bg-surface text-text'">
                {{ category.name }}
              </router-link>
            </li>
          </ul>
  
          <div class="flex justify-between items-center mt-8 mb-4">
            <h2 class="text-xl font-bold text-text">TAGS</h2>
            <button @click="$emit('openTagModal')" class="text-xs border border-border p-1 hover:bg-surface text-text">+ ADD</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tag in tags" 
              :key="tag.id" 
              class="px-2 py-1 bg-surface text-xs cursor-pointer transition-colors hover:bg-primary hover:text-background text-text-secondary"
              @click="toggleTagFilter(tag.id)">
              {{ tag.name }}
            </span>
          </div>
  
          <h2 class="text-xl font-bold mt-8 mb-6 text-text">STATS</h2>
          <div class="space-y-2 text-text">
            <div class="flex justify-between">
              <span>Total Items:</span>
              <span class="font-bold">{{ stats.totalItems }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Value:</span>
              <span class="font-bold">{{ formatCurrency(stats.totalValue) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Last Added:</span>
              <span class="font-bold">{{ lastAddedDisplay }}</span>
            </div>
          </div>
        </div>
      </aside>
    `,
    props: {
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        },
        stats: {
            type: Object,
            required: true
        },
        selectedCategory: {
            type: String,
            default: null
        },
        isMobile: {
            type: Boolean,
            default: false
        },
        sidebarOpen: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        toggleTagFilter(tagId) {
            this.$emit('toggle-tag-filter', tagId);
        },
        formatCurrency(value) {
            return formatCurrency(value, this.$root.settings.currency);
        }
    },
    computed: {
        lastAddedDisplay() {
            if (!this.stats.lastAdded) return 'Never';

            const lastAddedDate = new Date(this.stats.lastAdded.dateAdded);
            const now = new Date();
            const diffTime = Math.abs(now - lastAddedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else {
                return formatDate(this.stats.lastAdded.dateAdded, this.$root.settings.dateFormat);
            }
        }
    }
};

// Item Card Component
const ItemCard = {
    template: `
      <div :class="['border-2 border-border p-4 item-hover transition-all duration-300', view === 'grid' ? 'bg-surface' : 'bg-surface flex gap-4 items-center']">
        <div :class="[view === 'grid' ? 'aspect-square mb-4 bg-background flex items-center justify-center' : 'w-16 h-16 bg-background flex items-center justify-center shrink-0']">
          <svg class="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path v-if="categoryIcon === 'device-laptop'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            <path v-else-if="categoryIcon === 'book'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            <path v-else-if="categoryIcon === 'shirt'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            <path v-else-if="categoryIcon === 'tool'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path v-else-if="categoryIcon === 'activity'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path v-else-if="categoryIcon === 'cpu'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
        </div>
        <div :class="view === 'list' ? 'flex-1' : ''">
          <h3 class="font-bold text-lg mb-1 text-text">{{ item.name }}</h3>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-text-secondary">{{ categoryName }}</span>
            <span class="font-bold text-text">{{ formatCurrency(item.value) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-text-tertiary">Added: {{ formatDate(item.dateAdded) }}</span>
            <div class="flex gap-1">
              <span v-for="i in 3" :key="i" class="w-2 h-2 bg-primary rounded-full"></span>
            </div>
          </div>
        </div>
        <div v-if="view === 'list'" class="flex gap-2">
          <button @click.stop="$emit('edit-item', item)" class="p-1 hover:bg-primary hover:text-background border border-border text-xs">
            EDIT
          </button>
          <button @click.stop="$emit('delete-item', item)" class="p-1 hover:bg-primary hover:text-background border border-border text-xs">
            DELETE
          </button>
        </div>
      </div>
    `,
    props: {
        item: {
            type: Object,
            required: true
        },
        categoryName: {
            type: String,
            required: true
        },
        categoryIcon: {
            type: String,
            default: 'box'
        },
        view: {
            type: String,
            default: 'grid'
        }
    },
    methods: {
        formatDate(dateString) {
            return formatDate(dateString, this.$root.settings.dateFormat);
        },
        formatCurrency(value) {
            return formatCurrency(value, this.$root.settings.currency);
        }
    }
};

// Item Modal Component
const ItemModal = {
    template: `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
        <div class="bg-background border-2 border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-text">{{ isEditing ? 'EDIT ITEM' : 'ITEM DETAILS' }}</h2>
            <button @click="$emit('close')" class="text-2xl text-text">&times;</button>
          </div>
          
          <div v-if="!isEditing">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="aspect-square bg-surface flex items-center justify-center">
                <svg class="w-24 h-24 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path v-if="categoryIcon === 'device-laptop'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  <path v-else-if="categoryIcon === 'book'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  <path v-else-if="categoryIcon === 'shirt'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  <path v-else-if="categoryIcon === 'tool'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path v-else-if="categoryIcon === 'activity'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  <path v-else-if="categoryIcon === 'cpu'" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              
              <div>
                <h3 class="text-2xl font-bold mb-4 text-text">{{ item.name }}</h3>
                
                <div class="space-y-3 mb-6 text-text">
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Category:</span>
                    <span class="font-bold">{{ categoryName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Value:</span>
                    <span class="font-bold">{{ formatCurrency(item.value) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Date Added:</span>
                    <span>{{ formatDate(item.dateAdded) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Condition:</span>
                    <span>{{ item.condition || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Serial Number:</span>
                    <span>{{ item.serialNumber || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Bought From:</span>
                    <span>{{ item.boughtFrom || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-secondary">Bought On:</span>
                    <span>{{ formatDate(item.boughtOn) }}</span>
                  </div>
                  <div v-if="item.productUrl" class="flex justify-between">
                    <span class="text-text-secondary">Product URL:</span>
                    <a :href="item.productUrl" target="_blank" class="underline text-accent">Link</a>
                  </div>
                </div>
                
                <div class="mb-6">
                  <h4 class="font-bold mb-2 text-text">Notes:</h4>
                  <p class="text-sm text-text">{{ item.notes || 'No notes available.' }}</p>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-6">
                  <span v-for="tagId in item.tags" :key="tagId" class="px-2 py-1 bg-surface text-xs text-text-secondary">
                    {{ getTagName(tagId) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
              <button @click="startEditing" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">EDIT</button>
              <button @click="$emit('close')" class="px-4 py-2 bg-primary text-background">CLOSE</button>
            </div>
          </div>
          
          <!-- Edit Form -->
          <div v-else>
            <form @submit.prevent="saveItem">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Name *</label>
                    <input v-model="editedItem.name" type="text" class="w-full p-2 border-2 border-border bg-background text-text" required>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Category *</label>
                    <select v-model="editedItem.category" class="w-full p-2 border-2 border-border bg-background text-text" required>
                      <option v-for="category in categories" :value="category.id" :key="category.id">{{ category.name }}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Value *</label>
                    <input v-model.number="editedItem.value" type="number" min="0" class="w-full p-2 border-2 border-border bg-background text-text" required>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Condition</label>
                    <select v-model="editedItem.condition" class="w-full p-2 border-2 border-border bg-background text-text">
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="prototype">Prototype</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Serial Number</label>
                    <input v-model="editedItem.serialNumber" type="text" class="w-full p-2 border-2 border-border bg-background text-text">
                  </div>
                </div>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Bought From</label>
                    <input v-model="editedItem.boughtFrom" type="text" class="w-full p-2 border-2 border-border bg-background text-text">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Bought On</label>
                    <input v-model="editedItem.boughtOn" type="date" class="w-full p-2 border-2 border-border bg-background text-text">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Product URL</label>
                    <input v-model="editedItem.productUrl" type="url" class="w-full p-2 border-2 border-border bg-background text-text">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-bold mb-2 text-text">Notes</label>
                    <textarea v-model="editedItem.notes" class="w-full p-2 border-2 border-border bg-background text-text h-20"></textarea><div>
                  <label class="block text-sm font-bold mb-2 text-text">Notes</label>
                  <textarea v-model="editedItem.notes" class="w-full p-2 border-2 border-border bg-background text-text h-20"></textarea>
                </div>
                
                <div>
                  <label class="block text-sm font-bold mb-2 text-text">Tags</label>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="tag in tags" 
                      :key="tag.id" 
                      @click="toggleTag(tag.id)"
                      :class="['px-2 py-1 text-xs cursor-pointer transition-colors', 
                        editedItem.tags.includes(tag.id) ? 'bg-primary text-background' : 'bg-surface text-text-secondary']">
                      {{ tag.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" @click="cancelEditing" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
              <button type="submit" class="px-4 py-2 bg-primary text-background">SAVE</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    props: {
        item: {
            type: Object,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        },
        categoryName: {
            type: String,
            required: true
        },
        categoryIcon: {
            type: String,
            default: 'box'
        }
    },
    data() {
        return {
            isEditing: false,
            editedItem: {
                id: '',
                name: '',
                category: '',
                value: 0,
                condition: '',
                serialNumber: '',
                boughtFrom: '',
                boughtOn: '',
                productUrl: '',
                notes: '',
                tags: []
            }
        };
    },
    methods: {
        formatDate(dateString) {
            return formatDate(dateString, this.$root.settings.dateFormat);
        },
        formatCurrency(value) {
            return formatCurrency(value || 0, this.$root.settings.currency);
        },
        getTagName(tagId) {
            const tag = this.tags.find(t => t.id === tagId);
            return tag ? tag.name : 'Unknown';
        },
        startEditing() {
            this.editedItem = JSON.parse(JSON.stringify(this.item));

            // Convert date strings to HTML date input format
            if (this.editedItem.boughtOn) {
                const date = new Date(this.editedItem.boughtOn);
                this.editedItem.boughtOn = date.toISOString().split('T')[0];
            }

            // Initialize tags if null
            if (!this.editedItem.tags) {
                this.editedItem.tags = [];
            }

            this.isEditing = true;
        },
        cancelEditing() {
            this.isEditing = false;
        },
        toggleTag(tagId) {
            if (!this.editedItem.tags) {
                this.editedItem.tags = [];
            }

            const index = this.editedItem.tags.indexOf(tagId);
            if (index === -1) {
                this.editedItem.tags.push(tagId);
            } else {
                this.editedItem.tags.splice(index, 1);
            }
        },
        saveItem() {
            // Validate required fields
            if (!this.editedItem.name || !this.editedItem.category || this.editedItem.value === null || this.editedItem.value === undefined) {
                ToastService.show('Please fill out all required fields.', 'error');
                return;
            }

            // Convert value to number
            this.editedItem.value = parseFloat(this.editedItem.value);

            // Convert dates to ISO strings
            if (this.editedItem.boughtOn) {
                this.editedItem.boughtOn = new Date(this.editedItem.boughtOn).toISOString();
            }

            this.$emit('save', this.editedItem);
            this.isEditing = false;
        }
    }
};

// Add Item Modal Component
const AddItemModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
      <div class="bg-background border-2 border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text">ADD NEW ITEM</h2>
          <button @click="$emit('close')" class="text-2xl text-text">&times;</button>
        </div>
        
        <form @submit.prevent="saveItem">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Name *</label>
                <input v-model="newItem.name" type="text" class="w-full p-2 border-2 border-border bg-background text-text" required>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Category *</label>
                <select v-model="newItem.category" class="w-full p-2 border-2 border-border bg-background text-text" required>
                  <option value="" disabled>Select a category</option>
                  <option v-for="category in categories" :value="category.id" :key="category.id">{{ category.name }}</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Value *</label>
                <input v-model.number="newItem.value" type="number" min="0" class="w-full p-2 border-2 border-border bg-background text-text" required>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Condition</label>
                <select v-model="newItem.condition" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option value="" disabled>Select condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="prototype">Prototype</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Serial Number</label>
                <input v-model="newItem.serialNumber" type="text" class="w-full p-2 border-2 border-border bg-background text-text">
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Bought From</label>
                <input v-model="newItem.boughtFrom" type="text" class="w-full p-2 border-2 border-border bg-background text-text">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Bought On</label>
                <input v-model="newItem.boughtOn" type="date" class="w-full p-2 border-2 border-border bg-background text-text">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Product URL</label>
                <input v-model="newItem.productUrl" type="url" class="w-full p-2 border-2 border-border bg-background text-text">
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Notes</label>
                <textarea v-model="newItem.notes" class="w-full p-2 border-2 border-border bg-background text-text h-20"></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Tags</label>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tag in tags" 
                    :key="tag.id" 
                    @click="toggleTag(tag.id)"
                    :class="['px-2 py-1 text-xs cursor-pointer transition-colors', 
                      newItem.tags.includes(tag.id) ? 'bg-primary text-background' : 'bg-surface text-text-secondary']">
                    {{ tag.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="$emit('close')" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
            <button type="submit" class="px-4 py-2 bg-primary text-background">SAVE</button>
          </div>
        </form>
      </div>
    </div>
  `,
    props: {
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        },
        selectedCategory: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            newItem: this.getEmptyItem()
        };
    },
    methods: {
        getEmptyItem() {
            return {
                name: '',
                category: this.selectedCategory || '',
                value: 0,
                condition: '',
                serialNumber: '',
                boughtFrom: '',
                boughtOn: '',
                productUrl: '',
                notes: '',
                tags: []
            };
        },
        toggleTag(tagId) {
            const index = this.newItem.tags.indexOf(tagId);
            if (index === -1) {
                this.newItem.tags.push(tagId);
            } else {
                this.newItem.tags.splice(index, 1);
            }
        },
        saveItem() {
            // Validate required fields
            if (!this.newItem.name || !this.newItem.category || this.newItem.value === null || this.newItem.value === undefined) {
                ToastService.show('Please fill out all required fields.', 'error');
                return;
            }

            // Convert value to number
            this.newItem.value = parseFloat(this.newItem.value);

            // Convert dates to ISO strings
            if (this.newItem.boughtOn) {
                this.newItem.boughtOn = new Date(this.newItem.boughtOn).toISOString();
            }

            this.$emit('save', this.newItem);
            this.newItem = this.getEmptyItem();
        }
    },
    watch: {
        selectedCategory(newVal) {
            this.newItem.category = newVal || '';
        }
    }
};

// Category Modal Component
const CategoryModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
      <div class="bg-background border-2 border-border w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text">{{ isEditing ? 'EDIT CATEGORY' : 'ADD CATEGORY' }}</h2>
          <button @click="$emit('close')" class="text-2xl text-text">&times;</button>
        </div>
        
        <form @submit.prevent="saveCategory">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2 text-text">Name *</label>
              <input v-model="categoryData.name" type="text" class="w-full p-2 border-2 border-border bg-background text-text" required>
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-2 text-text">Icon</label>
              <select v-model="categoryData.icon" class="w-full p-2 border-2 border-border bg-background text-text">
                <option value="device-laptop">Laptop</option>
                <option value="book">Book</option>
                <option value="shirt">Clothing</option>
                <option value="tool">Tool</option>
                <option value="activity">Activity</option>
                <option value="cpu">Tech/CPU</option>
                <option value="box">Generic Box</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="$emit('close')" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
            <button type="submit" class="px-4 py-2 bg-primary text-background">SAVE</button>
          </div>
        </form>
      </div>
    </div>
  `,
    props: {
        category: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            categoryData: {
                id: '',
                name: '',
                icon: 'box'
            }
        };
    },
    computed: {
        isEditing() {
            return this.category !== null;
        }
    },
    watch: {
        category: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.categoryData = JSON.parse(JSON.stringify(newVal));
                } else {
                    this.categoryData = {
                        id: '',
                        name: '',
                        icon: 'box'
                    };
                }
            }
        }
    },
    methods: {
        saveCategory() {
            if (!this.categoryData.name) {
                ToastService.show('Please enter a category name.', 'error');
                return;
            }

            this.$emit('save', this.categoryData);
        }
    }
};

// Tag Modal Component
const TagModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
      <div class="bg-background border-2 border-border w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text">{{ isEditing ? 'EDIT TAG' : 'ADD TAG' }}</h2>
          <button @click="$emit('close')" class="text-2xl text-text">&times;</button>
        </div>
        
        <form @submit.prevent="saveTag">
          <div>
            <label class="block text-sm font-bold mb-2 text-text">Name *</label>
            <input v-model="tagData.name" type="text" class="w-full p-2 border-2 border-border bg-background text-text" required>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="$emit('close')" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
            <button type="submit" class="px-4 py-2 bg-primary text-background">SAVE</button>
          </div>
        </form>
      </div>
    </div>
  `,
    props: {
        tag: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            tagData: {
                id: '',
                name: ''
            }
        };
    },
    computed: {
        isEditing() {
            return this.tag !== null;
        }
    },
    watch: {
        tag: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.tagData = JSON.parse(JSON.stringify(newVal));
                } else {
                    this.tagData = {
                        id: '',
                        name: ''
                    };
                }
            }
        }
    },
    methods: {
        saveTag() {
            if (!this.tagData.name) {
                ToastService.show('Please enter a tag name.', 'error');
                return;
            }

            this.$emit('save', this.tagData);
        }
    }
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = {
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
      <div class="bg-background border-2 border-border w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text">CONFIRM DELETE</h2>
          <button @click="$emit('close')" class="text-2xl text-text">&times;</button>
        </div>
        
        <p class="text-text mb-6">Are you sure you want to delete <strong>{{ itemName }}</strong>? This action cannot be undone.</p>
        
        <div class="flex justify-end gap-3">
          <button @click="$emit('close')" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
          <button @click="$emit('confirm')" class="px-4 py-2 bg-red-600 text-white">DELETE</button>
        </div>
      </div>
    </div>
  `,
    props: {
        itemName: {
            type: String,
            required: true
        }
    }
};

// Settings Component
const SettingsComponent = {
    template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-8 text-text">SETTINGS</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-bold mb-4 text-text">APPEARANCE</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Theme</label>
                <select v-model="settings.theme" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option value="default">Default (Monochrome)</option>
                  <option value="theme-neon-brutalist">Neon Brutalist</option>
                  <option value="theme-eco">Eco</option>
                  <option value="theme-absurd">Absurd</option>
                </select>
              </div>
              
              <div class="flex items-center">
                <input v-model="settings.darkMode" type="checkbox" id="darkMode" class="mr-2">
                <label for="darkMode" class="text-text">Dark Mode</label>
              </div>
              
              <div class="flex items-center">
                <input v-model="settings.experimentalFeatures" type="checkbox" id="experimentalFeatures" class="mr-2">
                <label for="experimentalFeatures" class="text-text">Experimental Features</label>
              </div>
              
              <div class="flex items-center">
                <input v-model="settings.assistiveMode" type="checkbox" id="assistiveMode" class="mr-2">
                <label for="assistiveMode" class="text-text">Assistive Mode (for LLMs and accessibility)</label>
              </div>
            </div>
          </div>
          
          <div>
            <h2 class="text-xl font-bold mb-4 text-text">DISPLAY PREFERENCES</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Default View</label>
                <select v-model="settings.defaultView" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Items Per Page</label>
                <select v-model="settings.itemsPerPage" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option :value="8">8</option>
                  <option :value="16">16</option>
                  <option :value="24">24</option>
                  <option :value="32">32</option>
                </select>
              </div>
              
              <div class="flex items-center">
                <input v-model="settings.showThumbnails" type="checkbox" id="showThumbnails" class="mr-2">
                <label for="showThumbnails" class="text-text">Show Thumbnails</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-bold mb-4 text-text">PREFERENCES</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Currency Symbol</label>
                <select v-model="settings.currency" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="¥">¥ (JPY)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-bold mb-2 text-text">Date Format</label>
                <select v-model="settings.dateFormat" class="w-full p-2 border-2 border-border bg-background text-text">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 class="text-xl font-bold mb-4 text-text">DATA MANAGEMENT</h2>
            <div class="space-y-4">
              <button @click="exportData" class="px-4 py-2 border-2 border-border hover:bg-surface text-text w-full">
                EXPORT DATA
              </button>
              
              <button @click="confirmImport" class="px-4 py-2 border-2 border-border hover:bg-surface text-text w-full">
                IMPORT DATA
              </button>
              
              <button @click="confirmReset" class="px-4 py-2 border-2 bg-red-600 border-red-600 text-white w-full">
                RESET ALL DATA
              </button>
              
              <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept=".json">
            </div>
          </div>
          
          <div>
            <h2 class="text-xl font-bold mb-4 text-text">INFORMATION</h2>
            <div class="bg-surface p-4 text-text">
              <p class="mb-2"><strong>Version:</strong> 1.0.0</p>
              <p class="mb-2"><strong>Developer:</strong> Absurd Industries</p>
              <p class="italic text-sm text-text-secondary mt-4">MONO | Personal Inventory Management with monochromatic clarity</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 flex justify-end">
        <button @click="saveSettings" class="px-6 py-3 bg-primary text-background">SAVE SETTINGS</button>
      </div>
      
      <!-- Reset Confirmation Modal -->
      <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-background border-2 border-border w-full max-w-md p-6">
          <h2 class="text-2xl font-bold mb-4 text-text">CONFIRM RESET</h2>
          <p class="text-text mb-6">Are you sure you want to reset all data? This will delete all your items, categories, and tags. This action cannot be undone.</p>
          
          <div class="flex justify-end gap-3">
            <button @click="showResetModal = false" class="px-4 py-2 border-2 border-border hover:bg-surface text-text">CANCEL</button>
            <button @click="resetAllData" class="px-4 py-2 bg-red-600 text-white">RESET</button>
          </div>
        </div>
      </div>
    </div>
  `,
    data() {
        return {
            settings: {},
            showResetModal: false
        };
    },
    created() {
        // Clone the settings to avoid direct mutation
        this.settings = JSON.parse(JSON.stringify(this.$root.settings));
    },
    methods: {
        saveSettings() {
            // Save settings and apply them
            this.$emit('save-settings', this.settings);
            ToastService.show('Settings saved successfully!');
        },
        exportData() {
            // Get all data
            const data = {
                items: window.DataService.getItems(),
                categories: window.DataService.getCategories(),
                tags: window.DataService.getTags(),
                settings: window.DataService.getSettings(),
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            // Create a JSON file
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            // Create a download link and trigger it
            const exportFileDefaultName = `mono-inventory-export-${new Date().toISOString().slice(0, 10)}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            ToastService.show('Data exported successfully!');
        },
        confirmImport() {
            this.$refs.fileInput.click();
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate data
                    if (!data.items || !data.categories || !data.tags || !data.settings) {
                        throw new Error('Invalid data format');
                    }

                    // Import the data
                    localStorage.setItem('mono_items', JSON.stringify(data.items));
                    localStorage.setItem('mono_categories', JSON.stringify(data.categories));
                    localStorage.setItem('mono_tags', JSON.stringify(data.tags));
                    localStorage.setItem('mono_settings', JSON.stringify(data.settings));

                    ToastService.show('Data imported successfully! Refreshing page...');

                    // Reload the page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    ToastService.show('Error importing data: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);

            // Reset the file input
            event.target.value = '';
        },
        confirmReset() {
            this.showResetModal = true;
        },
        resetAllData() {
            // Reset to initial data
            localStorage.removeItem('mono_items');
            localStorage.removeItem('mono_categories');
            localStorage.removeItem('mono_tags');
            localStorage.removeItem('mono_settings');

            ToastService.show('All data has been reset! Refreshing page...');

            // Close the modal
            this.showResetModal = false;

            // Reload the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }
};

// Stats Component
const StatsComponent = {
    template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-8 text-text">STATISTICS</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">TOTAL ITEMS</h2>
          <p class="text-4xl font-bold text-text">{{ stats.totalItems }}</p>
        </div>
        
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">TOTAL VALUE</h2>
          <p class="text-4xl font-bold text-text">{{ formatCurrency(stats.totalValue) }}</p>
        </div>
        
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">AVG ITEM VALUE</h2>
          <p class="text-4xl font-bold text-text">{{ formatCurrency(stats.totalValue / stats.totalItems) }}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 class="text-xl font-bold mb-4 text-text">VALUE BY CATEGORY</h2>
          <div class="border-2 border-border bg-surface">
            <div v-for="category in stats.valueByCategory" :key="category.id" class="p-4 border-b border-border last:border-b-0">
              <div class="flex justify-between items-center">
                <span class="font-bold text-text">{{ category.name }}</span>
                <span class="text-text">{{ formatCurrency(category.value) }}</span>
              </div>
              <div class="mt-2 bg-background h-4 w-full">
                <div :style="{ width: (category.value / stats.totalValue * 100) + '%' }" class="h-full bg-primary"></div>
              </div>
              <div class="mt-1 text-xs text-text-secondary">{{ category.count }} items</div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 class="text-xl font-bold mb-4 text-text">RECENT ACTIVITY</h2>
          <div class="border-2 border-border bg-surface">
            <div v-for="(item, index) in recentItems" :key="item.id" class="p-4 border-b border-border last:border-b-0">
              <div class="flex justify-between items-center">
                <div>
                  <span class="font-bold text-text">{{ item.name }}</span>
                  <div class="text-xs text-text-secondary">{{ formatDate(item.dateAdded) }}</div>
                </div>
                <span class="text-text">{{ formatCurrency(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    props: {
        stats: {
            type: Object,
            required: true
        },
        items: {
            type: Array,
            required: true
        }
    },
    computed: {
        recentItems() {
            // Get the 5 most recent items
            return [...this.items]
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .slice(0, 5);
        }
    },
    methods: {
        formatDate(dateString) {
            return formatDate(dateString, this.$root.settings.dateFormat);
        },
        formatCurrency(value) {
            return formatCurrency(value || 0, this.$root.settings.currency);
        }
    }
};

// Dashboard Component
const DashboardComponent = {
    template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-text">DASHBOARD</h1>
        <button @click="$emit('add-item')" class="bg-primary text-background px-4 py-2 hover:bg-opacity-90 transition-colors">
          + ADD ITEM
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">TOTAL ITEMS</h2>
          <p class="text-4xl font-bold text-text">{{ stats.totalItems }}</p>
        </div>
        
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">TOTAL VALUE</h2>
          <p class="text-4xl font-bold text-text">{{ formatCurrency(stats.totalValue) }}</p>
        </div>
        
        <div class="border-2 border-border p-6 bg-surface">
          <h2 class="text-lg font-bold mb-2 text-text">CATEGORIES</h2>
          <p class="text-4xl font-bold text-text">{{ categories.length }}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 class="text-xl font-bold mb-4 text-text">RECENT ITEMS</h2>
          <div class="border-2 border-border bg-surface">
            <div v-for="(item, index) in recentItems" :key="item.id" class="p-4 border-b border-border last:border-b-0">
              <div class="flex justify-between items-center">
                <div>
                  <span class="font-bold text-text">{{ item.name }}</span>
                  <div class="text-xs text-text-secondary">{{ getCategoryName(item.category) }}</div>
                </div>
                <span class="text-text">{{ formatCurrency(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 class="text-xl font-bold mb-4 text-text">TOP VALUE ITEMS</h2>
          <div class="border-2 border-border bg-surface">
            <div v-for="(item, index) in topValueItems" :key="item.id" class="p-4 border-b border-border last:border-b-0">
              <div class="flex justify-between items-center">
                <div>
                  <span class="font-bold text-text">{{ item.name }}</span>
                  <div class="text-xs text-text-secondary">{{ getCategoryName(item.category) }}</div>
                </div>
                <span class="text-text">{{ formatCurrency(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h2 class="text-xl font-bold mb-4 text-text">CATEGORY BREAKDOWN</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="category in categoryBreakdown" :key="category.id" class="border-2 border-border p-4 bg-surface">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-text">{{ category.name }}</h3>
            <span class="text-sm text-text">{{ category.count }} items</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Total Value:</span>
            <span class="font-bold text-text">{{ formatCurrency(category.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    props: {
        items: {
            type: Array,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        },
        stats: {
            type: Object,
            required: true
        }
    },
    computed: {
        recentItems() {
            // Get the 5 most recent items
            return [...this.items]
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .slice(0, 5);
        },
        topValueItems() {
            // Get the 5 highest value items
            return [...this.items]
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
        },
        categoryBreakdown() {
            return this.stats.valueByCategory.sort((a, b) => b.value - a.value);
        }
    },
    methods: {
        formatDate(dateString) {
            return formatDate(dateString, this.$root.settings.dateFormat);
        },
        formatCurrency(value) {
            return formatCurrency(value || 0, this.$root.settings.currency);
        },
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Uncategorized';
        }
    }
};

// Category Management Component
const CategoryManagementComponent = {
    template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-text">CATEGORIES</h1>
        <button @click="$emit('add-category')" class="bg-primary text-background px-4 py-2 hover:bg-opacity-90 transition-colors">
          + ADD CATEGORY
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="category in categories" :key="category.id" class="border-2 border-border p-4 bg-surface">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg text-text">{{ category.name }}</h3>
            <div class="flex items-center space-x-2">
              <button @click="$emit('edit-category', category)" class="p-1 hover:bg-primary hover:text-background border border-border text-xs text-text">
                EDIT
              </button>
              <button @click="$emit('delete-category', category)" class="p-1 hover:bg-red-600 hover:text-white border border-border text-xs text-text">
                DELETE
              </button>
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-text-secondary">Items:</span>
            <span class="font-bold text-text">{{ getCategoryItemCount(category.id) }}</span>
          </div>
          
          <div class="flex justify-between items-center mt-2">
            <span class="text-text-secondary">Total Value:</span>
            <span class="font-bold text-text">{{ formatCurrency(getCategoryValue(category.id)) }}</span>
          </div>
        </div>
      </div>
      
      <h2 class="text-xl font-bold mt-8 mb-4 text-text">TAGS</h2>
      <div class="border-2 border-border bg-surface p-4">
        <div class="flex flex-wrap gap-4">
          <div v-for="tag in tags" :key="tag.id" class="flex items-center bg-background px-3 py-2 text-text">
            <span>{{ tag.name }}</span>
            <div class="ml-4 flex space-x-2">
              <button @click="$emit('edit-tag', tag)" class="text-xs hover:text-accent text-text-secondary">
                Edit
              </button>
              <button @click="$emit('delete-tag', tag)" class="text-xs hover:text-red-600 text-text-secondary">
                Delete
              </button>
            </div>
          </div>
          
          <button @click="$emit('add-tag')" class="flex items-center bg-background px-3 py-2 text-text-secondary hover:text-text">
            + Add Tag
          </button>
        </div>
      </div>
    </div>
  `,
    props: {
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        },
        items: {
            type: Array,
            required: true
        }
    },
    methods: {
        formatCurrency(value) {
            return formatCurrency(value || 0, this.$root.settings.currency);
        },
        getCategoryItemCount(categoryId) {
            return this.items.filter(item => item.category === categoryId).length;
        },
        getCategoryValue(categoryId) {
            return this.items
                .filter(item => item.category === categoryId)
                .reduce((sum, item) => sum + (item.value || 0), 0);
        }
    }
};

// Inventory Component (Main content)
const InventoryComponent = {
    template: `
    <div class="ml-0 md:ml-64 flex-1 p-6 grid-pattern">
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div class="flex items-center">
          <h1 class="text-3xl font-bold text-text">{{ selectedCategoryName || 'ALL ITEMS' }}</h1>
          <span class="ml-4 px-2 py-1 bg-primary text-background text-xs">{{ filteredItems.length }} ITEMS</span>
        </div>

        <div class="flex gap-4 flex-wrap">
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="SEARCH..." class="border-2 border-border px-3 py-2 w-64 bg-background text-text">
          </div>
          
          <select v-model="sortOption" class="border-2 border-border px-3 py-2 bg-background text-text">
            <option value="newest">SORT: NEWEST</option>
            <option value="oldest">SORT: OLDEST</option>
            <option value="name_asc">SORT: A-Z</option>
            <option value="name_desc">SORT: Z-A</option>
            <option value="value_asc">SORT: VALUE ↑</option>
            <option value="value_desc">SORT: VALUE ↓</option>
          </select>
          
          <button @click="$emit('add-item')" class="bg-primary text-background px-4 py-2">+ ADD ITEM</button>
        </div>
      </div>

      <!-- Grid View / List View Toggle -->
      <div class="flex gap-2 mb-6">
        <button 
          @click="viewMode = 'grid'" 
          :class="['border-2 border-border p-2', viewMode === 'grid' ? 'bg-primary text-background' : 'bg-background text-text']">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button 
          @click="viewMode = 'list'" 
          :class="['border-2 border-border p-2', viewMode === 'list' ? 'bg-primary text-background' : 'bg-background text-text']">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Inventory Items -->
      <div v-if="paginatedItems.length" :class="{'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6': viewMode === 'grid', 'space-y-4': viewMode === 'list'}">
        <item-card 
          v-for="item in paginatedItems" 
          :key="item.id" 
          :item="item" 
          :category-name="getCategoryName(item.category)"
          :category-icon="getCategoryIcon(item.category)"
          :view="viewMode"
          @click="openItemDetails(item)"
          @edit-item="$emit('edit-item', item)"
          @delete-item="$emit('delete-item', item)">
        </item-card>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-16">
        <div class="text-6xl mb-4 text-text-tertiary">¯\\_(ツ)_/¯</div>
        <p class="text-xl mb-2 text-text">No items found</p>
        <p class="text-text-secondary">Try changing your search or filters</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-12 flex justify-center">
        <div class="inline-flex">
          <button 
            v-for="page in paginationPages" 
            :key="page" 
            @click="currentPage = page"
            :class="[
              'px-4 py-2 border-t-2 border-b-2 border-r-2 border-border', 
              page === currentPage ? 'bg-primary text-background font-bold' : 'bg-background text-text',
              page === 1 ? 'border-l-2' : ''
            ]">
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  `,
    props: {
        items: {
            type: Array,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        selectedCategory: {
            type: String,
            default: null
        },
        selectedTags: {
            type: Array,
            default: () => []
        },
        pageSize: {
            type: Number,
            default: 8
        }
    },
    data() {
        return {
            searchQuery: '',
            sortOption: 'newest',
            viewMode: 'grid',
            currentPage: 1
        };
    },
    computed: {
        filteredItems() {
            let result = [...this.items];

            // Filter by category
            if (this.selectedCategory) {
                result = result.filter(item => item.category === this.selectedCategory);
            }

            // Filter by tags (if any selected)
            if (this.selectedTags.length > 0) {
                result = result.filter(item => {
                    return this.selectedTags.every(tagId => item.tags && item.tags.includes(tagId));
                });
            }

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(item => {
                    return (
                        item.name.toLowerCase().includes(query) ||
                        this.getCategoryName(item.category).toLowerCase().includes(query) ||
                        (item.notes && item.notes.toLowerCase().includes(query)) ||
                        (item.serialNumber && item.serialNumber.toLowerCase().includes(query))
                    );
                });
            }

            // Sort items
            switch (this.sortOption) {
                case 'newest':
                    result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                    break;
                case 'oldest':
                    result.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
                    break;
                case 'name_asc':
                    result.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name_desc':
                    result.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'value_asc':
                    result.sort((a, b) => a.value - b.value);
                    break;
                case 'value_desc':
                    result.sort((a, b) => b.value - a.value);
                    break;
            }

            return result;
        },

        // Pagination
        totalPages() {
            return Math.ceil(this.filteredItems.length / this.pageSize);
        },

        paginatedItems() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredItems.slice(start, end);
        },

        paginationPages() {
            // Simplified pagination, just show all pages
            // In a real app, you'd want to limit this for large numbers
            const pages = [];
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
            return pages;
        },

        selectedCategoryName() {
            if (!this.selectedCategory) return null;
            const category = this.categories.find(c => c.id === this.selectedCategory);
            return category ? category.name : null;
        }
    },
    methods: {
        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Uncategorized';
        },
        getCategoryIcon(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.icon : 'box';
        },
        openItemDetails(item) {
            this.$emit('view-item', item);
        }
    },
    watch: {
        // Reset to page 1 when filters change
        searchQuery() {
            this.currentPage = 1;
        },
        sortOption() {
            this.currentPage = 1;
        },
        selectedCategory() {
            this.currentPage = 1;
        },
        selectedTags() {
            this.currentPage = 1;
        }
    },
    created() {
        // Initialize view mode from settings
        this.viewMode = this.$root.settings.defaultView || 'grid';
    }
};

// Export components
window.AppComponents = {
    Navigation,
    Sidebar,
    ItemCard,
    ItemModal,
    AddItemModal,
    CategoryModal,
    TagModal,
    DeleteConfirmModal,
    SettingsComponent,
    StatsComponent,
    DashboardComponent,
    CategoryManagementComponent,
    InventoryComponent,
    // Export utilities
    utils: {
        formatDate,
        formatCurrency,
        ToastService
    }
};