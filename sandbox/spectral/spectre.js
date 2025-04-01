/**
 * SPECTRAL - Emotional Intelligence Module
 * This module implements user behavior tracking and analysis to create
 * emotionally responsive interfaces
 */

// Cursor Tracking System
// =====================
class CursorTracker {
    constructor(options = {}) {
        this.options = {
            sampleSize: options.sampleSize || 20,
            updateInterval: options.updateInterval || 100,
            historyLength: options.historyLength || 200,
            ...options
        };

        this.positions = [];
        this.velocities = [];
        this.patterns = [];
        this.lastUpdate = Date.now();
        this.isTracking = false;
        this.listeners = {};

        // Emotional state assessment
        this.currentEmotion = 'neutral';
        this.emotionConfidence = 0;
        this.emotionHistory = [];

        // Pattern detection
        this.patternTypes = {
            LINEAR: 'Linear',
            CIRCULAR: 'Circular',
            ERRATIC: 'Erratic',
            HOVERING: 'Hovering',
            DECISIVE: 'Decisive',
            HESITANT: 'Hesitant'
        };

        this.emotionMap = {
            FOCUSED: {
                patterns: [this.patternTypes.LINEAR, this.patternTypes.DECISIVE],
                velocity: 'medium',
                confidence: 0.7
            },
            CURIOUS: {
                patterns: [this.patternTypes.CIRCULAR, this.patternTypes.HOVERING],
                velocity: 'low',
                confidence: 0.6
            },
            CONFUSED: {
                patterns: [this.patternTypes.ERRATIC, this.patternTypes.HESITANT],
                velocity: 'high',
                confidence: 0.8
            },
            EXCITED: {
                patterns: [this.patternTypes.LINEAR, this.patternTypes.ERRATIC],
                velocity: 'high',
                confidence: 0.7
            },
            CALM: {
                patterns: [this.patternTypes.LINEAR, this.patternTypes.HOVERING],
                velocity: 'low',
                confidence: 0.6
            }
        };
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;
        this.handleMouseMove = this.handleMouseMove.bind(this);
        document.addEventListener('mousemove', this.handleMouseMove);

        this.updateInterval = setInterval(() => {
            this.analyzeMovement();
        }, this.options.updateInterval);

        console.log('CursorTracker started');
    }

    stop() {
        if (!this.isTracking) return;

        this.isTracking = false;
        document.removeEventListener('mousemove', this.handleMouseMove);
        clearInterval(this.updateInterval);

        console.log('CursorTracker stopped');
    }

    handleMouseMove(event) {
        const position = {
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        };

        this.positions.push(position);

        // Keep positions array at manageable size
        if (this.positions.length > this.options.historyLength) {
            this.positions.shift();
        }
    }

    analyzeMovement() {
        if (this.positions.length < 2) return;

        // Calculate velocities
        const velocities = [];
        for (let i = 1; i < this.positions.length; i++) {
            const prev = this.positions[i - 1];
            const curr = this.positions[i];

            const deltaX = curr.x - prev.x;
            const deltaY = curr.y - prev.y;
            const deltaTime = curr.timestamp - prev.timestamp;

            if (deltaTime === 0) continue;

            const velocity = {
                value: Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime * 1000,
                direction: Math.atan2(deltaY, deltaX),
                timestamp: curr.timestamp
            };

            velocities.push(velocity);
        }

        // Store recent velocities
        this.velocities = velocities.slice(-this.options.sampleSize);

        // Detect patterns
        this.detectPatterns();

        // Determine emotional state
        this.assessEmotionalState();

        // Trigger update event
        this.trigger('update', {
            positions: this.positions.slice(-this.options.sampleSize),
            velocities: this.velocities,
            patterns: this.patterns,
            emotion: this.currentEmotion,
            confidence: this.emotionConfidence
        });
    }

    detectPatterns() {
        if (this.velocities.length < 5) return;

        const patterns = [];
        const velocityValues = this.velocities.map(v => v.value);
        const directions = this.velocities.map(v => v.direction);

        // Calculate statistics
        const avgVelocity = velocityValues.reduce((sum, v) => sum + v, 0) / velocityValues.length;
        const maxVelocity = Math.max(...velocityValues);
        const minVelocity = Math.min(...velocityValues);
        const varianceVelocity = this.calculateVariance(velocityValues);

        // Direction change analysis
        const directionChanges = this.calculateDirectionChanges(directions);
        const directionVariance = this.calculateVariance(directions);

        // Pattern: Linear movement
        if (directionChanges < 3 && directionVariance < 0.5) {
            patterns.push(this.patternTypes.LINEAR);
        }

        // Pattern: Circular movement
        if (directionChanges > 4 && directionVariance > 0.5 && directionVariance < 2) {
            patterns.push(this.patternTypes.CIRCULAR);
        }

        // Pattern: Erratic movement
        if (varianceVelocity > 10000 && directionChanges > 5) {
            patterns.push(this.patternTypes.ERRATIC);
        }

        // Pattern: Hovering (low velocity, small area)
        if (avgVelocity < 100 && maxVelocity < 200) {
            patterns.push(this.patternTypes.HOVERING);
        }

        // Pattern: Decisive (high velocity, direct path)
        if (avgVelocity > 500 && directionChanges < 2) {
            patterns.push(this.patternTypes.DECISIVE);
        }

        // Pattern: Hesitant (variable velocity, many direction changes)
        if (varianceVelocity > 5000 && directionChanges > 4 && avgVelocity < 300) {
            patterns.push(this.patternTypes.HESITANT);
        }

        this.patterns = patterns;
        return patterns;
    }

    assessEmotionalState() {
        if (this.patterns.length === 0 || this.velocities.length === 0) {
            this.currentEmotion = 'neutral';
            this.emotionConfidence = 0.5;
            return;
        }

        const avgVelocity = this.velocities.reduce((sum, v) => sum + v.value, 0) / this.velocities.length;
        let velocityCategory;

        if (avgVelocity < 100) {
            velocityCategory = 'low';
        } else if (avgVelocity < 500) {
            velocityCategory = 'medium';
        } else {
            velocityCategory = 'high';
        }

        // Score each emotion based on pattern and velocity match
        const emotionScores = {};

        for (const [emotion, criteria] of Object.entries(this.emotionMap)) {
            let score = 0;

            // Pattern match score
            const patternMatches = criteria.patterns.filter(p => this.patterns.includes(p));
            score += (patternMatches.length / criteria.patterns.length) * 0.6;

            // Velocity match score
            if (velocityCategory === criteria.velocity) {
                score += 0.4;
            } else if (
                (velocityCategory === 'medium' && criteria.velocity === 'low') ||
                (velocityCategory === 'medium' && criteria.velocity === 'high')
            ) {
                score += 0.2;
            }

            // Apply confidence factor
            score *= criteria.confidence;

            emotionScores[emotion] = score;
        }

        // Find highest scoring emotion
        let highestScore = 0;
        let dominantEmotion = 'neutral';

        for (const [emotion, score] of Object.entries(emotionScores)) {
            if (score > highestScore) {
                highestScore = score;
                dominantEmotion = emotion;
            }
        }

        // Only change emotion if confidence is high enough
        if (highestScore > 0.4) {
            this.currentEmotion = dominantEmotion.toLowerCase();
            this.emotionConfidence = highestScore;

            // Add to emotion history
            this.emotionHistory.push({
                emotion: this.currentEmotion,
                confidence: this.emotionConfidence,
                timestamp: Date.now()
            });

            // Keep history at manageable size
            if (this.emotionHistory.length > 20) {
                this.emotionHistory.shift();
            }
        }
    }

    calculateVariance(array) {
        if (array.length < 2) return 0;

        const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
        const squareDiffs = array.map(val => {
            const diff = val - mean;
            return diff * diff;
        });

        return squareDiffs.reduce((sum, val) => sum + val, 0) / array.length;
    }

    calculateDirectionChanges(directions) {
        if (directions.length < 2) return 0;

        let changes = 0;
        for (let i = 1; i < directions.length; i++) {
            const diff = Math.abs(directions[i] - directions[i - 1]);
            // Check if there's a significant direction change (more than 0.5 radians or ~30 degrees)
            if (diff > 0.5) {
                changes++;
            }
        }

        return changes;
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

    getDominantEmotionOverTime(duration = 5000) {
        // Get emotions over last 'duration' milliseconds
        const now = Date.now();
        const relevantHistory = this.emotionHistory.filter(entry => (now - entry.timestamp) <= duration);

        if (relevantHistory.length === 0) return { emotion: 'neutral', confidence: 0.5 };

        // Count occurrences of each emotion
        const emotionCounts = {};
        let totalConfidence = 0;

        relevantHistory.forEach(entry => {
            if (!emotionCounts[entry.emotion]) {
                emotionCounts[entry.emotion] = {
                    count: 0,
                    confidenceSum: 0
                };
            }

            emotionCounts[entry.emotion].count++;
            emotionCounts[entry.emotion].confidenceSum += entry.confidence;
            totalConfidence += entry.confidence;
        });

        // Find most frequent emotion weighted by confidence
        let highestScore = 0;
        let dominantEmotion = 'neutral';

        for (const [emotion, data] of Object.entries(emotionCounts)) {
            const score = data.confidenceSum / totalConfidence * data.count;

            if (score > highestScore) {
                highestScore = score;
                dominantEmotion = emotion;
            }
        }

        const avgConfidence = emotionCounts[dominantEmotion].confidenceSum / emotionCounts[dominantEmotion].count;

        return {
            emotion: dominantEmotion,
            confidence: avgConfidence
        };
    }
}

// Engagement Tracking System
// =========================
class EngagementTracker {
    constructor(options = {}) {
        this.options = {
            scrollWeight: options.scrollWeight || 0.2,
            clickWeight: options.clickWeight || 0.3,
            hoverWeight: options.hoverWeight || 0.15,
            textSelectionWeight: options.textSelectionWeight || 0.25,
            decayRate: options.decayRate || 0.05,  // Score decay per second
            updateInterval: options.updateInterval || 1000,
            thresholds: {
                low: options.thresholds?.low || 20,
                medium: options.thresholds?.medium || 50,
                high: options.thresholds?.high || 80
            },
            ...options
        };

        this.engagementScore = 0;
        this.engagementLevel = 'none';
        this.activityPoints = [];
        this.isTracking = false;
        this.listeners = {};

        // Activity metrics
        this.scrollDepth = 0;
        this.scrollSpeed = 0;
        this.lastScrollTop = 0;
        this.clickCount = 0;
        this.clickTimes = [];
        this.hoverElements = new Set();
        this.textSelections = [];
        this.totalTimeSpent = 0;
        this.startTime = null;

        // Interaction history (for pattern analysis)
        this.interactionHistory = [];
        this.interactionSequence = []; // For sequence pattern detection
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;
        this.startTime = Date.now();

        // Bind handlers
        this.handleScroll = this.handleScroll.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseover = this.handleMouseover.bind(this);
        this.handleSelection = this.handleSelection.bind(this);

        // Attach event listeners
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        document.addEventListener('click', this.handleClick);
        document.addEventListener('mouseover', this.handleMouseover);
        document.addEventListener('selectionchange', this.handleSelection);

        // Start update interval
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.options.updateInterval);

        console.log('EngagementTracker started');
    }

    stop() {
        if (!this.isTracking) return;

        this.isTracking = false;

        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('mouseover', this.handleMouseover);
        document.removeEventListener('selectionchange', this.handleSelection);

        clearInterval(this.updateInterval);

        console.log('EngagementTracker stopped');
    }

    handleScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        const windowHeight = window.innerHeight;

        // Calculate scroll depth (percentage of page scrolled)
        const maxScrollTop = documentHeight - windowHeight;
        const currentScrollDepth = (scrollTop / maxScrollTop) * 100;
        this.scrollDepth = Math.max(this.scrollDepth, currentScrollDepth);

        // Calculate scroll speed
        const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);
        this.scrollSpeed = scrollDelta;
        this.lastScrollTop = scrollTop;

        // Add scroll interaction to history
        this.interactionHistory.push({
            type: 'scroll',
            depth: currentScrollDepth,
            speed: scrollDelta,
            timestamp: Date.now()
        });

        this.interactionSequence.push('scroll');

        // Add engagement points for scrolling
        this.addEngagementPoints(
            scrollDelta * 0.1 * this.options.scrollWeight,
            'scroll'
        );
    }

    handleClick(event) {
        this.clickCount++;
        this.clickTimes.push(Date.now());

        // Clean up click times older than 10 seconds
        const tenSecondsAgo = Date.now() - 10000;
        this.clickTimes = this.clickTimes.filter(time => time > tenSecondsAgo);

        // Calculate click frequency (clicks per second over last 10 seconds)
        const clickFrequency = this.clickTimes.length / 10;

        // Add click interaction to history
        this.interactionHistory.push({
            type: 'click',
            element: event.target.tagName,
            frequency: clickFrequency,
            timestamp: Date.now()
        });

        this.interactionSequence.push('click');

        // Add engagement points for clicking
        this.addEngagementPoints(
            10 * this.options.clickWeight,
            'click'
        );
    }

    handleMouseover(event) {
        const element = event.target;
        const elementId = element.id || element.tagName + (element.className ? '.' + element.className.replace(/\s+/g, '.') : '');

        // Only track if we haven't hovered this element recently
        if (!this.hoverElements.has(elementId)) {
            this.hoverElements.add(elementId);

            // Add hover interaction to history
            this.interactionHistory.push({
                type: 'hover',
                element: elementId,
                timestamp: Date.now()
            });

            this.interactionSequence.push('hover');

            // Add engagement points for hovering
            this.addEngagementPoints(
                5 * this.options.hoverWeight,
                'hover'
            );

            // Remove from set after 5 seconds to allow tracking again
            setTimeout(() => {
                this.hoverElements.delete(elementId);
            }, 5000);
        }
    }

    handleSelection() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

        const selectionText = selection.toString().trim();

        // Add selection interaction to history
        this.interactionHistory.push({
            type: 'text_selection',
            length: selectionText.length,
            timestamp: Date.now()
        });

        this.textSelections.push({
            text: selectionText,
            length: selectionText.length,
            timestamp: Date.now()
        });

        this.interactionSequence.push('selection');

        // Add engagement points for text selection
        this.addEngagementPoints(
            selectionText.length * 0.2 * this.options.textSelectionWeight,
            'selection'
        );
    }

    addEngagementPoints(points, source) {
        this.activityPoints.push({
            points: points,
            source: source,
            timestamp: Date.now()
        });
    }

    update() {
        // Update total time spent
        const now = Date.now();
        const sessionDuration = (now - this.startTime) / 1000; // in seconds
        this.totalTimeSpent = sessionDuration;

        // Apply decay to engagement score
        this.engagementScore *= (1 - this.options.decayRate);

        // Add recent activity points
        this.activityPoints.forEach(activity => {
            this.engagementScore += activity.points;
        });

        // Cap engagement score between 0 and 100
        this.engagementScore = Math.max(0, Math.min(100, this.engagementScore));

        // Clear activity points
        this.activityPoints = [];

        // Determine engagement level
        let newEngagementLevel;
        if (this.engagementScore < this.options.thresholds.low) {
            newEngagementLevel = 'low';
        } else if (this.engagementScore < this.options.thresholds.medium) {
            newEngagementLevel = 'medium';
        } else if (this.engagementScore < this.options.thresholds.high) {
            newEngagementLevel = 'high';
        } else {
            newEngagementLevel = 'very_high';
        }

        // Check if engagement level changed
        const levelChanged = this.engagementLevel !== newEngagementLevel;
        this.engagementLevel = newEngagementLevel;

        // Detect interaction patterns
        const patterns = this.detectInteractionPatterns();

        // Trigger update event
        this.trigger('update', {
            score: this.engagementScore,
            level: this.engagementLevel,
            levelChanged: levelChanged,
            timeSpent: this.totalTimeSpent,
            scrollDepth: this.scrollDepth,
            clickCount: this.clickCount,
            patterns: patterns
        });

        // Trigger level change event if level changed
        if (levelChanged) {
            this.trigger('levelChange', {
                oldLevel: this.engagementLevel,
                newLevel: newEngagementLevel,
                score: this.engagementScore
            });
        }
    }

    detectInteractionPatterns() {
        const patterns = [];

        // Analyze last 20 interactions for patterns
        const recentSequence = this.interactionSequence.slice(-20);

        // Check for reading pattern: lots of scrolling with occasional selection
        if (this.countOccurrences(recentSequence, 'scroll') > 12 &&
            this.countOccurrences(recentSequence, 'selection') > 1) {
            patterns.push('reading');
        }

        // Check for browsing pattern: mix of scrolling and clicking
        if (this.countOccurrences(recentSequence, 'scroll') > 8 &&
            this.countOccurrences(recentSequence, 'click') > 5) {
            patterns.push('browsing');
        }

        // Check for exploring pattern: lots of hovering and clicking
        if (this.countOccurrences(recentSequence, 'hover') > 10 &&
            this.countOccurrences(recentSequence, 'click') > 3) {
            patterns.push('exploring');
        }

        // Check for focused interaction: repeated similar interactions
        if (this.hasRepeatedSequence(recentSequence, 3, 3)) {
            patterns.push('focused');
        }

        // Check for idle pattern: very few interactions
        if (recentSequence.length < 5 && this.totalTimeSpent > 30) {
            patterns.push('idle');
        }

        return patterns;
    }

    countOccurrences(array, item) {
        return array.filter(i => i === item).length;
    }

    hasRepeatedSequence(array, sequenceLength, minRepeats) {
        if (array.length < sequenceLength * minRepeats) return false;

        for (let i = 0; i <= array.length - sequenceLength * minRepeats; i++) {
            const sequence = array.slice(i, i + sequenceLength).join(',');
            let repeats = 1;

            for (let j = i + sequenceLength; j <= array.length - sequenceLength; j += sequenceLength) {
                const compareSequence = array.slice(j, j + sequenceLength).join(',');
                if (sequence === compareSequence) {
                    repeats++;
                    if (repeats >= minRepeats) return true;
                } else {
                    break;
                }
            }
        }

        return false;
    }

    getEngagementScore() {
        return this.engagementScore;
    }

    getEngagementLevel() {
        return this.engagementLevel;
    }

    getEngagementData() {
        return {
            score: this.engagementScore,
            level: this.engagementLevel,
            timeSpent: this.totalTimeSpent,
            scrollDepth: this.scrollDepth,
            clickCount: this.clickCount,
            interactionHistory: this.interactionHistory.slice(-20),
            patterns: this.detectInteractionPatterns()
        };
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

// Attention Analysis System
// =======================
class AttentionAnalyzer {
    constructor(options = {}) {
        this.options = {
            heatmapResolution: options.heatmapResolution || 20,
            decayRate: options.decayRate || 0.05,
            updateInterval: options.updateInterval || 500,
            minDwellTime: options.minDwellTime || 300, // ms
            ...options
        };

        this.heatmap = this.createEmptyHeatmap();
        this.currentFocus = null;
        this.dwellTimeStart = null;
        this.interestAreas = new Map(); // Map of element IDs to interest scores
        this.durationMode = true;

        this.isTracking = false;
        this.listeners = {};
    }

    createEmptyHeatmap() {
        const resolution = this.options.heatmapResolution;
        const heatmap = new Array(resolution);

        for (let i = 0; i < resolution; i++) {
            heatmap[i] = new Array(resolution).fill(0);
        }

        return heatmap;
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;

        // Bind handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleScroll = this.handleScroll.bind(this);

        // Attach event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Start update interval
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.options.updateInterval);

        console.log('AttentionAnalyzer started');
    }

    stop() {
        if (!this.isTracking) return;

        this.isTracking = false;

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('scroll', this.handleScroll);

        clearInterval(this.updateInterval);

        console.log('AttentionAnalyzer stopped');
    }

    handleMouseMove(event) {
        const now = Date.now();

        // Get element under cursor
        const element = document.elementFromPoint(event.clientX, event.clientY);
        if (!element) return;

        // Get element identifier
        const elementId = this.getElementIdentifier(element);

        // Add to heatmap
        this.addToHeatmap(event.clientX, event.clientY);

        // Check if focus changed
        if (this.currentFocus !== elementId) {
            // Record dwell time for previous element
            if (this.currentFocus && this.dwellTimeStart) {
                const dwellTime = now - this.dwellTimeStart;
                if (dwellTime >= this.options.minDwellTime) {
                    this.recordInterest(this.currentFocus, dwellTime / 1000);
                }
            }

            // Reset dwell time for new element
            this.currentFocus = elementId;
            this.dwellTimeStart = now;
        }
    }

    handleMouseDown(event) {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        if (!element) return;

        const elementId = this.getElementIdentifier(element);

        // Add extra interest for clicking
        this.recordInterest(elementId, 3);
    }

    handleMouseUp() {
        // Not used currently, but could be used for drag operations
    }

    handleScroll() {
        // Reset dwell time on scroll
        this.dwellTimeStart = Date.now();
    }

    addToHeatmap(x, y) {
        const resolution = this.options.heatmapResolution;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Convert coordinates to heatmap indices
        const i = Math.floor((y / viewportHeight) * resolution);
        const j = Math.floor((x / viewportWidth) * resolution);

        // Skip if out of bounds
        if (i < 0 || i >= resolution || j < 0 || j >= resolution) return;

        // Increment heatmap value
        this.heatmap[i][j] += 1;
    }

    getElementIdentifier(element) {
        if (!element) return null;

        // Try ID first
        if (element.id) return `#${element.id}`;

        // Try data attributes next
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                return `[${attr.name}="${attr.value}"]`;
            }
        }

        // Use tag name and position in parent
        const tagName = element.tagName.toLowerCase();
        if (element.parentElement) {
            const siblings = Array.from(element.parentElement.children);
            const index = siblings.indexOf(element);
            return `${tagName}:nth-child(${index + 1})`;
        }

        return tagName;
    }

    recordInterest(elementId, value) {
        if (!elementId) return;

        // Add or update interest score
        if (this.interestAreas.has(elementId)) {
            this.interestAreas.set(
                elementId,
                this.interestAreas.get(elementId) + value
            );
        } else {
            this.interestAreas.set(elementId, value);
        }
    }

    update() {
        // Apply decay to heatmap
        this.applyHeatmapDecay();

        // Record dwell time for current element
        if (this.currentFocus && this.dwellTimeStart) {
            const now = Date.now();
            const dwellTime = now - this.dwellTimeStart;

            if (dwellTime >= this.options.minDwellTime) {
                this.recordInterest(this.currentFocus, (dwellTime / 1000) * 0.2);
                this.dwellTimeStart = now; // Reset dwell time start
            }
        }

        // Apply decay to interest areas
        this.applyInterestDecay();

        // Get focus areas sorted by interest
        const focusAreas = this.getFocusAreas();

        // Trigger update event
        this.trigger('update', {
            heatmap: this.heatmap,
            focusAreas: focusAreas,
            currentFocus: this.currentFocus
        });
    }

    applyHeatmapDecay() {
        const resolution = this.options.heatmapResolution;
        const decayFactor = 1 - this.options.decayRate;

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                this.heatmap[i][j] *= decayFactor;
            }
        }
    }

    applyInterestDecay() {
        const decayFactor = 1 - (this.options.decayRate / 2); // Slower decay for interest

        this.interestAreas.forEach((value, key) => {
            const newValue = value * decayFactor;

            if (newValue < 0.1) {
                this.interestAreas.delete(key);
            } else {
                this.interestAreas.set(key, newValue);
            }
        });
    }

    getFocusAreas(limit = 5) {
        // Convert map to array and sort by interest value
        const areas = Array.from(this.interestAreas.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([elementId, value]) => ({
                elementId,
                interest: value
            }));

        return areas;
    }

    getHeatmap() {
        return this.heatmap;
    }

    getTopInterestAreas(limit = 3) {
        return this.getFocusAreas(limit);
    }

    resetHeatmap() {
        this.heatmap = this.createEmptyHeatmap();
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

// Main Emotional Intelligence Module
// ================================
class EmotionalIntelligence {
    constructor(options = {}) {
        this.options = {
            ...options
        };

        // Initialize submodules
        this.cursorTracker = new CursorTracker(options.cursor);
        this.engagementTracker = new EngagementTracker(options.engagement);
        this.attentionAnalyzer = new AttentionAnalyzer(options.attention);

        this.isActive = false;
        this.listeners = {};

        // User emotional state
        this.emotionalState = {
            primary: 'neutral',
            secondary: 'neutral',
            confidence: 0.5,
            engagement: 'medium',
            focus: []
        };

        // Responsive elements registry
        this.responsiveElements = new Map();
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;

        // Start all trackers
        this.cursorTracker.start();
        this.engagementTracker.start();
        this.attentionAnalyzer.start();

        // Set up event handlers
        this.cursorTracker.on('update', data => this.handleCursorUpdate(data));
        this.engagementTracker.on('update', data => this.handleEngagementUpdate(data));
        this.attentionAnalyzer.on('update', data => this.handleAttentionUpdate(data));

        console.log('EmotionalIntelligence module started');

        // Initial update
        this.updateEmotionalState();
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Stop all trackers
        this.cursorTracker.stop();
        this.engagementTracker.stop();
        this.attentionAnalyzer.stop();

        console.log('EmotionalIntelligence module stopped');
    }

    handleCursorUpdate(data) {
        // Update emotional state based on cursor data
        if (data.emotion && data.confidence > 0.4) {
            this.emotionalState.primary = data.emotion;
            this.emotionalState.confidence = data.confidence;
        }

        this.updateEmotionalState();
    }

    handleEngagementUpdate(data) {
        // Update emotional state based on engagement data
        this.emotionalState.engagement = data.level;

        if (data.patterns && data.patterns.length > 0) {
            // Use patterns to influence secondary emotion
            const pattern = data.patterns[0];

            switch (pattern) {
                case 'reading':
                    this.emotionalState.secondary = 'focused';
                    break;
                case 'browsing':
                    this.emotionalState.secondary = 'curious';
                    break;
                case 'exploring':
                    this.emotionalState.secondary = 'interested';
                    break;
                case 'focused':
                    this.emotionalState.secondary = 'determined';
                    break;
                case 'idle':
                    this.emotionalState.secondary = 'bored';
                    break;
            }
        }

        this.updateEmotionalState();
    }

    handleAttentionUpdate(data) {
        // Update emotional state based on attention data
        this.emotionalState.focus = data.focusAreas;

        this.updateEmotionalState();
    }

    updateEmotionalState() {
        // Combine all insights to create a coherent emotional state
        const updatedState = { ...this.emotionalState };

        // Calculate overall confidence
        updatedState.confidence = Math.min(
            0.9,
            0.4 + (this.emotionalState.confidence - 0.5) * 0.5
        );

        // Trigger update event
        this.trigger('update', updatedState);

        // Update all responsive elements
        this.updateResponsiveElements(updatedState);
    }

    updateResponsiveElements(state) {
        this.responsiveElements.forEach((config, element) => {
            try {
                // Apply state-based adaptations
                this.applyEmotionalAdaptations(element, config, state);
            } catch (error) {
                console.error('Error updating responsive element:', error);
            }
        });
    }

    applyEmotionalAdaptations(element, config, state) {
        if (!element || !config) return;

        const adaptations = config.adaptations;
        if (!adaptations) return;

        // Apply primary emotion adaptations
        if (adaptations.primary && adaptations.primary[state.primary]) {
            const rules = adaptations.primary[state.primary];
            this.applyAdaptationRules(element, rules, state.confidence);
        }

        // Apply secondary emotion adaptations
        if (adaptations.secondary && adaptations.secondary[state.secondary]) {
            const rules = adaptations.secondary[state.secondary];
            // Apply with lower intensity (0.7)
            this.applyAdaptationRules(element, rules, state.confidence * 0.7);
        }

        // Apply engagement level adaptations
        if (adaptations.engagement && adaptations.engagement[state.engagement]) {
            const rules = adaptations.engagement[state.engagement];
            this.applyAdaptationRules(element, rules, 0.9); // High confidence for engagement
        }

        // Apply focus adaptations
        if (adaptations.focus && state.focus && state.focus.length > 0) {
            // Check if the element is in focus
            const elementId = this.getElementIdentifier(element);
            const isFocused = state.focus.some(area => area.elementId === elementId);

            if (isFocused) {
                const rules = adaptations.focus;
                this.applyAdaptationRules(element, rules, 0.9); // High confidence for focus
            }
        }
    }

    applyAdaptationRules(element, rules, intensity) {
        if (!element || !rules) return;

        // Apply style rules
        if (rules.style) {
            Object.entries(rules.style).forEach(([property, value]) => {
                // Apply with intensity factor for smooth transitions
                if (typeof value === 'number') {
                    const currentValue = parseFloat(element.style[property]) || 0;
                    const targetValue = value;
                    const newValue = currentValue + (targetValue - currentValue) * intensity;
                    element.style[property] = `${newValue}${this.getUnit(property)}`;
                } else if (property === 'color' || property === 'backgroundColor') {
                    // Handle color transitions
                    element.style[property] = value;
                } else {
                    element.style[property] = value;
                }
            });
        }

        // Apply class changes
        if (rules.addClass) {
            rules.addClass.forEach(className => {
                element.classList.add(className);
            });
        }

        if (rules.removeClass) {
            rules.removeClass.forEach(className => {
                element.classList.remove(className);
            });
        }

        // Apply content changes
        if (rules.content && element.innerHTML) {
            // For now, just replace content - could be enhanced to be more sophisticated
            element.innerHTML = rules.content;
        }

        // Apply data attribute changes
        if (rules.data) {
            Object.entries(rules.data).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }

        // Apply custom function if provided
        if (rules.custom && typeof rules.custom === 'function') {
            rules.custom(element, intensity);
        }
    }

    getUnit(property) {
        // Return appropriate unit for CSS properties
        const pxProperties = [
            'width', 'height', 'top', 'left', 'right', 'bottom',
            'margin', 'padding', 'font-size', 'border-width'
        ];

        if (pxProperties.includes(property)) return 'px';

        const percentProperties = [
            'transform-origin'
        ];

        if (percentProperties.includes(property)) return '%';

        return '';
    }

    getElementIdentifier(element) {
        if (!element) return null;

        // Try ID first
        if (element.id) return `#${element.id}`;

        // Try data attributes next
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                return `[${attr.name}="${attr.value}"]`;
            }
        }

        // Use tag name and position in parent
        const tagName = element.tagName.toLowerCase();
        if (element.parentElement) {
            const siblings = Array.from(element.parentElement.children);
            const index = siblings.indexOf(element);
            return `${tagName}:nth-child(${index + 1})`;
        }

        return tagName;
    }

    registerResponsiveElement(element, config) {
        if (!element || !config) return;

        const elementId = typeof element === 'string' ? element : this.getElementIdentifier(element);

        if (typeof element === 'string') {
            // Find element by selector
            element = document.querySelector(element);
            if (!element) {
                console.warn(`Element not found for selector: ${elementId}`);
                return;
            }
        }

        // Store element and config
        this.responsiveElements.set(element, {
            id: elementId,
            ...config
        });

        console.log(`Registered responsive element: ${elementId}`);

        // Apply initial adaptations
        this.applyEmotionalAdaptations(element, config, this.emotionalState);

        return element;
    }

    unregisterResponsiveElement(element) {
        if (typeof element === 'string') {
            // Find element by selector
            element = document.querySelector(element);
        }

        if (element && this.responsiveElements.has(element)) {
            this.responsiveElements.delete(element);
            return true;
        }

        return false;
    }

    getEmotionalState() {
        return { ...this.emotionalState };
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

// Example adaptations configuration
const exampleAdaptations = {
    // Primary emotional state adaptations
    primary: {
        focused: {
            style: {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
            },
            addClass: ['focused-state'],
            removeClass: ['unfocused-state']
        },
        confused: {
            style: {
                opacity: '0.9',
                border: '1px dashed #ccc',
                transition: 'all 0.3s ease'
            },
            addClass: ['confused-state'],
            removeClass: ['focused-state']
        },
        excited: {
            style: {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease'
            },
            addClass: ['excited-state'],
            removeClass: ['calm-state']
        },
        calm: {
            style: {
                transform: 'scale(1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.5s ease'
            },
            addClass: ['calm-state'],
            removeClass: ['excited-state']
        }
    },

    // Secondary emotional state adaptations
    secondary: {
        interested: {
            style: {
                borderColor: '#4a90e2',
                borderWidth: '2px',
                transition: 'all 0.3s ease'
            }
        },
        bored: {
            style: {
                opacity: '0.7',
                transition: 'all 0.5s ease'
            }
        },
        determined: {
            style: {
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
            }
        }
    },

    // Engagement level adaptations
    engagement: {
        high: {
            style: {
                transform: 'scale(1.02)',
                transition: 'all 0.3s ease'
            },
            addClass: ['high-engagement']
        },
        medium: {
            style: {
                transform: 'scale(1)',
                transition: 'all 0.3s ease'
            },
            removeClass: ['high-engagement', 'low-engagement']
        },
        low: {
            style: {
                transform: 'scale(0.98)',
                opacity: '0.8',
                transition: 'all 0.3s ease'
            },
            addClass: ['low-engagement']
        }
    },

    // Focus adaptation
    focus: {
        style: {
            outline: '2px solid rgba(74, 144, 226, 0.5)',
            zIndex: '10',
            transition: 'all 0.3s ease'
        },
        addClass: ['in-focus']
    }
};

// Initializer for SPECTRAL emotional components
function initSpectralEmotionalComponents() {
    // Create emotional intelligence module
    const emotionalIntelligence = new EmotionalIntelligence({
        cursor: {
            sampleSize: 20,
            updateInterval: 100
        },
        engagement: {
            scrollWeight: 0.2,
            clickWeight: 0.3,
            hoverWeight: 0.15,
            textSelectionWeight: 0.25,
            decayRate: 0.05,
            updateInterval: 1000
        },
        attention: {
            heatmapResolution: 20,
            decayRate: 0.05,
            updateInterval: 500,
            minDwellTime: 300
        }
    });

    // Start tracking
    emotionalIntelligence.start();

    // Register elements with adaptations
    const emotionDemo = document.querySelector('[data-emotion-demo="cursor"]');
    if (emotionDemo) {
        emotionalIntelligence.registerResponsiveElement(emotionDemo, {
            adaptations: exampleAdaptations
        });

        // Update cursor emotion display
        emotionalIntelligence.on('update', state => {
            const emotionElement = emotionDemo.querySelector('[data-cursor-emotion]');
            const patternElement = emotionDemo.querySelector('[data-cursor-pattern]');

            if (emotionElement) {
                emotionElement.textContent = state.primary;
            }

            if (patternElement && state.secondary) {
                patternElement.textContent = state.secondary;
            }
        });
    }

    // Register engagement demo
    const engagementDemo = document.querySelector('[data-emotion-demo="engagement"]');
    if (engagementDemo) {
        emotionalIntelligence.registerResponsiveElement(engagementDemo, {
            adaptations: exampleAdaptations
        });

        // Get engagement elements
        const scoreElement = engagementDemo.querySelector('[data-engagement-score]');
        const barElement = engagementDemo.querySelector('[data-engagement-bar]');
        const contentElement = engagementDemo.querySelector('[data-engagement-content]');

        // Update engagement display
        if (scoreElement && barElement) {
            const engagementTracker = emotionalIntelligence.engagementTracker;

            // Update score and bar
            setInterval(() => {
                const score = Math.round(engagementTracker.getEngagementScore());
                scoreElement.textContent = score;
                barElement.style.width = `${score}%`;

                // Show hidden content based on engagement score
                if (contentElement) {
                    const revealElements = contentElement.querySelectorAll('[data-engagement-reveal]');
                    revealElements.forEach(el => {
                        const threshold = parseInt(el.getAttribute('data-engagement-reveal')) * 25;
                        if (score >= threshold) {
                            el.style.opacity = '1';
                            el.style.transition = 'opacity 0.5s ease';
                        }
                    });
                }
            }, 1000);
        }
    }

    // Register rhythm demo
    const rhythmDemo = document.querySelector('[data-emotion-demo="rhythm"]');
    if (rhythmDemo) {
        emotionalIntelligence.registerResponsiveElement(rhythmDemo, {
            adaptations: exampleAdaptations
        });

        // Get rhythm elements
        const targetElement = rhythmDemo.querySelector('[data-rhythm-target]');
        const patternElement = rhythmDemo.querySelector('[data-rhythm-pattern]');
        const detectedElement = rhythmDemo.querySelector('[data-rhythm-detected]');

        if (targetElement && patternElement && detectedElement) {
            // Click history
            const clickTimes = [];
            const rhythmVisualizers = Array.from(rhythmDemo.querySelectorAll('[data-rhythm-vis]'));

            // Set up click handler
            targetElement.addEventListener('click', () => {
                // Record click time
                clickTimes.push(Date.now());

                // Keep only last 8 clicks
                if (clickTimes.length > 8) {
                    clickTimes.shift();
                }

                // Calculate intervals between clicks
                const intervals = [];
                for (let i = 1; i < clickTimes.length; i++) {
                    intervals.push(clickTimes[i] - clickTimes[i - 1]);
                }

                // Update visuals
                visualizeRhythm(intervals, rhythmVisualizers);

                // Detect pattern
                const pattern = detectRhythmPattern(intervals);
                patternElement.textContent = pattern.description;
                detectedElement.textContent = pattern.type;
            });

            // Rhythm visualization function
            function visualizeRhythm(intervals, visualizers) {
                if (intervals.length === 0 || visualizers.length === 0) return;

                // Normalize intervals to visual height
                const maxInterval = Math.max(...intervals, 1000);
                const normalizedIntervals = intervals.map(interval =>
                    Math.min(Math.max(interval / maxInterval, 0.1), 1)
                );

                // Update visualizers
                visualizers.forEach((vis, i) => {
                    if (i < normalizedIntervals.length) {
                        const height = normalizedIntervals[i] * 64; // Max height 64px
                        vis.style.height = `${height}px`;
                        vis.style.backgroundColor = getIntervalColor(normalizedIntervals[i]);
                    } else {
                        // Default state for unused visualizers
                        vis.style.height = '8px';
                        vis.style.backgroundColor = '#ccc';
                    }
                });
            }

            // Get color based on interval
            function getIntervalColor(normalizedInterval) {
                if (normalizedInterval < 0.3) return '#3498db'; // Fast (blue)
                if (normalizedInterval < 0.6) return '#2ecc71'; // Medium (green)
                return '#e74c3c'; // Slow (red)
            }

            // Detect rhythm pattern
            function detectRhythmPattern(intervals) {
                if (intervals.length < 2) {
                    return { type: 'None', description: 'Click more to detect a pattern' };
                }

                // Calculate mean interval
                const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

                // Calculate standard deviation
                const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
                const stdDev = Math.sqrt(variance);

                // Calculate coefficient of variation
                const cv = stdDev / mean;

                if (cv < 0.1) {
                    return {
                        type: 'Steady',
                        description: 'Steady rhythm detected'
                    };
                } else if (cv < 0.3) {
                    return {
                        type: 'Natural',
                        description: 'Natural rhythm detected'
                    };
                } else {
                    // Check for alternating patterns
                    if (intervals.length >= 4) {
                        const even = intervals.filter((_, i) => i % 2 === 0);
                        const odd = intervals.filter((_, i) => i % 2 === 1);

                        const evenMean = even.reduce((sum, val) => sum + val, 0) / even.length;
                        const oddMean = odd.reduce((sum, val) => sum + val, 0) / odd.length;

                        const ratio = Math.max(evenMean, oddMean) / Math.min(evenMean, oddMean);

                        if (ratio > 1.5 && ratio < 3) {
                            return {
                                type: 'Alternating',
                                description: 'Alternating rhythm detected'
                            };
                        }
                    }

                    return {
                        type: 'Complex',
                        description: 'Complex rhythm detected'
                    };
                }
            }
        }
    }

    // Register attention demo
    const attentionDemo = document.querySelector('[data-emotion-demo="attention"]');
    if (attentionDemo) {
        emotionalIntelligence.registerResponsiveElement(attentionDemo, {
            adaptations: exampleAdaptations
        });

        // Get attention elements
        const attentionAreas = Array.from(attentionDemo.querySelectorAll('[data-attention-area]'));
        const focusElement = attentionDemo.querySelector('[data-attention-focus]');
        const interestElement = attentionDemo.querySelector('[data-attention-interest]');

        if (attentionAreas.length > 0 && focusElement && interestElement) {
            // Area interaction data
            const areaInteractions = new Map();

            // Initialize area interactions
            attentionAreas.forEach(area => {
                const areaId = area.getAttribute('data-attention-area');
                areaInteractions.set(areaId, {
                    hovers: 0,
                    clicks: 0,
                    lastInteraction: 0
                });

                // Add event listeners
                area.addEventListener('mouseover', () => {
                    const data = areaInteractions.get(areaId);
                    data.hovers++;
                    data.lastInteraction = Date.now();
                    updateAttentionDisplay();
                });

                area.addEventListener('click', () => {
                    const data = areaInteractions.get(areaId);
                    data.clicks++;
                    data.lastInteraction = Date.now();
                    updateAttentionDisplay();

                    // Visual feedback
                    area.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    setTimeout(() => {
                        area.style.backgroundColor = '';
                    }, 300);
                });
            });

            // Update attention display
            function updateAttentionDisplay() {
                // Calculate focus areas
                const focusAreas = Array.from(areaInteractions.entries())
                    .map(([areaId, data]) => ({
                        areaId,
                        score: data.clicks * 3 + data.hovers * 1,
                        lastInteraction: data.lastInteraction
                    }))
                    .filter(area => area.score > 0)
                    .sort((a, b) => b.score - a.score);

                // Update focus display
                if (focusAreas.length > 0) {
                    const focusText = focusAreas
                        .map(area => `Area ${area.areaId} (${area.score})`)
                        .join(', ');

                    focusElement.textContent = focusText;

                    // Determine interest based on interaction patterns
                    let interest = 'None yet';

                    const totalClicks = Array.from(areaInteractions.values())
                        .reduce((sum, data) => sum + data.clicks, 0);

                    const totalHovers = Array.from(areaInteractions.values())
                        .reduce((sum, data) => sum + data.hovers, 0);

                    if (totalClicks > 5 || totalHovers > 10) {
                        if (focusAreas.length === 1) {
                            interest = `Focused on Area ${focusAreas[0].areaId}`;
                        } else if (focusAreas.length === 2) {
                            interest = `Comparing Areas ${focusAreas[0].areaId} and ${focusAreas[1].areaId}`;
                        } else {
                            interest = 'Exploring multiple areas';
                        }
                    }

                    interestElement.textContent = interest;
                }
            }
        }
    }

    return emotionalIntelligence;
}

// Usage example:
// const emotionalIntelligence = initSpectralEmotionalComponents();
//
// // Register a custom element with emotions
// emotionalIntelligence.registerResponsiveElement('#my-element', {
//   adaptations: {
//     primary: {
//       focused: {
//         style: { transform: 'scale(1.05)' },
//         addClass: ['focused-state']
//       }
//     },
//     engagement: {
//       high: {
//         style: { backgroundColor: '#f0f8ff' }
//       }
//     }
//   }
// });