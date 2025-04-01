/**
 * MONO - Inventory Management System
 * Mock Data Layer
 * 
 * This file contains mock data and persistence functions
 * that simulate an API/ORM layer. In a production environment,
 * this would be replaced with actual API calls.
 */

// Generate a random ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get current date in ISO format
function getCurrentDate() {
    return new Date().toISOString();
}

// Mock Categories Data
const initialCategories = [
    { id: "cat1", name: "ELECTRONICS", icon: "device-laptop" },
    { id: "cat2", name: "BOOKS", icon: "book" },
    { id: "cat3", name: "CLOTHING", icon: "shirt" },
    { id: "cat4", name: "TOOLS", icon: "tool" },
    { id: "cat5", name: "FLOW TOYS", icon: "activity" },
    { id: "cat6", name: "TECH GADGETS", icon: "cpu" }
];

// Mock Tags Data
const initialTags = [
    { id: "tag1", name: "favorite" },
    { id: "tag2", name: "urgent" },
    { id: "tag3", name: "lend" },
    { id: "tag4", name: "repair" },
    { id: "tag5", name: "new" },
    { id: "tag6", name: "insured" },
    { id: "tag7", name: "work" },
    { id: "tag8", name: "personal" },
    { id: "tag9", name: "gift" }
];

// Mock Settings
const initialSettings = {
    theme: "default",
    darkMode: false,
    experimentalFeatures: false,
    assistiveMode: false,
    currency: "₹",
    dateFormat: "DD/MM/YYYY",
    showThumbnails: true,
    defaultView: "grid",
    itemsPerPage: 8
};

// Mock Items Data
const initialItems = [
    {
        id: "item1",
        name: "MacBook Pro",
        category: "cat1",
        value: 120000,
        dateAdded: "2023-08-12T00:00:00.000Z",
        condition: "excellent",
        serialNumber: "FVFXC2AGHP12",
        boughtFrom: "Apple Store, Bengaluru",
        boughtOn: "2022-06-15T00:00:00.000Z",
        notes: "16\" MacBook Pro with M1 Max chip, 64GB RAM, 2TB SSD. Bought in 2022. Includes charger and case.",
        productUrl: "https://www.apple.com/in/macbook-pro/",
        imageUrls: [],
        tags: ["tag1", "tag7", "tag6"],
        lastModified: "2023-08-12T00:00:00.000Z"
    },
    {
        id: "item2",
        name: "iPhone 14 Pro",
        category: "cat1",
        value: 85000,
        dateAdded: "2024-02-28T00:00:00.000Z",
        condition: "excellent",
        serialNumber: "IP14PM512GBBLK",
        boughtFrom: "Croma, Koramangala",
        boughtOn: "2024-02-20T00:00:00.000Z",
        notes: "A16 Bionic, 6GB RAM, 512GB Storage. Space Black color.",
        productUrl: "https://www.apple.com/in/iphone-14-pro/",
        imageUrls: [],
        tags: ["tag1", "tag5"],
        lastModified: "2024-02-28T00:00:00.000Z"
    },
    {
        id: "item3",
        name: "Design Systems Book",
        category: "cat2",
        value: 1800,
        dateAdded: "2023-03-15T00:00:00.000Z",
        condition: "good",
        serialNumber: "ISBN9783945749586",
        boughtFrom: "Amazon",
        boughtOn: "2023-02-10T00:00:00.000Z",
        notes: "By Alla Kholmatova. Great resource for product design.",
        productUrl: "https://www.amazon.in/Design-Systems-Practical-creating-languages/dp/3945749581",
        imageUrls: [],
        tags: ["tag7"],
        lastModified: "2023-03-15T00:00:00.000Z"
    },
    {
        id: "item4",
        name: "LED Smart Hoop",
        category: "cat5",
        value: 12500,
        dateAdded: "2023-11-08T00:00:00.000Z",
        condition: "good",
        serialNumber: "MOODH00P1234",
        boughtFrom: "Supervillains Workshop",
        boughtOn: "2023-10-15T00:00:00.000Z",
        notes: "42\" LED programmable smart hoop with Bluetooth connectivity.",
        productUrl: "https://supervillains.wtf",
        imageUrls: [],
        tags: ["tag1", "tag8"],
        lastModified: "2023-11-08T00:00:00.000Z"
    },
    {
        id: "item5",
        name: "Arduino Starter Kit",
        category: "cat6",
        value: 3500,
        dateAdded: "2024-01-20T00:00:00.000Z",
        condition: "excellent",
        serialNumber: "ARD2024IN001",
        boughtFrom: "Robocraze",
        boughtOn: "2024-01-15T00:00:00.000Z",
        notes: "Contains Arduino UNO, breadboard, LEDs, resistors, and basic components.",
        productUrl: "https://robocraze.com/products/arduino-uno-starter-kit",
        imageUrls: [],
        tags: ["tag5", "tag7"],
        lastModified: "2024-01-20T00:00:00.000Z"
    },
    {
        id: "item6",
        name: "Raspberry Pi Kit",
        category: "cat6",
        value: 5200,
        dateAdded: "2024-02-14T00:00:00.000Z",
        condition: "excellent",
        serialNumber: "RPI4B4GB1234",
        boughtFrom: "Robu.in",
        boughtOn: "2024-02-10T00:00:00.000Z",
        notes: "Raspberry Pi 4 Model B with 4GB RAM, case, power supply, and microSD card.",
        productUrl: "https://robu.in/product/raspberry-pi-4-4gb-starter-kit/",
        imageUrls: [],
        tags: ["tag5", "tag7"],
        lastModified: "2024-02-14T00:00:00.000Z"
    },
    {
        id: "item7",
        name: "SuperSaber Prototype",
        category: "cat5",
        value: 8000,
        dateAdded: "2024-03-25T00:00:00.000Z",
        condition: "prototype",
        serialNumber: "SSABERPRT001",
        boughtFrom: "In-house Development",
        boughtOn: "2024-03-20T00:00:00.000Z",
        notes: "First working prototype of the SuperSaber. RGB controls, accelerometer integration.",
        productUrl: "https://supervillains.wtf",
        imageUrls: [],
        tags: ["tag5", "tag7", "tag2"],
        lastModified: "2024-03-25T00:00:00.000Z"
    },
    {
        id: "item8",
        name: "Lampy 3D Prototype",
        category: "cat6",
        value: 2500,
        dateAdded: "2024-03-18T00:00:00.000Z",
        condition: "prototype",
        serialNumber: "LAMPY3D001",
        boughtFrom: "In-house Development",
        boughtOn: "2024-03-15T00:00:00.000Z",
        notes: "3D printed mood lamp prototype with ESP32 controller and addressable LEDs.",
        productUrl: "",
        imageUrls: [],
        tags: ["tag5", "tag7", "tag2"],
        lastModified: "2024-03-18T00:00:00.000Z"
    }
];

// LocalStorage Keys
const STORAGE_KEYS = {
    CATEGORIES: 'mono_categories',
    TAGS: 'mono_tags',
    ITEMS: 'mono_items',
    SETTINGS: 'mono_settings',
    USER: 'mono_user'
};

// Storage Adapter - This layer abstracts localStorage
// and could be replaced with actual API calls
const StorageAdapter = {
    // Initialize data if not present
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
        }

        if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
            localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(initialTags));
        }

        if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(initialItems));
        }

        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
        }
    },

    // Generic CRUD operations
    getAll(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            console.error(`Error retrieving data from ${key}`, e);
            return [];
        }
    },

    getById(key, id) {
        try {
            const items = JSON.parse(localStorage.getItem(key)) || [];
            return items.find(item => item.id === id);
        } catch (e) {
            console.error(`Error retrieving item with id ${id} from ${key}`, e);
            return null;
        }
    },

    add(key, item) {
        try {
            const items = JSON.parse(localStorage.getItem(key)) || [];
            const newItem = { ...item, id: item.id || generateId() };
            items.push(newItem);
            localStorage.setItem(key, JSON.stringify(items));
            return newItem;
        } catch (e) {
            console.error(`Error adding item to ${key}`, e);
            throw e;
        }
    },

    update(key, item) {
        try {
            const items = JSON.parse(localStorage.getItem(key)) || [];
            const index = items.findIndex(i => i.id === item.id);

            if (index === -1) {
                throw new Error(`Item with id ${item.id} not found in ${key}`);
            }

            items[index] = { ...items[index], ...item, lastModified: getCurrentDate() };
            localStorage.setItem(key, JSON.stringify(items));
            return items[index];
        } catch (e) {
            console.error(`Error updating item in ${key}`, e);
            throw e;
        }
    },

    remove(key, id) {
        try {
            const items = JSON.parse(localStorage.getItem(key)) || [];
            const filtered = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error(`Error removing item from ${key}`, e);
            throw e;
        }
    },

    // Settings specific operations
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || initialSettings;
        } catch (e) {
            console.error("Error retrieving settings", e);
            return initialSettings;
        }
    },

    updateSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
            return updatedSettings;
        } catch (e) {
            console.error("Error updating settings", e);
            throw e;
        }
    }
};

// Data Service - This is the interface that the app uses
const DataService = {
    // Initialize data
    initialize() {
        StorageAdapter.init();
        return {
            categories: this.getCategories(),
            tags: this.getTags(),
            settings: this.getSettings()
        };
    },

    // Category operations
    getCategories() {
        return StorageAdapter.getAll(STORAGE_KEYS.CATEGORIES);
    },

    getCategoryById(id) {
        return StorageAdapter.getById(STORAGE_KEYS.CATEGORIES, id);
    },

    addCategory(category) {
        return StorageAdapter.add(STORAGE_KEYS.CATEGORIES, category);
    },

    updateCategory(category) {
        return StorageAdapter.update(STORAGE_KEYS.CATEGORIES, category);
    },

    removeCategory(id) {
        // First check if any items use this category
        const items = this.getItems();
        const hasItems = items.some(item => item.category === id);

        if (hasItems) {
            throw new Error("Cannot delete category that has items. Reassign or delete the items first.");
        }

        return StorageAdapter.remove(STORAGE_KEYS.CATEGORIES, id);
    },

    // Tag operations
    getTags() {
        return StorageAdapter.getAll(STORAGE_KEYS.TAGS);
    },

    getTagById(id) {
        return StorageAdapter.getById(STORAGE_KEYS.TAGS, id);
    },

    addTag(tag) {
        return StorageAdapter.add(STORAGE_KEYS.TAGS, tag);
    },

    updateTag(tag) {
        return StorageAdapter.update(STORAGE_KEYS.TAGS, tag);
    },

    removeTag(id) {
        // Remove tag from all items that have it
        const items = this.getItems();

        items.forEach(item => {
            if (item.tags.includes(id)) {
                const updatedTags = item.tags.filter(tagId => tagId !== id);
                this.updateItem({ ...item, tags: updatedTags });
            }
        });

        return StorageAdapter.remove(STORAGE_KEYS.TAGS, id);
    },

    // Item operations
    getItems() {
        return StorageAdapter.getAll(STORAGE_KEYS.ITEMS);
    },

    getItemById(id) {
        return StorageAdapter.getById(STORAGE_KEYS.ITEMS, id);
    },

    addItem(item) {
        const newItem = {
            ...item,
            dateAdded: getCurrentDate(),
            lastModified: getCurrentDate(),
            tags: item.tags || []
        };

        return StorageAdapter.add(STORAGE_KEYS.ITEMS, newItem);
    },

    updateItem(item) {
        return StorageAdapter.update(STORAGE_KEYS.ITEMS, item);
    },

    removeItem(id) {
        return StorageAdapter.remove(STORAGE_KEYS.ITEMS, id);
    },

    // Settings operations
    getSettings() {
        return StorageAdapter.getSettings();
    },

    updateSettings(settings) {
        return StorageAdapter.updateSettings(settings);
    },

    // Stats operations
    getStats() {
        const items = this.getItems();
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);

        // Get the most recent item
        const sortedItems = [...items].sort((a, b) => {
            return new Date(b.dateAdded) - new Date(a.dateAdded);
        });

        const lastAdded = sortedItems.length > 0 ? sortedItems[0] : null;

        // Get value by category
        const categories = this.getCategories();
        const valueByCategory = categories.map(category => {
            const categoryItems = items.filter(item => item.category === category.id);
            const value = categoryItems.reduce((sum, item) => sum + (item.value || 0), 0);
            return {
                id: category.id,
                name: category.name,
                value,
                count: categoryItems.length
            };
        });

        return {
            totalItems,
            totalValue,
            lastAdded,
            valueByCategory
        };
    }
};

// Initialize data when the script loads
window.DataService = DataService;