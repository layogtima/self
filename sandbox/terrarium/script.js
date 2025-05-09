// Component Templates
const NavBarTemplate = `
  <div class="bg-foggy-white flex justify-around items-center py-4 border-t border-gray-200">
    <div class="flex flex-col items-center" :class="activeIcon === 'home' ? 'text-dewdrop-gold' : 'text-gray-400'">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span class="text-xs mt-1">Home</span>
    </div>
    <div class="flex flex-col items-center" :class="activeIcon === 'explore' ? 'text-dewdrop-gold' : 'text-gray-400'">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span class="text-xs mt-1">Explore</span>
    </div>
    <div class="flex flex-col items-center" :class="activeIcon === 'care' ? 'text-dewdrop-gold' : 'text-gray-400'">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span class="text-xs mt-1">Care</span>
    </div>
    <div class="flex flex-col items-center" :class="activeIcon === 'ar' ? 'text-dewdrop-gold' : 'text-gray-400'">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-xs mt-1">AR</span>
    </div>
  </div>
`;

const ContainerOptionTemplate = `
  <div class="bg-dewdrop-gold bg-opacity-30 rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-opacity-50 transition-all duration-300 plant-hover-effect"
       @click="selectContainer(container)">
    <div class="w-12 h-12 bg-foggy-white rounded-full flex items-center justify-center mb-2">
      <div v-html="container.icon"></div>
    </div>
    <span class="text-xs text-center">{{ container.name }}</span>
  </div>
`;

const SubstrateOptionTemplate = `
  <div class="bg-dewdrop-gold bg-opacity-30 rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-opacity-50 transition-all duration-300 plant-hover-effect"
       @click="selectSubstrate(substrate)">
    <div class="w-12 h-12 bg-foggy-white rounded-full flex items-center justify-center mb-2">
      <div v-html="substrate.icon"></div>
    </div>
    <span class="text-xs text-center">{{ substrate.name }}</span>
  </div>
`;

const PlantOptionTemplate = `
  <div class="bg-dewdrop-gold bg-opacity-30 rounded-lg p-3 cursor-pointer hover:bg-opacity-50 transition-all duration-300 plant-hover-effect"
       @click="selectPlant(plant)">
    <div class="flex items-center">
      <div class="w-10 h-10 bg-foggy-white rounded-full flex items-center justify-center mr-3">
        <div v-html="plant.icon"></div>
      </div>
      <div class="flex-1">
        <div class="font-medium">{{ plant.name }}</div>
        <div class="text-xs flex items-center">
          <span>{{ plant.lightNeeds }}</span>
          <div v-html="plant.lightIcon" class="ml-1"></div>
        </div>
      </div>
    </div>
  </div>
`;

const CareCardTemplate = `
  <div class="bg-dewdrop-gold bg-opacity-30 rounded-xl p-4 fade-in">
    <div class="flex justify-between items-start mb-2">
      <h3 class="playfair text-xl text-sap-green">{{ card.title }}</h3>
      <div :class="difficultyClasses">{{ card.difficulty }}</div>
    </div>
    <p class="text-sm mb-3">{{ card.description }}</p>
    <div class="flex justify-end">
      <div class="rounded-full bg-foggy-white p-2">
        <div v-html="card.icon"></div>
      </div>
    </div>
  </div>
`;

// Register Vue components
const app = Vue.createApp({
    data() {
        return {
            activeScreen: 'welcome',
            selectedContainer: null,
            selectedSubstrate: null,
            selectedPlants: [],

            // Data for containers
            containers: [
                {
                    id: 'round',
                    name: 'Round',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8" fill="none" stroke="#708B75">
                  <ellipse cx="12" cy="16" rx="8" ry="4" />
                  <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                </svg>`,
                    description: 'Perfect for small plants and desk spaces'
                },
                {
                    id: 'wide',
                    name: 'Wide',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8" fill="none" stroke="#708B75">
                  <rect x="8" y="10" width="8" height="10" rx="1" />
                  <path d="M8 13h8" />
                </svg>`,
                    description: 'Ideal for multiple plants and larger arrangements'
                },
                {
                    id: 'tall',
                    name: 'Tall',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8" fill="none" stroke="#708B75">
                  <rect x="9" y="8" width="6" height="12" rx="1" />
                  <path d="M9 11h6" />
                </svg>`,
                    description: 'Great for taller plants and vertical growth'
                }
            ],

            // Data for substrates
            substrates: [
                {
                    id: 'pebbles',
                    name: 'Pebbles',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8" fill="none">
                  <circle cx="8" cy="14" r="2" fill="#D9A06B" />
                  <circle cx="12" cy="12" r="1.5" fill="#D9A06B" />
                  <circle cx="16" cy="14" r="2" fill="#D9A06B" />
                  <circle cx="10" cy="16" r="1.5" fill="#D9A06B" />
                  <circle cx="14" cy="16" r="1" fill="#D9A06B" />
                </svg>`,
                    description: 'Provides excellent drainage and decorative finish'
                },
                {
                    id: 'charcoal',
                    name: 'Charcoal',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8">
                  <path d="M8 12c2-2 4 2 8 0c-2 4 -4 6 -8 0z" fill="#4B5563" />
                </svg>`,
                    description: 'Filters impurities and prevents bacterial growth'
                },
                {
                    id: 'soil',
                    name: 'Soil',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8">
                  <path d="M7 14c3-0.5 7-0.5 10 0c-1 2-9 2-10 0z" fill="#8B5E3C" />
                </svg>`,
                    description: 'Provides nutrients and anchoring for plant roots'
                }
            ],

            // Data for plants
            plants: [
                {
                    id: 'snake',
                    name: 'Snake Plant',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none">
                  <path d="M12 6c2 4 0 8-2 10c-2-2-4-6-2-10c2 0 4 0 4 0z" fill="#708B75" />
                </svg>`,
                    lightNeeds: 'Low Light',
                    lightIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-sun-dried-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="5" fill="currentColor" />
                    </svg>`,
                    waterNeeds: 'Low',
                    difficulty: 'Easy',
                    description: 'Nearly indestructible, perfect for beginners'
                },
                {
                    id: 'fern',
                    name: 'Maidenhair Fern',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none">
                  <path d="M12 6c3 2 3 8 0 10c-3-2-3-8 0-10z" fill="#708B75" />
                  <path d="M9 8c2 1 2 7 0 8M15 8c-2 1-2 7 0 8" fill="none" stroke="#708B75" />
                </svg>`,
                    lightNeeds: 'Medium Light',
                    lightIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-sun-dried-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="5" fill="currentColor" />
                      <circle cx="12" cy="12" r="3" fill="#F4E58C" />
                    </svg>`,
                    waterNeeds: 'High',
                    difficulty: 'Moderate',
                    description: 'Delicate fronds require consistent moisture'
                },
                {
                    id: 'venus',
                    name: 'Venus Flytrap',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none">
                  <path d="M12 7c4 2 4 8 0 10M12 7c-4 2-4 8 0 10" stroke="#708B75" stroke-width="1.5" />
                  <circle cx="12" cy="7" r="1" fill="#708B75" />
                </svg>`,
                    lightNeeds: 'High Light',
                    lightIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-sun-dried-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="5" fill="currentColor" />
                      <circle cx="12" cy="12" r="3" fill="#F4E58C" />
                      <circle cx="12" cy="12" r="1" fill="white" />
                    </svg>`,
                    waterNeeds: 'Medium',
                    difficulty: 'Advanced',
                    description: 'Carnivorous plant that catches small insects'
                },
                {
                    id: 'moss',
                    name: 'Sheet Moss',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6" fill="none">
                  <path d="M8 12c0 2 2 4 4 4s4-2 4-4" fill="#708B75" />
                  <path d="M7 12c1-1 2 0 3 0s2-1 3-1 2 1 3 1 1-1 2 0" stroke="#708B75" stroke-width="1" />
                </svg>`,
                    lightNeeds: 'Low to Medium',
                    lightIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-sun-dried-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="5" fill="currentColor" />
                      <circle cx="12" cy="12" r="2" fill="#F4E58C" />
                    </svg>`,
                    waterNeeds: 'Medium',
                    difficulty: 'Easy',
                    description: 'Creates a lush carpet effect, holds moisture well'
                }
            ],

            // Data for care cards
            careCards: [
                {
                    id: 'water',
                    title: 'Water Me Maybe',
                    difficulty: 'Easy',
                    description: 'Keep soil moistt but not waterlogged. Once every 1-2 weeks is usually sufficient.',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19c-4 0-7-3-7-7 0-2.3 2-5 4-7 .6-.6 1.4-.6 2 0 2 2 4 4.7 4 7 0 4-3 7-7 7z" />
                </svg>`,
                },
                {
                    id: 'leaves',
                    title: 'Leafy Love',
                    difficulty: 'Caution',
                    description: 'Remove yellow or damaged leaves promptly to prevent diseases. Use sterilized scissors.',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6c2 4 0 8-2 10c-2-2-4-6-2-10c2 0 4 0 4 0z" />
                </svg>`,
                },
                {
                    id: 'sunlight',
                    title: 'Sunlight Shenanigans',
                    difficulty: 'Rare',
                    description: 'Locate near bright, indirect light. Avoid harsh direct sunlight which can scorch leaves.',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="5" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>`,
                },
                {
                    id: 'humidity',
                    title: 'Moisture Magic',
                    difficulty: 'Moderate',
                    description: 'Most terrarium plants thrive in humidity of 50-70%. Mist occasionally if your terrarium is open.',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19c-4 0-7-3-7-7 0-2.3 2-5 4-7 .6-.6 1.4-.6 2 0 2 2 4 4.7 4 7 0 4-3 7-7 7z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14c0-2 2-4 4-4s4 2 4 4" stroke-dasharray="1,2" />
                </svg>`,
                },
                {
                    id: 'cleaning',
                    title: 'Glass Gleaming',
                    difficulty: 'Easy',
                    description: 'Clean glass with a microfiber cloth and mild vinegar solution. Avoid harsh chemicals.',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6M9 9l6 6" />
                </svg>`,
                }
            ]
        }
    },
    computed: {
        terrariumComplete() {
            return this.selectedContainer && this.selectedSubstrate && this.selectedPlants.length > 0;
        }
    },
    methods: {
        selectContainer(container) {
            this.selectedContainer = container;
            // Add visual feedback
            this.showToast(`Selected ${container.name} container`);
        },
        selectSubstrate(substrate) {
            this.selectedSubstrate = substrate;
            // Add visual feedback
            this.showToast(`Added ${substrate.name} to your terrarium`);
        },
        selectPlant(plant) {
            if (!this.selectedPlants.some(p => p.id === plant.id)) {
                this.selectedPlants.push(plant);
                // Add visual feedback
                this.showToast(`Added ${plant.name} to your design`);
            } else {
                // Remove plant if already selected
                this.selectedPlants = this.selectedPlants.filter(p => p.id !== plant.id);
                this.showToast(`Removed ${plant.name} from your design`);
            }
        },
        showToast(message) {
            // Implementation for toast notifications
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-sap-green text-white px-4 py-2 rounded-full text-sm opacity-0 transition-opacity duration-300';
            toast.textContent = message;
            document.body.appendChild(toast);

            // Fade in
            setTimeout(() => {
                toast.classList.remove('opacity-0');
                toast.classList.add('opacity-90');
            }, 10);

            // Fade out and remove
            setTimeout(() => {
                toast.classList.remove('opacity-90');
                toast.classList.add('opacity-0');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        },

        // Add moss trail effect (purely decorative)
        initMossTrail() {
            if (typeof document !== 'undefined') {
                const maxDots = 10;
                const dots = [];
                let mouseX = 0;
                let mouseY = 0;

                document.addEventListener('mousemove', (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;

                    // Create a new dot
                    const dot = document.createElement('div');
                    dot.className = 'moss-trail';
                    dot.style.left = `${mouseX}px`;
                    dot.style.top = `${mouseY}px`;
                    document.body.appendChild(dot);
                    dots.push(dot);

                    // Fade out and remove old dots
                    if (dots.length > maxDots) {
                        const oldDot = dots.shift();
                        oldDot.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(oldDot);
                        }, 800);
                    }
                });
            }
        },

        // Simulate environment transitions (day/night cycle)
        initDayNightCycle() {
            const hours = new Date().getHours();
            const isDaytime = hours >= 6 && hours < 18;

            const root = document.documentElement;

            if (!isDaytime) {
                // Night mode colors
                root.style.setProperty('--bg-color', '#232936');
                root.style.setProperty('--text-color', '#F5F3EB');
                document.body.classList.add('night-mode');
            }

            // Transition between day and night every 60 seconds for demo purposes
            setInterval(() => {
                document.body.classList.toggle('night-mode');
                if (document.body.classList.contains('night-mode')) {
                    root.style.setProperty('--bg-color', '#232936');
                    root.style.setProperty('--text-color', '#F5F3EB');
                } else {
                    root.style.setProperty('--bg-color', '#F5F3EB');
                    root.style.setProperty('--text-color', '#333');
                }
            }, 60000);
        }
    },
    mounted() {
        // Initialize decorative effects
        this.initMossTrail();

        // Check if the user has system preference for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            // Only initialize animations if user doesn't prefer reduced motion
            // this.initDayNightCycle(); // Uncomment for production
        }

        // Check if the user has visited before
        const hasVisited = localStorage.getItem('hasVisitedMossCode');
        if (!hasVisited) {
            // Show welcome tooltip
            this.showToast('Welcome to MossCode! Design your perfect terrarium 🌿');
            localStorage.setItem('hasVisitedMossCode', 'true');
        }
    }
});

// Register components
app.component('nav-bar', {
    props: {
        activeIcon: {
            type: String,
            default: 'home'
        }
    },
    template: NavBarTemplate
});

app.component('container-option', {
    props: {
        container: {
            type: Object,
            required: true
        }
    },
    methods: {
        selectContainer(container) {
            this.$parent.selectContainer(container);
        }
    },
    template: ContainerOptionTemplate
});

app.component('substrate-option', {
    props: {
        substrate: {
            type: Object,
            required: true
        }
    },
    methods: {
        selectSubstrate(substrate) {
            this.$parent.selectSubstrate(substrate);
        }
    },
    template: SubstrateOptionTemplate
});

app.component('plant-option', {
    props: {
        plant: {
            type: Object,
            required: true
        }
    },
    methods: {
        selectPlant(plant) {
            this.$parent.selectPlant(plant);
        }
    },
    template: PlantOptionTemplate
});

app.component('care-card', {
    props: {
        card: {
            type: Object,
            required: true
        }
    },
    computed: {
        difficultyClasses() {
            const classes = 'px-3 py-1 rounded-full text-xs font-medium';
            switch (this.card.difficulty) {
                case 'Easy':
                    return `${classes} bg-dewdrop-gold text-sap-green`;
                case 'Moderate':
                    return `${classes} bg-sun-dried-clay text-white`;
                case 'Caution':
                    return `${classes} bg-sun-dried-clay text-white`;
                case 'Rare':
                    return `${classes} bg-sunset-ember text-white`;
                default:
                    return `${classes} bg-gray-200 text-gray-800`;
            }
        }
    },
    template: CareCardTemplate
});

// Mount the app
app.mount('#app');

// Add event listeners for progressive enhancement
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser support of various features
    const supportsWebP = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;

    if (supportsWebP) {
        document.body.classList.add('webp-support');
    }

    // Add smooth scrolling for care guide
    const careLinks = document.querySelectorAll('.care-link');
    careLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});