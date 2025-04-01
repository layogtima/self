document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const fontWeightSelect = document.getElementById('font-weight');
    const sampleTextSelect = document.getElementById('sample-text');
    const customTextContainer = document.getElementById('custom-text-container');
    const customTextInput = document.getElementById('custom-text');
    const tabButtons = document.querySelectorAll('.tab-button');
    const fontCategories = document.querySelectorAll('.font-category-container');
    const sampleTexts = document.querySelectorAll('.sample-text');

    // Sample text options
    const sampleTextOptions = {
        pangram: 'The quick brown fox jumps over the lazy dog.',
        alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789 !@#$%^&*()_+-=[]{}|;:\'",.<>/?',
        custom: ''
    };

    // Check for saved theme preference or use system preference
    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');

        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Font size slider functionality
    fontSizeSlider.addEventListener('input', () => {
        const size = fontSizeSlider.value;
        fontSizeValue.textContent = `${size}px`;

        sampleTexts.forEach(text => {
            text.style.fontSize = `${size}px`;
        });
    });

    // Font weight select functionality
    fontWeightSelect.addEventListener('change', () => {
        const weight = fontWeightSelect.value;

        sampleTexts.forEach(text => {
            text.style.fontWeight = weight;
        });
    });

    // Sample text select functionality
    sampleTextSelect.addEventListener('change', () => {
        const selectedOption = sampleTextSelect.value;

        // Show/hide custom text input
        if (selectedOption === 'custom') {
            customTextContainer.classList.remove('hidden');

            // If there's already custom text entered, use it
            if (sampleTextOptions.custom) {
                updateSampleText(sampleTextOptions.custom);
            } else {
                // Focus the input for user to type
                customTextInput.focus();
            }
        } else {
            customTextContainer.classList.add('hidden');
            updateSampleText(sampleTextOptions[selectedOption]);
        }
    });

    // Custom text input functionality
    customTextInput.addEventListener('input', () => {
        sampleTextOptions.custom = customTextInput.value;
        updateSampleText(customTextInput.value);
    });

    // Update all sample text elements
    function updateSampleText(text) {
        sampleTexts.forEach(element => {
            element.textContent = text;
        });
    }

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            // Update active tab button
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            // Show selected category, hide others
            fontCategories.forEach(container => {
                if (container.id === category) {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            });
        });
    });

    // Initialize with default values
    fontSizeSlider.value = 32;
    fontSizeValue.textContent = '32px';
    sampleTexts.forEach(text => {
        text.style.fontSize = '32px';
        text.style.fontWeight = 400;
    });
});

// Intersection Observer for animation effects
document.addEventListener('DOMContentLoaded', () => {
    const fontCards = document.querySelectorAll('.font-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    fontCards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
});

// Add a small easter egg for fun
document.addEventListener('DOMContentLoaded', () => {
    const heroHeading = document.querySelector('header h1');

    if (heroHeading) {
        heroHeading.addEventListener('click', () => {
            heroHeading.classList.add('animate-bounce');

            setTimeout(() => {
                heroHeading.classList.remove('animate-bounce');
            }, 1000);
        });
    }
});