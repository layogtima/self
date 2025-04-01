/**
 * SPECTRAL - Ambient Intelligence Module
 * 
 * This module handles ambient behaviors that occur when the user
 * is not actively interacting with the interface.
 * 
 * Features:
 * - Idle state detection and management
 * - Background animations and transitions
 * - Subtle breathing effects for UI elements
 * - Environmental awareness (light, sound, motion)
 * - Temporal patterns and memory
 */

// Idle State Manager
// =================
class IdleStateManager {
    constructor(options = {}) {
        this.options = {
            idleThreshold: options.idleThreshold || 10000, // 10 seconds default
            deepIdleThreshold: options.deepIdleThreshold || 30000, // 30 seconds default
            updateInterval: options.updateInterval || 1000,
            ...options
        };

        this.isActive = false;
        this.idleTime = 0;
        this.idleState = 'active'; // 'active', 'idle', 'deep-idle'
        this.lastActivityTime = Date.now();
        this.listeners = {};

        // Track scroll position for subtle changes during idle time
        this.lastScrollY = window.scrollY;
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;
        this.idleTime = 0;
        this.lastActivityTime = Date.now();

        // Bind event handlers
        this.resetIdleTime = this.resetIdleTime.bind(this);
        this.checkIdleState = this.checkIdleState.bind(this);

        // Add event listeners
        document.addEventListener('mousemove', this.resetIdleTime);
        document.addEventListener('keydown', this.resetIdleTime);
        document.addEventListener('click', this.resetIdleTime);
        document.addEventListener('touchstart', this.resetIdleTime);
        document.addEventListener('scroll', this.resetIdleTime);

        // Start idle checker
        this.idleInterval = setInterval(this.checkIdleState, this.options.updateInterval);

        console.log('IdleStateManager started');
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove event listeners
        document.removeEventListener('mousemove', this.resetIdleTime);
        document.removeEventListener('keydown', this.resetIdleTime);
        document.removeEventListener('click', this.resetIdleTime);
        document.removeEventListener('touchstart', this.resetIdleTime);
        document.removeEventListener('scroll', this.resetIdleTime);

        // Clear interval
        clearInterval(this.idleInterval);

        console.log('IdleStateManager stopped');
    }

    resetIdleTime() {
        // Only reset if we're actually idle
        if (this.idleState !== 'active') {
            this.trigger('wake', {
                previousState: this.idleState,
                idleTime: this.idleTime
            });
        }

        this.idleTime = 0;
        this.lastActivityTime = Date.now();

        if (this.idleState !== 'active') {
            this.idleState = 'active';
            this.trigger('stateChange', {
                state: 'active'
            });

            // Remove idle class from body
            document.body.classList.remove('idle-state', 'deep-idle-state');
        }

        // Update scroll position
        this.lastScrollY = window.scrollY;
    }

    checkIdleState() {
        if (!this.isActive) return;

        const now = Date.now();
        this.idleTime = now - this.lastActivityTime;

        // Determine idle state
        let newState;

        if (this.idleTime >= this.options.deepIdleThreshold) {
            newState = 'deep-idle';
        } else if (this.idleTime >= this.options.idleThreshold) {
            newState = 'idle';
        } else {
            newState = 'active';
        }

        // Only trigger if state changed
        if (newState !== this.idleState) {
            const oldState = this.idleState;
            this.idleState = newState;

            // Add idle class to body
            if (newState === 'idle') {
                document.body.classList.add('idle-state');
                document.body.classList.remove('deep-idle-state');
            } else if (newState === 'deep-idle') {
                document.body.classList.add('idle-state', 'deep-idle-state');
            } else {
                document.body.classList.remove('idle-state', 'deep-idle-state');
            }

            this.trigger('stateChange', {
                state: newState,
                previousState: oldState,
                idleTime: this.idleTime
            });
        }
    }

    getIdleState() {
        return this.idleState;
    }

    getIdleTime() {
        return this.idleTime;
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.listeners[event]) return this;

        if (callback) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        } else {
            delete this.listeners[event];
        }

        return this;
    }

    trigger(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            callback(data);
        });
    }
}

// Element Breathing Manager
// =======================
class ElementBreathingManager {
    constructor(options = {}) {
        this.options = {
            minDuration: options.minDuration || 4000, // 4 seconds
            maxDuration: options.maxDuration || 8000, // 8 seconds
            minScaleFactor: options.minScaleFactor || 0.98,
            maxScaleFactor: options.maxScaleFactor || 1.02,
            opacityVariation: options.opacityVariation || 0.1,
            synchronized: options.synchronized || false,
            ...options
        };

        this.breathingElements = new Map();
        this.isActive = false;
        this.syncPhase = 0;
        this.listeners = {};
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;

        // Start sync timer if using synchronized mode
        if (this.options.synchronized) {
            this.syncInterval = setInterval(() => {
                this.syncPhase = (this.syncPhase + 1) % 100;
                this.updateBreathingElements();
            }, 100);
        }

        console.log('ElementBreathingManager started');
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Clear sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Reset all elements
        this.breathingElements.forEach((config, element) => {
            this.resetElement(element);
        });

        console.log('ElementBreathingManager stopped');
    }

    registerElement(element, config = {}) {
        if (typeof element === 'string') {
            // Find element by selector
            element = document.querySelector(element);
        }

        if (!element) return null;

        const elementId = this.getElementId(element);

        // Merge default options with element-specific config
        const elementConfig = {
            duration: config.duration || this.getRandomDuration(),
            scaleFactor: config.scaleFactor || this.getRandomScaleFactor(),
            opacityFactor: config.opacityFactor || this.getRandomOpacityFactor(),
            phase: config.phase || Math.random() * 2 * Math.PI,
            useScale: config.useScale !== undefined ? config.useScale : true,
            useOpacity: config.useOpacity !== undefined ? config.useOpacity : true,
            active: config.active !== undefined ? config.active : true,
            ...config
        };

        // Store original styles
        elementConfig.originalStyles = {
            transform: element.style.transform || '',
            opacity: element.style.opacity || ''
        };

        // Store element and config
        this.breathingElements.set(element, elementConfig);

        // Set initial state
        if (elementConfig.active) {
            this.applyBreathingEffect(element, elementConfig);
        }

        console.log(`Registered breathing element: ${elementId}`);

        return element;
    }

    unregisterElement(element) {
        if (typeof element === 'string') {
            // Find element by selector
            element = document.querySelector(element);
        }

        if (!element || !this.breathingElements.has(element)) return false;

        // Reset element to original state
        this.resetElement(element);

        // Remove from registry
        this.breathingElements.delete(element);

        return true;
    }

    resetElement(element) {
        if (!element || !this.breathingElements.has(element)) return;

        const config = this.breathingElements.get(element);

        // Reset styles
        element.style.transform = config.originalStyles.transform;
        element.style.opacity = config.originalStyles.opacity;

        // Remove transition if added
        element.style.transition = '';
    }

    updateBreathingElements() {
        if (!this.isActive) return;

        this.breathingElements.forEach((config, element) => {
            if (config.active) {
                if (this.options.synchronized) {
                    // Use global sync phase for all elements
                    this.applySynchronizedBreathing(element, config);
                } else {
                    // Use individual timing for each element
                    this.applyBreathingEffect(element, config);
                }
            }
        });
    }

    applyBreathingEffect(element, config) {
        if (!element || !this.isActive) return;

        const now = Date.now();
        const elapsed = (now % config.duration) / config.duration;
        const phase = Math.sin(elapsed * 2 * Math.PI + config.phase);

        this.applyBreathingPhase(element, config, phase);
    }

    applySynchronizedBreathing(element, config) {
        if (!element || !this.isActive) return;

        // Use global sync phase (0-100)
        const phase = Math.sin(this.syncPhase / 100 * 2 * Math.PI);

        this.applyBreathingPhase(element, config, phase);
    }

    applyBreathingPhase(element, config, phase) {
        // Phase is -1 to 1
        const normalizedPhase = (phase + 1) / 2; // 0 to 1

        // Apply transform if enabled
        if (config.useScale) {
            const scale = config.scaleFactor.min + normalizedPhase * (config.scaleFactor.max - config.scaleFactor.min);

            // Preserve existing transforms
            const currentTransform = element.style.transform || '';

            // Check if transform already has scale
            if (currentTransform.includes('scale(')) {
                element.style.transform = currentTransform.replace(/scale\([^)]+\)/, `scale(${scale})`);
            } else {
                element.style.transform = `${currentTransform} scale(${scale})`.trim();
            }
        }

        // Apply opacity if enabled
        if (config.useOpacity) {
            const opacity = config.opacityFactor.min + normalizedPhase * (config.opacityFactor.max - config.opacityFactor.min);
            element.style.opacity = opacity;
        }

        // Ensure smooth transition
        if (!element.style.transition) {
            element.style.transition = 'transform 1s ease-in-out, opacity 1s ease-in-out';
        }
    }

    getRandomDuration() {
        return Math.random() * (this.options.maxDuration - this.options.minDuration) + this.options.minDuration;
    }

    getRandomScaleFactor() {
        return {
            min: this.options.minScaleFactor,
            max: this.options.maxScaleFactor
        };
    }

    getRandomOpacityFactor() {
        const baseOpacity = 1;
        const variation = this.options.opacityVariation;

        return {
            min: Math.max(0, baseOpacity - variation / 2),
            max: Math.min(1, baseOpacity + variation / 2)
        };
    }

    getElementId(element) {
        if (!element) return 'unknown';

        // Use id if available
        if (element.id) return `#${element.id}`;

        // Use data attribute if available
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                return `[${attr.name}="${attr.value}"]`;
            }
        }

        // Use tag and class
        const tag = element.tagName.toLowerCase();
        const classes = Array.from(element.classList).join('.');

        return classes ? `${tag}.${classes}` : tag;
    }

    setSynchronized(synchronized) {
        const wasSynchronized = this.options.synchronized;
        this.options.synchronized = synchronized;

        // Start or stop sync interval
        if (synchronized && !wasSynchronized) {
            this.syncInterval = setInterval(() => {
                this.syncPhase = (this.syncPhase + 1) % 100;
                this.updateBreathingElements();
            }, 100);
        } else if (!synchronized && wasSynchronized) {
            clearInterval(this.syncInterval);
        }

        // Trigger event
        this.trigger('synchronizedChange', {
            synchronized
        });
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.listeners[event]) return this;

        if (callback) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        } else {
            delete this.listeners[event];
        }

        return this;
    }

    trigger(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            callback(data);
        });
    }
}

// Environmental Awareness System
// ===========================
class EnvironmentalAwarenessSystem {
    constructor(options = {}) {
        this.options = {
            updateInterval: options.updateInterval || 1000,
            deviceMotionSampleSize: options.deviceMotionSampleSize || 10,
            lightSensorThreshold: options.lightSensorThreshold || 0.2,
            ...options
        };

        this.isActive = false;
        this.listeners = {};

        // Environment state
        this.environmentState = {
            time: {
                hour: 0,
                minute: 0,
                second: 0,
                period: 'morning', // morning, afternoon, evening, night
                isDaytime: true
            },
            light: {
                level: 0, // 0 to 1
                mode: 'normal' // normal, dim, dark
            },
            motion: {
                active: false,
                intensity: 0 // 0 to 1
            },
            device: {
                batteryLevel: null,
                charging: null,
                online: navigator.onLine
            }
        };

        // Motion history for analysis
        this.motionHistory = [];
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;

        // Initialize environment detection
        this.initTimeDetection();
        this.initLightDetection();
        this.initMotionDetection();
        this.initDeviceStateDetection();

        // Start regular updates
        this.updateInterval = setInterval(() => {
            this.updateEnvironmentState();
        }, this.options.updateInterval);

        console.log('EnvironmentalAwarenessSystem started');
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove event listeners
        window.removeEventListener('devicelight', this.handleLightChange);
        window.removeEventListener('devicemotion', this.handleMotionChange);
        window.removeEventListener('online', this.handleOnlineChange);
        window.removeEventListener('offline', this.handleOfflineChange);

        if (this.batteryManager) {
            this.batteryManager.removeEventListener('levelchange', this.handleBatteryChange);
            this.batteryManager.removeEventListener('chargingchange', this.handleBatteryChange);
        }

        // Clear intervals
        clearInterval(this.updateInterval);

        console.log('EnvironmentalAwarenessSystem stopped');
    }

    initTimeDetection() {
        // Initial time update
        this.updateTime();
    }

    initLightDetection() {
        // Check if light sensor API is available
        if ('AmbientLightSensor' in window) {
            try {
                const lightSensor = new window.AmbientLightSensor();
                lightSensor.addEventListener('reading', () => {
                    this.handleLightChange({ value: lightSensor.illuminance });
                });
                lightSensor.start();
            } catch (error) {
                console.warn('Light sensor not available:', error);
                this.simulateLightSensor();
            }
        } else if ('DeviceLightEvent' in window) {
            // Fallback to DeviceLightEvent
            this.handleLightChange = this.handleLightChange.bind(this);
            window.addEventListener('devicelight', this.handleLightChange);
        } else {
            // Fallback to time-based simulation
            console.warn('Light sensor not available, using time-based simulation');
            this.simulateLightSensor();
        }
    }

    initMotionDetection() {
        // Check if device motion API is available
        if ('DeviceMotionEvent' in window) {
            this.handleMotionChange = this.handleMotionChange.bind(this);
            window.addEventListener('devicemotion', this.handleMotionChange);
        } else {
            console.warn('Device motion not available');
        }
    }

    initDeviceStateDetection() {
        // Online/offline status
        this.handleOnlineChange = this.handleOnlineChange.bind(this);
        this.handleOfflineChange = this.handleOfflineChange.bind(this);

        window.addEventListener('online', this.handleOnlineChange);
        window.addEventListener('offline', this.handleOfflineChange);

        // Battery status
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.batteryManager = battery;
                this.handleBatteryChange = this.handleBatteryChange.bind(this);

                battery.addEventListener('levelchange', this.handleBatteryChange);
                battery.addEventListener('chargingchange', this.handleBatteryChange);

                // Initial battery update
                this.updateBatteryStatus(battery);
            });
        }
    }

    updateEnvironmentState() {
        if (!this.isActive) return;

        // Update time
        this.updateTime();

        // Trigger update event
        this.trigger('update', this.environmentState);
    }

    updateTime() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();

        // Determine period of day
        let period;
        if (hour >= 5 && hour < 12) {
            period = 'morning';
        } else if (hour >= 12 && hour < 17) {
            period = 'afternoon';
        } else if (hour >= 17 && hour < 21) {
            period = 'evening';
        } else {
            period = 'night';
        }

        const isDaytime = hour >= 6 && hour < 18;

        // Update time state
        const timeState = {
            hour,
            minute,
            second,
            period,
            isDaytime
        };

        // Check if time period changed
        const periodChanged = this.environmentState.time.period !== period;

        // Update state
        this.environmentState.time = timeState;

        // Trigger period change event
        if (periodChanged) {
            this.trigger('periodChange', {
                oldPeriod: this.environmentState.time.period,
                newPeriod: period
            });
        }

        // Update light simulation if needed
        if (this.isSimulatingLight) {
            this.simulateLightLevelFromTime();
        }
    }

    handleLightChange(event) {
        // Get light level in lux
        const lux = event.value !== undefined ? event.value : event.lux;

        // Normalize to 0-1 range
        // Human-visible light ranges from 0.001 lux (moonlight) to 100,000+ lux (bright sunlight)
        // Using a log scale to make it more useful
        let normalizedLevel;

        if (lux <= 0) {
            normalizedLevel = 0;
        } else {
            // Log scale conversion (0.001 lux -> 0, 100 lux -> 0.5, 10000+ lux -> 1)
            normalizedLevel = Math.min(1, Math.max(0, (Math.log10(lux) + 3) / 7));
        }

        // Determine light mode
        let mode;
        if (normalizedLevel < 0.2) {
            mode = 'dark';
        } else if (normalizedLevel < 0.5) {
            mode = 'dim';
        } else {
            mode = 'normal';
        }

        // Check if mode changed
        const modeChanged = this.environmentState.light.mode !== mode;

        // Update light state
        this.environmentState.light = {
            level: normalizedLevel,
            mode
        };

        // Trigger mode change event
        if (modeChanged) {
            this.trigger('lightModeChange', {
                oldMode: this.environmentState.light.mode,
                newMode: mode
            });
        }
    }

    handleMotionChange(event) {
        if (!event.accelerationIncludingGravity) return;

        // Get acceleration data
        const acceleration = event.accelerationIncludingGravity;

        // Calculate motion intensity
        const intensity = Math.sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
        ) / 20; // Normalize to roughly 0-1

        // Add to history
        this.motionHistory.push({
            intensity,
            timestamp: Date.now()
        });

        // Keep history at manageable size
        if (this.motionHistory.length > this.options.deviceMotionSampleSize) {
            this.motionHistory.shift();
        }

        // Calculate average intensity over recent samples
        const averageIntensity = this.motionHistory.reduce((sum, item) => sum + item.intensity, 0) / this.motionHistory.length;

        // Determine if motion is active
        const isActive = averageIntensity > 0.1;

        // Check if state changed
        const stateChanged = this.environmentState.motion.active !== isActive;

        // Update motion state
        this.environmentState.motion = {
            active: isActive,
            intensity: averageIntensity
        };

        // Trigger motion change event
        if (stateChanged) {
            this.trigger('motionChange', {
                active: isActive,
                intensity: averageIntensity
            });
        }
    }

    handleOnlineChange() {
        this.environmentState.device.online = true;

        this.trigger('onlineChange', {
            online: true
        });
    }

    handleOfflineChange() {
        this.environmentState.device.online = false;

        this.trigger('onlineChange', {
            online: false
        });
    }

    handleBatteryChange(event) {
        if (!event.target) return;

        this.updateBatteryStatus(event.target);
    }

    updateBatteryStatus(battery) {
        if (!battery) return;

        const level = battery.level;
        const charging = battery.charging;

        // Check if state changed
        const levelChanged = this.environmentState.device.batteryLevel !== level;
        const chargingChanged = this.environmentState.device.charging !== charging;

        // Update battery state
        this.environmentState.device.batteryLevel = level;
        this.environmentState.device.charging = charging;

        // Trigger battery change event
        if (levelChanged || chargingChanged) {
            this.trigger('batteryChange', {
                level,
                charging,
                levelChanged,
                chargingChanged
            });
        }
    }

    simulateLightSensor() {
        this.isSimulatingLight = true;
        this.simulateLightLevelFromTime();
    }

    simulateLightLevelFromTime() {
        const hour = this.environmentState.time.hour;
        const minute = this.environmentState.time.minute;

        // Calculate normalized time (0-1) over 24 hours
        const normalizedTime = (hour + minute / 60) / 24;

        // Simulate light level based on time of day
        // Peak at noon (12:00) and lowest at midnight (0:00)
        let lightLevel;

        if (hour >= 6 && hour < 18) {
            // Daytime: bell curve with peak at noon
            const hoursSinceNoon = Math.abs(12 - (hour + minute / 60));
            lightLevel = Math.max(0, 1 - (hoursSinceNoon / 6) * (hoursSinceNoon / 6));
        } else {
            // Nighttime: low light
            lightLevel = 0.05;
        }

        // Add some randomness
        lightLevel += (Math.random() * 0.1) - 0.05;
        lightLevel = Math.min(1, Math.max(0, lightLevel));

        // Update light state
        this.handleLightChange({ value: Math.pow(10, lightLevel * 7 - 3) });
    }

    getEnvironmentState() {
        return { ...this.environmentState };
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.listeners[event]) return this;

        if (callback) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        } else {
            delete this.listeners[event];
        }

        return this;
    }

    trigger(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            callback(data);
        });
    }
}

// Temporal Memory System
// ====================
class TemporalMemorySystem {
    constructor(options = {}) {
        this.options = {
            storageKey: options.storageKey || 'spectral_temporal_memory',
            sessionDuration: options.sessionDuration || 30 * 60 * 1000, // 30 minutes
            maxSessionsStored: options.maxSessionsStored || 10,
            ...options
        };

        this.isActive = false;
        this.listeners = {};

        // Current session data
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            lastActiveTime: Date.now(),
            duration: 0,
            visitCount: 1,
            pageViews: {},
            events: [],
            interactions: {
                clicks: 0,
                scrollDepth: 0,
                timeSpentBySection: {}
            }
        };

        // Session history
        this.sessionHistory = [];

        // Load previous sessions
        this.loadSessions();
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;

        // Bind event handlers
        this.recordPageView = this.recordPageView.bind(this);
        this.recordEvent = this.recordEvent.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);

        // Add event listeners
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('click', this.handleClick);
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Record initial page view
        this.recordPageView(window.location.pathname);

        // Start session timer
        this.sessionTimer = setInterval(() => {
            this.updateSessionDuration();
        }, 1000);

        console.log('TemporalMemorySystem started');
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Remove event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('click', this.handleClick);
        window.removeEventListener('scroll', this.handleScroll);

        // Clear timer
        clearInterval(this.sessionTimer);

        // Save current session
        this.saveCurrentSession();

        console.log('TemporalMemorySystem stopped');
    }

    generateSessionId() {
        return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    loadSessions() {
        try {
            const storedData = localStorage.getItem(this.options.storageKey);

            if (storedData) {
                const parsedData = JSON.parse(storedData);

                if (Array.isArray(parsedData.sessions)) {
                    this.sessionHistory = parsedData.sessions;

                    // Check if we should continue the previous session
                    const lastSession = this.sessionHistory[this.sessionHistory.length - 1];

                    if (lastSession && this.shouldContinueSession(lastSession)) {
                        // Continue last session
                        this.currentSession = lastSession;
                        this.currentSession.lastActiveTime = Date.now();
                        this.currentSession.visitCount += 1;

                        console.log('Continuing previous session:', lastSession.id);
                    } else {
                        // Increment total visit count
                        const totalVisits = parsedData.totalVisits || 0;
                        this.currentSession.totalVisits = totalVisits + 1;

                        // Save this as the total visit count
                        this.saveTotalVisits(this.currentSession.totalVisits);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    saveSessions() {
        try {
            // Prepare data to save
            const dataToSave = {
                lastUpdated: Date.now(),
                totalVisits: this.currentSession.totalVisits || this.sessionHistory.length + 1,
                sessions: this.sessionHistory.slice(-this.options.maxSessionsStored)
            };

            // Save to local storage
            localStorage.setItem(this.options.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    saveTotalVisits(count) {
        try {
            const storedData = localStorage.getItem(this.options.storageKey);
            let dataToSave = { sessions: [], totalVisits: count };

            if (storedData) {
                dataToSave = JSON.parse(storedData);
                dataToSave.totalVisits = count;
            }

            localStorage.setItem(this.options.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving total visits:', error);
        }
    }

    saveCurrentSession() {
        // Update duration one last time
        this.updateSessionDuration();

        // Check if session is worth saving (e.g., longer than 5 seconds)
        if (this.currentSession.duration < 5000) return;

        // Add to history
        this.sessionHistory.push({ ...this.currentSession });

        // Limit history size
        if (this.sessionHistory.length > this.options.maxSessionsStored) {
            this.sessionHistory = this.sessionHistory.slice(-this.options.maxSessionsStored);
        }

        // Save sessions
        this.saveSessions();
    }

    shouldContinueSession(lastSession) {
        const now = Date.now();

        // Continue if last activity was within the session duration
        return (now - lastSession.lastActiveTime) < this.options.sessionDuration;
    }

    updateSessionDuration() {
        const now = Date.now();
        this.currentSession.duration = now - this.currentSession.startTime;
        this.currentSession.lastActiveTime = now;
    }

    recordPageView(path) {
        if (!this.isActive) return;

        const now = Date.now();
        path = path || window.location.pathname;

        // Increment page view count
        this.currentSession.pageViews[path] = (this.currentSession.pageViews[path] || 0) + 1;

        // Add to events
        this.recordEvent('page_view', { path });

        // Trigger page view event
        this.trigger('pageView', {
            path,
            count: this.currentSession.pageViews[path]
        });
    }

    recordEvent(type, data = {}) {
        if (!this.isActive) return;

        // Add event to list
        this.currentSession.events.push({
            type,
            timestamp: Date.now(),
            data
        });

        // Trigger event
        this.trigger('event', {
            type,
            data
        });
    }

    handleBeforeUnload() {
        // Save current session
        this.saveCurrentSession();
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            // User leaving page
            this.saveCurrentSession();
        } else {
            // User returning to page
            this.currentSession.lastActiveTime = Date.now();
        }
    }

    handleClick() {
        if (!this.isActive) return;

        // Increment click count
        this.currentSession.interactions.clicks++;

        // Record event
        this.recordEvent('click');
    }

    handleScroll() {
        if (!this.isActive) return;

        // Calculate scroll depth
        const scrollTop = window.scrollY;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;

        // Calculate scroll depth as percentage
        const scrollDepth = Math.min(100, Math.max(0, (scrollTop / (documentHeight - windowHeight)) * 100));

        // Update maximum scroll depth
        if (scrollDepth > this.currentSession.interactions.scrollDepth) {
            this.currentSession.interactions.scrollDepth = scrollDepth;

            // Record milestone events
            if (scrollDepth >= 25 && this.currentSession.interactions.scrollDepth < 25) {
                this.recordEvent('scroll_milestone', { depth: 25 });
            } else if (scrollDepth >= 50 && this.currentSession.interactions.scrollDepth < 50) {
                this.recordEvent('scroll_milestone', { depth: 50 });
            } else if (scrollDepth >= 75 && this.currentSession.interactions.scrollDepth < 75) {
                this.recordEvent('scroll_milestone', { depth: 75 });
            } else if (scrollDepth >= 90 && this.currentSession.interactions.scrollDepth < 90) {
                this.recordEvent('scroll_milestone', { depth: 90 });
            }
        }

        // Update time spent in current section
        this.updateSectionTimeSpent();
    }

    updateSectionTimeSpent() {
        // Find current visible section
        const sections = document.querySelectorAll('section[id]');
        if (!sections.length) return;

        // Find section with most visibility
        let currentSection = null;
        let maxVisibility = 0;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how much of the section is visible
            const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
            const visibility = visibleHeight > 0 ? visibleHeight / rect.height : 0;

            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                currentSection = section.id;
            }
        });

        if (currentSection) {
            // Initialize if needed
            if (!this.currentVisibleSection) {
                this.currentVisibleSection = {
                    id: currentSection,
                    startTime: Date.now()
                };
            } else if (this.currentVisibleSection.id !== currentSection) {
                // Section changed, update time spent
                const timeSpent = Date.now() - this.currentVisibleSection.startTime;

                // Add to section time
                const sectionId = this.currentVisibleSection.id;
                this.currentSession.interactions.timeSpentBySection[sectionId] =
                    (this.currentSession.interactions.timeSpentBySection[sectionId] || 0) + timeSpent;

                // Update current section
                this.currentVisibleSection = {
                    id: currentSection,
                    startTime: Date.now()
                };
            }
        }
    }

    getSessionData() {
        // Update current session duration
        this.updateSessionDuration();

        return {
            current: { ...this.currentSession },
            history: [...this.sessionHistory],
            totalVisits: this.currentSession.totalVisits || this.sessionHistory.length + 1
        };
    }
}