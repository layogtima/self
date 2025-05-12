// Plant Timeline Application
const { createApp, ref, onMounted, watch } = Vue;

createApp({
  setup() {
    // UI state
    const mobileNavOpen = ref(false);
    const showContextPanel = ref(false);

    // Plant evolution features to track across timeline
    const evolutionaryFeatures = [
      { id: 'photosynthesis', name: 'Photosynthesis' },
      { id: 'multicellular', name: 'Multicellular Structure' },
      { id: 'vascular', name: 'Vascular System' },
      { id: 'roots', name: 'True Roots' },
      { id: 'seeds', name: 'Seeds' },
      { id: 'pollen', name: 'Pollen' },
      { id: 'flowers', name: 'Flowers' },
      { id: 'fruits', name: 'Fruits' }
    ];

    // Main categories for navigation
    const mainCategories = ref([
      { id: 'algae', name: 'Algae' },
      { id: 'bryophytes', name: 'Bryophytes' },
      { id: 'ferns', name: 'Ferns' },
      { id: 'gymnosperms', name: 'Gymnosperms' },
      { id: 'monocots', name: 'Monocots' },
      { id: 'eudicots', name: 'Eudicots' }
    ]);

    // Historical context data
    const historicalContext = ref([
      {
        period: "3.5 - 1.5 Billion Years Ago",
        plantEvents: [
          "First photosynthetic bacteria appear (3.4 billion years ago)",
          "Cyanobacteria begin producing oxygen (2.7 billion years ago)",
          "Red and green algae emerge (1.5 billion years ago)"
        ],
        worldEvents: [
          "Earth forms (4.5 billion years ago)",
          "Earliest evidence of life appears (3.7 billion years ago)",
          "Great Oxygenation Event begins (2.4-2.0 billion years ago)",
          "First eukaryotic cells evolve (1.8 billion years ago)"
        ]
      },
      {
        period: "500 - 360 Million Years Ago",
        plantEvents: [
          "Plants begin colonizing land (470 million years ago)",
          "First vascular plants appear (430 million years ago)",
          "First forests form (385 million years ago)",
          "Giant club mosses and horsetails dominate (Carboniferous period)"
        ],
        worldEvents: [
          "Sharks appear (420 million years ago) - before trees!",
          "First insects evolve (400 million years ago)",
          "First amphibians move onto land (360 million years ago)",
          "Atmospheric oxygen reaches record high levels (35%)"
        ]
      },
      {
        period: "360 - 250 Million Years Ago",
        plantEvents: [
          "First seed plants appear (360 million years ago)",
          "Coal-forming forests flourish (Carboniferous period)",
          "Conifers begin to dominate (290 million years ago)",
          "Mass extinction wipes out many plant species (252 million years ago)"
        ],
        worldEvents: [
          "Pangaea supercontinent forms (335 million years ago)",
          "Reptiles evolve and diversify (310 million years ago)",
          "Permian extinction wipes out 95% of all species (252 million years ago)"
        ]
      },
      {
        period: "250 - 65 Million Years Ago",
        plantEvents: [
          "Cycads and ginkgoes flourish (Triassic period)",
          "First flowering plants appear (140 million years ago)",
          "Rapid diversification of angiosperms (100 million years ago)",
          "Modern plant families begin to appear (70 million years ago)"
        ],
        worldEvents: [
          "Dinosaurs evolve and dominate (230 million years ago)",
          "First mammals appear (220 million years ago)",
          "Pangaea begins breaking apart (200 million years ago)",
          "Dinosaurs go extinct in mass extinction (65 million years ago)"
        ]
      },
      {
        period: "65 Million Years Ago - Present",
        plantEvents: [
          "Grasses evolve and spread (55 million years ago)",
          "Modern rainforests form (40 million years ago)",
          "C4 photosynthesis evolves (30 million years ago)",
          "Ice ages drive plant adaptations (2.6 million years ago)"
        ],
        worldEvents: [
          "Mammals diversify into modern forms",
          "Primates evolve, leading to humans (65-7 million years ago)",
          "Humans begin agriculture (12,000 years ago)",
          "Human activities cause sixth mass extinction (present)"
        ]
      }
    ]);

    // Mind-blowing plant facts
    const mindBlowingFacts = ref([
      "Sharks existed before trees! While sharks appeared around 420 million years ago, the first true trees didn't evolve until 385 million years ago.",
      "Plants are responsible for creating Earth's oxygen-rich atmosphere. The Great Oxygenation Event 2.4 billion years ago was driven by photosynthetic cyanobacteria.",
      "The world's oldest living individual tree is a Great Basin bristlecone pine named Methuselah, which is over 4,850 years old.",
      "The Carboniferous period (359-299 million years ago) created most of Earth's coal deposits from giant fern forests.",
      "The world's largest flower, Rafflesia arnoldii, can grow up to 3 feet across and smells like rotting flesh to attract pollinators.",
      "During the age of dinosaurs, flowering plants (angiosperms) evolved and diversified so rapidly that Charles Darwin called it 'an abominable mystery.'",
      "Some trees communicate and share resources through underground fungal networks sometimes called the 'Wood Wide Web'.",
      "Plants came to land about 100 million years before animals did, creating the ecosystems that made animal terrestrial life possible."
    ]);

    // Plant timeline data
    const plantData = ref([
      {
        id: 'algae',
        name: 'Algae',
        period: '3.5 BILLION YEARS AGO',
        description: "The first photosynthetic organisms, providing the foundation for plant evolution and generating oxygen that transformed Earth's atmosphere.",
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: false },
          { name: 'Vascular System', present: false },
          { name: 'True Roots', present: false },
          { name: 'Seeds', present: false },
          { name: 'Pollen', present: false },
          { name: 'Flowers', present: false },
          { name: 'Fruits', present: false }
        ],
        funFact: "Ancient algae were responsible for the Great Oxygenation Event about 2.4-2.0 billion years ago, which transformed Earth's atmosphere and made complex life possible.",
        tags: ['Primitive', 'Aquatic', 'Photosynthetic'],
        plants: [
          { 
            name: 'Red Algae', 
            scientific: 'Rhodophyta',
            image: 'https://cdn.britannica.com/83/118083-050-E1746ED2/Red-algae.jpg'
          },
          { 
            name: 'Green Algae', 
            scientific: 'Chlorophyta',
            image: 'https://plantlet.org/wp-content/uploads/2019/05/104207684-microscopic-view-of-green-algae-cladophora-visible-also-diatoms-cells-darkfield-illumination--660x330.jpg'
          }
        ]
      },
      {
        id: 'bryophytes',
        name: 'Bryophytes',
        period: '470 MILLION YEARS AGO',
        description: 'The first land plants, lacking vascular tissues and true roots. They mark the transition from aquatic to terrestrial life for plants.',
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: true },
          { name: 'Vascular System', present: false },
          { name: 'True Roots', present: false },
          { name: 'Seeds', present: false },
          { name: 'Pollen', present: false },
          { name: 'Flowers', present: false },
          { name: 'Flowers', present: false },
          { name: 'Fruits', present: false }
        ],
        funFact: "Bryophytes like moss can survive being completely dried out for years and then spring back to life when rehydrated. They're basically the zombie plants of the botanical world!",
        tags: ['Non-vascular', 'Land Pioneers', 'Reproductive'],
        plants: [
          { 
            name: 'Mosses', 
            scientific: 'Bryophyta',
            image: 'https://images.squarespace-cdn.com/content/v1/52668d02e4b0f593739ec2b6/1382627466631-KHYZBRRXC5SMYN87F2FH/Moss_macro.jpg?format=2500w'
          },
          { 
            name: 'Liverworts', 
            scientific: 'Marchantiophyta',
            image: 'https://i.guim.co.uk/img/media/d7d5d42b5bba945e9addad3fa978c28c89eaf542/0_217_5472_3283/master/5472.jpg?width=465&dpr=1&s=none&crop=none'
          }
        ]
      },
      {
        id: 'ferns',
        name: 'Ferns & Allies',
        period: '360 MILLION YEARS AGO',
        description: 'Early vascular plants that reproduce via spores. During the Carboniferous period, tree-sized ferns formed vast forests that later became coal deposits.',
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: true },
          { name: 'Vascular System', present: true },
          { name: 'True Roots', present: true },
          { name: 'Seeds', present: false },
          { name: 'Pollen', present: false },
          { name: 'Flowers', present: false },
          { name: 'Fruits', present: false }
        ],
        funFact: "Most of the world's coal deposits formed from the remains of giant ferns and their relatives during the Carboniferous period, 359-299 million years ago. You're literally burning ancient ferns when you use coal!",
        tags: ['Vascular', 'Seedless', 'Prehistoric'],
        plants: [
          { 
            name: 'Horsetails', 
            scientific: 'Equisetopsida',
            image: 'https://cdn.shopify.com/s/files/1/0579/7924/0580/files/bd9f4e2263_480x480.jpg?v=1722491616'
          },
          { 
            name: 'Whisk Ferns', 
            scientific: 'Psilotopsida',
            image: 'https://www.wildsouthflorida.com/images2020/wisk.fern.1.jpeg'
          }
        ]
      },
      {
        id: 'gymnosperms',
        name: 'Gymnosperms',
        period: '305 MILLION YEARS AGO',
        description: 'The first seed plants, with "naked seeds" not enclosed in an ovary. This revolutionary adaptation allowed plants to reproduce without standing water.',
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: true },
          { name: 'Vascular System', present: true },
          { name: 'True Roots', present: true },
          { name: 'Seeds', present: true },
          { name: 'Pollen', present: true },
          { name: 'Flowers', present: false },
          { name: 'Fruits', present: false }
        ],
        funFact: "The Ginkgo biloba tree is often called a 'living fossil' because it has remained virtually unchanged for over 200 million years. It survived the extinction event that killed the dinosaurs and is the only surviving member of its entire division.",
        tags: ['Seed-bearing', 'Cones', 'Prehistoric'],
        plants: [
          { 
            name: 'Conifers', 
            scientific: 'Pinophyta',
            image: 'https://www.coniferousforest.com/wp-content/uploads/2019/08/Coniferous-Trees.jpg'
          },
          { 
            name: 'Ginkgo', 
            scientific: 'Ginkgophyta',
            image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/GINKGOBAUM-2.jpg'
          }
        ]
      },
      {
        id: 'monocots',
        name: 'Monocots',
        period: '140 MILLION YEARS AGO',
        description: "Flowering plants with one seed leaf, parallel veins, and scattered vascular bundles. They include some of humanity's most important food crops.",
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: true },
          { name: 'Vascular System', present: true },
          { name: 'True Roots', present: true },
          { name: 'Seeds', present: true },
          { name: 'Pollen', present: true },
          { name: 'Flowers', present: true },
          { name: 'Fruits', present: true }
        ],
        funFact: "The evolution and spread of grasses (a monocot family) about 55 million years ago changed entire ecosystems and led to the evolution of grazing animals. Without grasses, we wouldn't have cows, horses, or even human civilization since wheat, rice, and corn are all grasses!",
        tags: ['Angiosperm', 'Single Cotyledon', 'Flowering'],
        plants: [
          { 
            name: 'Grasses', 
            scientific: 'Poaceae',
            image: 'https://www.pennington.com/-/media/Project/OneWeb/Pennington/Images/blog/seed/10-Surprising-Facts-About-Grass/grass_10surprising_header.jpg?h=480&iar=0&w=1140&hash=52D3C55DD9AEDEC3AE5D90AC0599EF8D'
          },
          { 
            name: 'Lilies', 
            scientific: 'Liliaceae',
            image: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/ShoshanTzachor-2-wiki-Zachi-Evenor.jpg'
          }
        ]
      },
      {
        id: 'eudicots',
        name: 'Eudicots',
        period: '125 MILLION YEARS AGO',
        description: 'The largest and most diverse group of flowering plants, with two seed leaves and distinctive floral structures. They include most trees, shrubs, and ornamental plants.',
        features: [
          { name: 'Photosynthesis', present: true },
          { name: 'Multicellular Structure', present: true },
          { name: 'Vascular System', present: true },
          { name: 'True Roots', present: true },
          { name: 'Seeds', present: true },
          { name: 'Pollen', present: true },
          { name: 'Flowers', present: true },
          { name: 'Fruits', present: true }
        ],
        funFact: "Flowering plants evolved and diversified so rapidly that Charles Darwin called it 'an abominable mystery.' They now account for about 90% of all plant species on Earth, despite being relative newcomers in plant evolution.",
        tags: ['Angiosperm', 'Dual Cotyledon', 'Most Diverse'],
        plants: [
          { 
            name: 'Roses', 
            scientific: 'Rosaceae',
            image: '/api/placeholder/400/320'
          },
          { 
            name: 'Sunflowers', 
            scientific: 'Asteraceae',
            image: '/api/placeholder/400/320'
          }
        ]
      }
    ]);

    // UI Methods
    const toggleNav = () => {
      mobileNavOpen.value = !mobileNavOpen.value;
    };

    const toggleContextPanel = () => {
      showContextPanel.value = !showContextPanel.value;
    };

    // Scroll animation handling
    const handleScroll = () => {
      const revealElements = document.querySelectorAll('.timeline-item');
      const windowHeight = window.innerHeight;
      
      revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    // Lifecycle hooks
    onMounted(() => {
      // Initialize animations
      setTimeout(() => {
        handleScroll();
      }, 100);
      
      // Add scroll event listener
      window.addEventListener('scroll', handleScroll);

      // Replace placeholder images with real plant images if possible
      // This is a placeholder for real image loading logic
      const tryLoadRealImages = () => {
        // This would be replaced with actual image loading logic
        console.log("Attempting to load real plant images if available");
      };
      
      tryLoadRealImages();
    });

    // Cleanup on component unmount
    const onUnmounted = () => {
      window.removeEventListener('scroll', handleScroll);
    };

    // Feature animation
    const highlightFeature = (featureId) => {
      const featureElements = document.querySelectorAll(`[data-feature="${featureId}"]`);
      featureElements.forEach(el => {
        el.classList.add('feature-highlight');
        setTimeout(() => {
          el.classList.remove('feature-highlight');
        }, 2000);
      });
    };

    // Optional: Add a method to create a custom shareable link
    const generateShareLink = () => {
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?source=botanical-timeline`;
      
      // Copy to clipboard functionality
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Share link copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    };

    // Return all reactive references and methods
    return {
      mobileNavOpen,
      showContextPanel,
      plantData,
      mainCategories,
      evolutionaryFeatures,
      historicalContext,
      mindBlowingFacts,
      toggleNav,
      toggleContextPanel,
      highlightFeature,
      generateShareLink
    };
  }
}).mount('#app');

// Add some extra flare when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Dramatic entrance animation for the header
  setTimeout(() => {
    const header = document.querySelector('header');
    if (header) {
      header.style.opacity = '0';
      header.style.transform = 'translateY(-20px)';
      header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      
      setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
      }, 300);
    }
  }, 100);
  
  // Fun little easter egg in the console for fellow developers
  console.log("%cPlant Evolution Timeline", "color: #36D399; font-size: 20px; font-weight: bold;");
  console.log("%cCreated with 💚 by Absurd Industries", "color: #FF4D8F; font-size: 14px;");
  console.log("🌿 Fun fact: Sharks existed before trees! Sharks appeared around 420 million years ago, while the first trees didn't show up until 385 million years ago.");
});