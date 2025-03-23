// MONO Materials App

const { createApp, ref, computed, onMounted, onUnmounted, watch } = Vue;

createApp({
    setup() {
        // State
        const loading = ref(true);
        const loadingMessage = ref('ANALYZING MATERIALS');
        const loadingMessages = [
            'ANALYZING MATERIALS',
            'CALCULATING DENSITIES',
            'MEASURING TENSILE STRENGTH',
            'CALIBRATING PROPERTIES',
            'SORTING BY USAGE'
        ];
        const materials = ref([]);
        const categories = ref([]);
        const activeCategory = ref('all');
        const sortBy = ref('rank');
        const selectedMaterial = ref(null);
        const showCategoryMenu = ref(false);

        // Leaderboard State
        const materialProduction = ref({});
        const totalProducedSincePageLoad = ref(0);
        const startTime = ref(new Date());

        // Load materials data
        const loadMaterialsData = async () => {
            try {
                cycleLoadingMessages();
                const response = await fetch('./material-data.json');
                const data = await response.json();
                materials.value = data.materials;
                categories.value = data.categories;

                // Initialize production counters
                initializeProductionCounters();

                // Simulate loading for aesthetic purposes
                setTimeout(() => {
                    loading.value = false;

                    // Start the production simulation
                    startProductionSimulation();
                }, 1800);
            } catch (error) {
                console.error('Error loading materials data:', error);
                loading.value = false;
            }
        };

        // Initialize production counters for leaderboard
        const initializeProductionCounters = () => {
            materials.value.forEach(material => {
                materialProduction.value[material.id] = 0;
            });
        };

        // Start production simulation
        const startProductionSimulation = () => {
            // Update every second
            setInterval(() => {
                materials.value.forEach(material => {
                    const amountPerSecond = getProductionPerSecond(material);
                    materialProduction.value[material.id] += amountPerSecond;
                    totalProducedSincePageLoad.value += amountPerSecond;
                });
            }, 1000);
        };

        // Calculate production per second based on annual production
        const getProductionPerSecond = (material) => {
            // Extract numeric part from annual production string
            const productionStr = material.annualProduction;
            let numericPart;

            if (productionStr.includes('billion')) {
                numericPart = parseFloat(productionStr) * 1_000_000_000;
            } else if (productionStr.includes('million')) {
                numericPart = parseFloat(productionStr) * 1_000_000;
            } else if (productionStr.includes('cubic meters')) {
                // Convert cubic meters to kg (rough approximation)
                numericPart = parseFloat(productionStr) * 1_000_000 * 1000;
            } else {
                numericPart = parseFloat(productionStr) * 1_000;
            }

            // Convert annual to per second
            return numericPart / (365 * 24 * 60 * 60);
        };

        // Get production per minute for UI display
        const getProductionPerMinute = (material) => {
            return getProductionPerSecond(material) * 60;
        };

        // Get total production per minute
        const getTotalProductionPerMinute = () => {
            let total = 0;
            materials.value.forEach(material => {
                total += getProductionPerMinute(material);
            });
            return total;
        };

        // Calculate impact percentage (for visualization)
        const getImpactPercentage = () => {
            // This represents how much of the progress bar should be filled
            // We'll use a logarithmic scale since real numbers will be huge
            const max = 1_000_000_000; // 1 billion kg
            const percentage = Math.min((totalProducedSincePageLoad.value / max) * 100, 100);
            return percentage;
        };

        // Cycle through loading messages for aesthetic effect
        const cycleLoadingMessages = () => {
            let index = 0;
            const interval = setInterval(() => {
                index = (index + 1) % loadingMessages.length;
                loadingMessage.value = loadingMessages[index];

                if (!loading.value) {
                    clearInterval(interval);
                }
            }, 400);
        };

        // Filtered materials based on active category
        const filteredMaterials = computed(() => {
            if (activeCategory.value === 'all') {
                return materials.value;
            }
            return materials.value.filter(material => material.category === activeCategory.value);
        });

        // Sort materials based on chosen sort method
        const sortedMaterials = computed(() => {
            const sorted = [...filteredMaterials.value];

            switch (sortBy.value) {
                case 'name':
                    return sorted.sort((a, b) => a.name.localeCompare(b.name));
                case 'sustainability':
                    return sorted.sort((a, b) => b.properties.sustainability - a.properties.sustainability);
                case 'recyclability':
                    return sorted.sort((a, b) => b.properties.recyclability - a.properties.recyclability);
                case 'cost':
                    return sorted.sort((a, b) => a.properties.cost - b.properties.cost);
                case 'rank':
                default:
                    return sorted.sort((a, b) => a.rank - b.rank);
            }
        });

        // Get top materials for leaderboard
        const topMaterials = computed(() => {
            return [...materials.value]
                .sort((a, b) => {
                    // Sort by annual production (estimated from string)
                    const aProduction = getProductionPerSecond(a);
                    const bProduction = getProductionPerSecond(b);
                    return bProduction - aProduction;
                })
                .slice(0, 5); // Top 5
        });

        // Set active category
        const setActiveCategory = (categoryId) => {
            activeCategory.value = categoryId;
            showCategoryMenu.value = false;
            // Scroll to materials section if on mobile
            if (window.innerWidth < 768) {
                document.getElementById('materials').scrollIntoView({ behavior: 'smooth' });
            }
        };

        // Mobile menu functions
        const toggleCategoryMenu = () => {
            showCategoryMenu.value = !showCategoryMenu.value;
        };

        const selectMobileCategory = (categoryId) => {
            setActiveCategory(categoryId);
        };

        // Reset filters
        const resetFilters = () => {
            activeCategory.value = 'all';
            sortBy.value = 'rank';
        };

        // Get category name by ID
        const getCategoryName = (categoryId) => {
            const category = categories.value.find(cat => cat.id === categoryId);
            return category ? category.name : 'All';
        };

        // Material detail modal functions
        const openMaterialDetail = (material) => {
            selectedMaterial.value = material;
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        const closeMaterialDetail = () => {
            selectedMaterial.value = null;
            document.body.style.overflow = ''; // Restore scrolling
        };

        // Number formatting functions
        const formatNumber = (number) => {
            if (number === undefined || number === null) return '0';

            if (number >= 1_000_000_000_000) {
                return (number / 1_000_000_000_000).toFixed(2) + ' trillion';
            }
            if (number >= 1_000_000_000) {
                return (number / 1_000_000_000).toFixed(2) + ' billion';
            }
            if (number >= 1_000_000) {
                return (number / 1_000_000).toFixed(2) + ' million';
            }
            if (number >= 1_000) {
                return (number / 1_000).toFixed(2) + ' thousand';
            }

            return number.toFixed(2);
        };

        const formatNumberWithCommas = (number) => {
            if (number === undefined || number === null) return '0';

            return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        // Close modal on escape key
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && selectedMaterial.value) {
                closeMaterialDetail();
            }
        };

        // Close category menu when clicking outside (for mobile)
        const handleClickOutside = (event) => {
            if (showCategoryMenu.value && !event.target.closest('button')) {
                showCategoryMenu.value = false;
            }
        };

        // Smooth scroll to sections
        const setupSmoothScroll = () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();

                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });

                        // Close mobile menu if open
                        showCategoryMenu.value = false;
                    }
                });
            });
        };

        // Set up event listeners
        onMounted(() => {
            loadMaterialsData();
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('click', handleClickOutside);
            setupSmoothScroll();
        });

        // Clean up event listeners
        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
        });

        // Watch for window width changes to handle mobile menu
        watch(() => window.innerWidth, (newWidth) => {
            if (newWidth >= 768) {
                showCategoryMenu.value = false;
            }
        });

        // Expose to template
        return {
            loading,
            loadingMessage,
            materials,
            categories,
            activeCategory,
            sortBy,
            filteredMaterials,
            sortedMaterials,
            selectedMaterial,
            showCategoryMenu,
            materialProduction,
            totalProducedSincePageLoad,
            topMaterials,
            setActiveCategory,
            toggleCategoryMenu,
            selectMobileCategory,
            resetFilters,
            getCategoryName,
            openMaterialDetail,
            closeMaterialDetail,
            getProductionPerMinute,
            getTotalProductionPerMinute,
            getImpactPercentage,
            formatNumber,
            formatNumberWithCommas
        };
    }
}).mount('#app');