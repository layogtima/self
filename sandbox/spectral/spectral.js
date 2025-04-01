// SPECTRAL.JS - The brains behind the beauty
// A demonstration of time-based, contextual, emotional, and ambient web design

document.addEventListener('DOMContentLoaded', function () {
    // Initialize global variables
    const startTime = new Date();
    let pageScrollPercent = 0;
    let cursorActivity = 0;
    let cursorX = 0, cursorY = 0;
    let viewportHeight = window.innerHeight;
    let viewportWidth = window.innerWidth;
    let isScrolling = false;
    let scrollTimeout;
    let idleTime = 0;
    let isIdle = false;

    // CORE FUNCTIONALITY
    // Initialize all components
    initSpectralDocument();
    initInfoBar();
    initHeroCanvas();
    initAnimations();
    initTimeBasedComponents();
    initContextComponents();
    initEmotionalComponents();
    initAmbientComponents();

    // Initialize navigation effects
    bindNavigationEffects();

    // SPECTRAL DOCUMENT CORE
    // ----------------------
    function initSpectralDocument() {
        // Set up the basic document behaviors
        const spectralDoc = document.querySelector('[data-spectral-document]');
        if (!spectralDoc) return;

        // Add basic event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('scroll', handleScroll);

        // Detect inactivity for ambient effects
        document.addEventListener('mousedown', resetIdleTime);
        document.addEventListener('keydown', resetIdleTime);
        document.addEventListener('touchstart', resetIdleTime);

        // Start idle time counter
        startIdleCounter();

        // Show the info bar after 2 seconds
        setTimeout(() => {
            const infoBar = document.querySelector('[data-spectral-infobar]');
            if (infoBar) {
                infoBar.style.display = 'flex';
                infoBar.classList.add('animate-fade-in');
            }
        }, 2000);
    }

    // Helper functions for core behavior
    function handleMouseMove(e) {
        cursorX = e.clientX;
        cursorY = e.clientY;
        cursorActivity++;

        // Update cursor activity level every 10 moves
        if (cursorActivity % 10 === 0) {
            updateCursorActivityLevel();
        }

        // Reset idle time
        resetIdleTime();
    }

    function handleScroll() {
        // Calculate scroll percentage
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        pageScrollPercent = Math.round((scrollTop / (docHeight - window.innerHeight)) * 100);

        // Update scroll indicator
        const scrollIndicator = document.querySelector('[data-scroll-indicator]');
        if (scrollIndicator) {
            scrollIndicator.textContent = `Scroll: ${pageScrollPercent}%`;
        }

        // Set scrolling state
        isScrolling = true;
        clearTimeout(scrollTimeout);

        // Clear scrolling state after 100ms of no scrolling
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 100);

        // Check which section is in view for navigation highlighting
        highlightCurrentSection();

        // Reset idle time
        resetIdleTime();
    }

    function resetIdleTime() {
        idleTime = 0;
        if (isIdle) {
            isIdle = false;
            document.body.classList.remove('idle-state');
        }
    }

    function startIdleCounter() {
        // Increment idle time every second
        setInterval(() => {
            idleTime++;

            // After 10 seconds of inactivity, trigger idle state
            if (idleTime > 10 && !isIdle) {
                isIdle = true;
                document.body.classList.add('idle-state');

                // Trigger ambient behaviors when idle
                triggerAmbientBehaviors();
            }

            // Update view time on info bar
            const viewTimeElement = document.querySelector('[data-view-time]');
            if (viewTimeElement) {
                const totalSeconds = Math.floor((new Date() - startTime) / 1000);
                viewTimeElement.textContent = `Time on page: ${formatTime(totalSeconds)}`;
            }
        }, 1000);
    }

    function updateCursorActivityLevel() {
        const activityElement = document.querySelector('[data-cursor-activity]');
        if (!activityElement) return;

        // Determine activity level based on recent cursor movement
        let level = 'Low';
        if (cursorActivity > 100 && cursorActivity < 300) {
            level = 'Medium';
        } else if (cursorActivity >= 300) {
            level = 'High';
        }

        activityElement.textContent = `Cursor Activity: ${level}`;
    }

    function highlightCurrentSection() {
        // Get all sections
        const sections = document.querySelectorAll('[data-spectral-section]');
        if (!sections.length) return;

        // Check which section is most in view
        let currentSection = null;
        let maxVisibility = 0;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibility = getVisibilityPercentage(rect);

            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                currentSection = section.getAttribute('data-spectral-section');
            }
        });

        // Highlight the nav link for the current section
        if (currentSection) {
            const navLinks = document.querySelectorAll('[data-nav-link]');
            navLinks.forEach(link => {
                const section = link.getAttribute('data-nav-link');
                if (section === currentSection) {
                    link.classList.add('underline');
                } else {
                    link.classList.remove('underline');
                }
            });
        }
    }

    function getVisibilityPercentage(rect) {
        // Calculate how much of the element is visible in the viewport
        const windowHeight = window.innerHeight;

        if (rect.top >= windowHeight || rect.bottom <= 0) {
            return 0; // Not visible
        }

        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = visibleBottom - visibleTop;

        return (visibleHeight / rect.height) * 100;
    }

    // INFO BAR
    // --------
    function initInfoBar() {
        // Initialize the info bar with real-time data
        updateClock();
        detectLocation();

        // Update clock every second
        setInterval(updateClock, 1000);
    }

    function updateClock() {
        const timeElement = document.querySelector('[data-time]');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            timeElement.textContent = timeString;
        }
    }

    function detectLocation() {
        const locationElement = document.querySelector('[data-location]');
        if (!locationElement) return;

        // Try to get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    // Get city name from coordinates
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;

                    fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            const city = data.address.city || data.address.town || data.address.village || 'Unknown';
                            const country = data.address.country || '';
                            locationElement.textContent = `Location: ${city}, ${country}`;

                            // Also update location-based elements
                            updateLocationBasedElements(city, country);
                        })
                        .catch(() => {
                            locationElement.textContent = `Location: Permission granted, but lookup failed`;
                        });
                },
                error => {
                    locationElement.textContent = `Location: ${getLocationErrorMessage(error)}`;
                }
            );
        } else {
            locationElement.textContent = 'Location: Not supported';
        }
    }

    function getLocationErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return "Permission denied";
            case error.POSITION_UNAVAILABLE:
                return "Position unavailable";
            case error.TIMEOUT:
                return "Timed out";
            default:
                return "Unknown error";
        }
    }

    // HERO CANVAS
    // -----------
    function initHeroCanvas() {
        const canvas = document.createElement('canvas');
        const hero = document.querySelector('[data-spectral-hero]');
        const canvasContainer = document.querySelector('[data-spectral-canvas]');

        if (!canvasContainer || !hero) return;

        // Set up canvas
        canvasContainer.appendChild(canvas);
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;

        // Resize canvas when window resizes
        window.addEventListener('resize', () => {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        });

        // Init animated background
        animateHeroBackground(canvas);
    }

    function animateHeroBackground(canvas) {
        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = 50;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                color: `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.1})`,
                vx: Math.random() * 2 - 1,
                vy: Math.random() * 2 - 1
            });
        }

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach(particle => {
                // Move particles
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
            });

            // Connect particles that are close to each other
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 * (1 - distance / 100)})`;
                        ctx.stroke();
                    }
                }
            }
        }

        animate();
    }

    // ANIMATIONS
    // ----------
    function initAnimations() {
        // Set up animation for elements with data-animate-in attribute
        const animateElements = document.querySelectorAll('[data-animate-in]');

        if (!animateElements.length) return;

        // Create an intersection observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-animate-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animate-fade-in');
                        entry.target.style.opacity = 1;
                    }, delay * 1000);

                    // Stop observing after animation
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe all animate elements
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }

    // NAVIGATION EFFECTS
    // -----------------
    function bindNavigationEffects() {
        const nav = document.querySelector('[data-spectral-nav]');
        if (!nav) return;

        // Change nav appearance on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('bg-white', 'shadow-md');
                nav.classList.remove('bg-transparent');
            } else {
                nav.classList.remove('bg-white', 'shadow-md');
                nav.classList.add('bg-transparent');
            }
        });

        // Logo animations
        const logo = document.querySelector('[data-spectral-logo]');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                logo.classList.add('animate-pulse');
            });

            logo.addEventListener('mouseleave', () => {
                logo.classList.remove('animate-pulse');
            });
        }
    }

    // TIME-BASED COMPONENTS
    // ---------------------
    function initTimeBasedComponents() {
        // Initialize aging text
        initAgingText();

        // Initialize reading progress
        initReadingProgress();

        // Initialize time-based style changes
        initTimeBasedStyles();

        // Initialize timed reveals
        initTimedReveals();
    }

    function initAgingText() {
        const agingDemo = document.querySelector('[data-time-demo="aging"]');
        if (!agingDemo) return;

        const textElement = agingDemo.querySelector('[data-time-text]');
        const timeCounter = agingDemo.querySelector('[data-time-counter]');

        if (!textElement || !timeCounter) return;

        let seconds = 0;
        setInterval(() => {
            seconds++;
            timeCounter.textContent = seconds;

            // Apply gradual style changes
            const opacity = Math.min(0.5 + (seconds / 30), 1);
            const size = Math.min(1 + (seconds / 60), 1.5);
            const letterSpacing = Math.min(seconds / 60, 0.5);

            textElement.style.opacity = opacity;
            textElement.style.transform = `scale(${size})`;
            textElement.style.letterSpacing = `${letterSpacing}em`;

            // Add style changes at intervals
            if (seconds % 10 === 0) {
                if (seconds % 30 === 0) {
                    textElement.style.fontStyle = 'italic';
                } else if (seconds % 20 === 0) {
                    textElement.style.fontWeight = '300';
                } else {
                    textElement.style.fontStyle = 'normal';
                    textElement.style.fontWeight = 'bold';
                }
            }
        }, 1000);
    }

    function initReadingProgress() {
        const readingDemo = document.querySelector('[data-time-demo="progress"]');
        if (!readingDemo) return;

        const contentElement = readingDemo.querySelector('[data-reading-content]');
        const progressElement = readingDemo.querySelector('[data-reading-progress]');
        const progressBar = readingDemo.querySelector('[data-reading-bar]');

        if (!contentElement || !progressElement || !progressBar) return;

        contentElement.addEventListener('scroll', () => {
            const scrollHeight = contentElement.scrollHeight - contentElement.clientHeight;
            const scrollPosition = contentElement.scrollTop;
            const progress = Math.min((scrollPosition / scrollHeight) * 100, 100);

            progressElement.textContent = `${Math.round(progress)}%`;
            progressBar.style.width = `${progress}%`;

            // Change color as progress increases
            const hue = Math.round(progress * 2.4); // 0-240 (blue to red)
            progressBar.style.backgroundColor = `hsl(${240 - hue}, 70%, 50%)`;
        });
    }

    function initTimeBasedStyles() {
        const styleDemo = document.querySelector('[data-time-demo="style"]');
        if (!styleDemo) return;

        const textElement = styleDemo.querySelector('[data-day-night-text]');
        const timeElement = styleDemo.querySelector('[data-local-time]');

        if (!textElement || !timeElement) return;

        // Update time and styles
        function updateTimeStyles() {
            const now = new Date();
            const hours = now.getHours();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            timeElement.textContent = timeString;

            // Apply styles based on time of day
            if (hours >= 5 && hours < 12) {
                // Morning
                textElement.style.color = '#FF5722';
                textElement.style.textShadow = '2px 2px 4px rgba(255, 87, 34, 0.3)';
                styleDemo.style.background = 'linear-gradient(to right, #fff8e1, #ffffff)';
            } else if (hours >= 12 && hours < 17) {
                // Afternoon
                textElement.style.color = '#2196F3';
                textElement.style.textShadow = '2px 2px 4px rgba(33, 150, 243, 0.3)';
                styleDemo.style.background = 'linear-gradient(to right, #e3f2fd, #ffffff)';
            } else if (hours >= 17 && hours < 20) {
                // Evening
                textElement.style.color = '#9C27B0';
                textElement.style.textShadow = '2px 2px 4px rgba(156, 39, 176, 0.3)';
                styleDemo.style.background = 'linear-gradient(to right, #f3e5f5, #ffffff)';
            } else {
                // Night
                textElement.style.color = '#455A64';
                textElement.style.textShadow = '2px 2px 4px rgba(69, 90, 100, 0.3)';
                styleDemo.style.background = 'linear-gradient(to right, #eceff1, #ffffff)';
            }
        }

        // Initial update
        updateTimeStyles();

        // Update every minute
        setInterval(updateTimeStyles, 60000);
    }

    function initTimedReveals() {
        const revealsDemo = document.querySelector('[data-time-demo="reveals"]');
        if (!revealsDemo) return;

        const revealElements = revealsDemo.querySelectorAll('[data-reveal-delay]');
        const timerElement = revealsDemo.querySelector('[data-reveal-timer]');

        if (!revealElements.length || !timerElement) return;

        // Set up timer
        let seconds = 0;
        setInterval(() => {
            seconds++;
            timerElement.textContent = seconds;

            // Check for elements to reveal
            revealElements.forEach(element => {
                const delay = parseInt(element.getAttribute('data-reveal-delay'));
                if (seconds >= delay) {
                    element.classList.add('animate-fade-in');
                    element.style.opacity = 1;
                }
            });
        }, 1000);
    }

    // CONTEXT COMPONENTS
    // -----------------
    function initContextComponents() {
        // Initialize location-aware design
        initLocationAwareDesign();

        // Initialize device-responsive elements
        initDeviceResponsiveElements();

        // Initialize time-of-day adaptations
        initTimeOfDayAdaptations();

        // Initialize behavior-responsive design
        initBehaviorResponsiveDesign();
    }

    function initLocationAwareDesign() {
        const locationDemo = document.querySelector('[data-context-demo="location"]');
        if (!locationDemo) return;

        const locationElement = locationDemo.querySelector('[data-visitor-location]');
        const greetingElement = locationDemo.querySelector('[data-location-greeting]');

        if (!locationElement || !greetingElement) return;

        // Try to get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    // Get city and country from coordinates
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;

                    fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            const city = data.address.city || data.address.town || data.address.village || 'your city';
                            const country = data.address.country || 'your country';

                            locationElement.textContent = `You're in ${city}, ${country}`;

                            // Set greeting based on location
                            setLocationBasedGreeting(greetingElement, country);
                        })
                        .catch(() => {
                            locationElement.textContent = `Location detected, but address lookup failed`;
                            greetingElement.textContent = `Hello, explorer`;
                        });
                },
                error => {
                    locationElement.textContent = `Location: ${getLocationErrorMessage(error)}`;
                    greetingElement.textContent = `Hello, visitor`;
                }
            );
        } else {
            locationElement.textContent = 'Location detection not supported';
            greetingElement.textContent = `Hello, visitor`;
        }
    }

    function setLocationBasedGreeting(element, country) {
        // Set greeting based on country
        const greetings = {
            'United States': 'Hello from SPECTRAL',
            'United Kingdom': 'Hello from SPECTRAL',
            'Australia': 'G\'day from SPECTRAL',
            'France': 'Bonjour from SPECTRAL',
            'Germany': 'Hallo from SPECTRAL',
            'Italy': 'Ciao from SPECTRAL',
            'Spain': 'Hola from SPECTRAL',
            'Japan': 'こんにちは from SPECTRAL',
            'China': '你好 from SPECTRAL',
            'India': 'Namaste from SPECTRAL',
            'Brazil': 'Olá from SPECTRAL',
            'Russia': 'Привет from SPECTRAL',
            'Mexico': '¡Hola! from SPECTRAL'
        };

        if (greetings[country]) {
            element.textContent = greetings[country];
        } else {
            element.textContent = `Hello from SPECTRAL`;
        }
    }

    function updateLocationBasedElements(city, country) {
        // This function would update any other location-based elements
        const locationGreeting = document.querySelector('[data-location-greeting]');
        if (locationGreeting) {
            setLocationBasedGreeting(locationGreeting, country);
        }
    }

    function initDeviceResponsiveElements() {
        const deviceDemo = document.querySelector('[data-context-demo="device"]');
        if (!deviceDemo) return;

        const deviceInfoElement = deviceDemo.querySelector('[data-device-info]');
        const deviceMessageElement = deviceDemo.querySelector('[data-device-message]');
        const browserElement = deviceDemo.querySelector('[data-browser-name]');
        const osElement = deviceDemo.querySelector('[data-os-name]');
        const screenElement = deviceDemo.querySelector('[data-screen-type]');

        if (!deviceInfoElement || !deviceMessageElement || !browserElement || !osElement || !screenElement) return;

        // Detect browser
        const browserInfo = detectBrowser();
        browserElement.textContent = browserInfo;

        // Detect OS
        const osInfo = detectOS();
        osElement.textContent = osInfo;

        // Detect screen type
        const screenInfo = detectScreenType();
        screenElement.textContent = screenInfo;

        // Set device info summary
        deviceInfoElement.textContent = `${browserInfo} on ${osInfo}`;

        // Set message based on device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            deviceMessageElement.textContent = 'Mobile-optimized experience';
        } else {
            deviceMessageElement.textContent = 'Desktop-optimized experience';
        }
    }

    function detectBrowser() {
        const userAgent = navigator.userAgent;
        let browserName;

        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "Firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "Safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "Opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "Edge";
        } else {
            browserName = "Unknown Browser";
        }

        return browserName;
    }

    function detectOS() {
        const userAgent = navigator.userAgent;
        let osName;

        if (userAgent.match(/windows nt/i)) {
            osName = "Windows";
        } else if (userAgent.match(/macintosh|mac os x/i)) {
            osName = "macOS";
        } else if (userAgent.match(/linux/i)) {
            osName = "Linux";
        } else if (userAgent.match(/android/i)) {
            osName = "Android";
        } else if (userAgent.match(/iphone|ipad|ipod/i)) {
            osName = "iOS";
        } else {
            osName = "Unknown OS";
        }

        return osName;
    }

    function detectScreenType() {
        // Simplified detection - can be improved
        if (window.matchMedia("(max-width: 480px)").matches) {
            return "Mobile";
        } else if (window.matchMedia("(max-width: 768px)").matches) {
            return "Tablet";
        } else if (window.matchMedia("(max-width: 1024px)").matches) {
            return "Laptop";
        } else {
            return "Desktop";
        }
    }

    function initTimeOfDayAdaptations() {
        const timeOfDayDemo = document.querySelector('[data-context-demo="time-of-day"]');
        if (!timeOfDayDemo) return;

        const timeInfoElement = timeOfDayDemo.querySelector('[data-time-of-day-info]');
        const currentTimeElement = timeOfDayDemo.querySelector('[data-current-time]');
        const greetingElement = timeOfDayDemo.querySelector('[data-time-greeting]');
        const containerElement = timeOfDayDemo.querySelector('[data-time-adaptive-container]');

        if (!timeInfoElement || !currentTimeElement || !greetingElement || !containerElement) return;

        // Update time and adaptations
        function updateTimeAdaptations() {
            const now = new Date();
            const hours = now.getHours();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            currentTimeElement.textContent = timeString;

            // Apply adaptations based on time of day
            if (hours >= 5 && hours < 12) {
                // Morning
                greetingElement.textContent = 'Good Morning';
                containerElement.style.background = 'linear-gradient(135deg, #fff9c4, #ffffff)';
                containerElement.style.color = '#FF6F00';
            } else if (hours >= 12 && hours < 17) {
                // Afternoon
                greetingElement.textContent = 'Good Afternoon';
                containerElement.style.background = 'linear-gradient(135deg, #bbdefb, #ffffff)';
                containerElement.style.color = '#1565C0';
            } else if (hours >= 17 && hours < 20) {
                // Evening
                greetingElement.textContent = 'Good Evening';
                containerElement.style.background = 'linear-gradient(135deg, #e1bee7, #ffffff)';
                containerElement.style.color = '#6A1B9A';
            } else {
                // Night
                greetingElement.textContent = 'Good Night';
                containerElement.style.background = 'linear-gradient(135deg, #cfd8dc, #ffffff)';
                containerElement.style.color = '#263238';
            }
        }

        // Initial update
        updateTimeAdaptations();

        // Update every minute
        setInterval(updateTimeAdaptations, 60000);
    }

    function initBehaviorResponsiveDesign() {
        // This will be implemented with cursor tracking, scroll speed monitoring, etc.
        const behaviorDemo = document.querySelector('[data-context-demo="behavior"]');
        if (!behaviorDemo) return;

        // Will be expanded in the next section
    }

    // EMOTIONAL COMPONENTS
    // -------------------
    function initEmotionalComponents() {
        // The emotional components will respond to user interaction patterns
        // Implementation will focus on cursor movements, scrolling behaviors,
        // click patterns, and other interaction metrics
    }

    // AMBIENT COMPONENTS
    // -----------------
    function initAmbientComponents() {
        // Ambient components change without direct user interaction
        // Implementation will focus on background changes, subtle animations,
        // and other ambient behaviors
    }

    function triggerAmbientBehaviors() {
        // This function is called when the user is idle
        // It will trigger ambient behaviors like subtle animations,
        // color shifts, and other non-intrusive changes
    }

    // UTILITY FUNCTIONS
    // ----------------
    function formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
});