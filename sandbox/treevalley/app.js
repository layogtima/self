// TREE VALLEY - Main Application JavaScript
const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        // State
        const searchQuery = ref('');
        const selectedTree = ref(null);
        const darkMode = ref(false);
        const displayCount = ref(6);
        const trees = ref([]);

        // Quick filter options
        const quickFilters = [
            'HERITAGE', 'FLOWERING', 'MEDICINAL', 'NATIVE', 'TALL GIANTS', 'RARE'
        ];

        // Computed properties
        const filteredTrees = computed(() => {
            if (!searchQuery.value) return trees.value;
            
            const query = searchQuery.value.toLowerCase().trim();
            
            return trees.value.filter(tree => {
                // Search by tree number (with or without #)
                if (query.startsWith('#') || /^\d+$/.test(query)) {
                    const numberQuery = query.replace('#', '');
                    return tree.number.toString().includes(numberQuery);
                }
                
                // Search by name, scientific name, family, characteristics
                return (
                    tree.name.toLowerCase().includes(query) ||
                    tree.scientificName.toLowerCase().includes(query) ||
                    tree.family.toLowerCase().includes(query) ||
                    tree.flowers.toLowerCase().includes(query) ||
                    tree.leaves.toLowerCase().includes(query) ||
                    tree.bark.toLowerCase().includes(query) ||
                    tree.fruit.toLowerCase().includes(query) ||
                    tree.description.toLowerCase().includes(query) ||
                    tree.cultural?.toLowerCase().includes(query) ||
                    tree.uses?.some(use => use.toLowerCase().includes(query)) ||
                    tree.status?.toLowerCase().includes(query) ||
                    tree.origin.toLowerCase().includes(query)
                );
            });
        });

        const displayTrees = computed(() => {
            return filteredTrees.value.slice(0, displayCount.value);
        });

        // Methods
        const handleSearch = () => {
            displayCount.value = 6; // Reset display count on new search
        };

        const clearSearch = () => {
            searchQuery.value = '';
            displayCount.value = 6;
        };

        const applyQuickFilter = (filter) => {
            const filterMap = {
                'HERITAGE': 'heritage',
                'FLOWERING': 'flowers',
                'MEDICINAL': 'medicinal',
                'NATIVE': 'native',
                'TALL GIANTS': 'tall',
                'RARE': 'rare'
            };
            
            searchQuery.value = filterMap[filter] || filter.toLowerCase();
        };

        const loadMore = () => {
            displayCount.value += 6;
        };

        const openTreeDetail = (tree) => {
            selectedTree.value = tree;
            document.body.style.overflow = 'hidden';
        };

        const closeTreeDetail = () => {
            selectedTree.value = null;
            document.body.style.overflow = '';
        };

        // Watch dark mode changes
        watch(darkMode, (newValue) => {
            if (newValue) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('treeValleyDarkMode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('treeValleyDarkMode', 'false');
            }
        });

        // Check system preference for dark mode
        const checkSystemDarkMode = () => {
            const savedMode = localStorage.getItem('treeValleyDarkMode');
            if (savedMode === 'true') {
                darkMode.value = true;
            } else if (savedMode === 'false') {
                darkMode.value = false;
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                darkMode.value = true;
            }
        };

        // Initialize app
        onMounted(() => {
            checkSystemDarkMode();
            
            // Load tree data
            if (window.treeData) {
                trees.value = window.treeData;
            }

            // Close modal on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && selectedTree.value) {
                    closeTreeDetail();
                }
            });

            // Listen for system dark mode changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('treeValleyDarkMode')) {
                    darkMode.value = e.matches;
                }
            });
        });

        return {
            searchQuery,
            selectedTree,
            darkMode,
            trees,
            filteredTrees,
            displayTrees,
            quickFilters,
            handleSearch,
            clearSearch,
            applyQuickFilter,
            loadMore,
            openTreeDetail,
            closeTreeDetail
        };
    }
}).mount('#app');