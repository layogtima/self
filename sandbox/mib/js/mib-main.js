/**
 * MIB Command Center - Main JavaScript
 * Men in Black Central Intelligence Network
 * 
 * WARNING: CLASSIFIED ULTRAVIOLET
 * Unauthorized access will result in neuralyzation
 */

// Initialize Vue app
const { createApp, ref, onMounted, watch } = Vue;

const app = createApp({
    setup() {
        // ---- Authentication State ----
        const isAuthenticated = ref(false);
        const agentId = ref('');
        const accessCode = ref('');
        const loginStage = ref('ready'); // 'ready', 'verifying', 'scanning', 'complete'
        const loginMessage = ref('Authenticating...');
        const terminalLines = ref([
            'MIB CENTRAL INTELLIGENCE NETWORK v23.7.31',
            'INITIALIZING SECURE CONNECTION...',
            'ENCRYPTION PROTOCOLS ACTIVATED',
            'ESTABLISHING QUANTUM LINK...',
            'READY FOR AUTHENTICATION'
        ]);
        const currentInput = ref('');

        // ---- Navigation ----
        const currentPath = ref('/dashboard');
        const navigation = ref([
            { name: 'DASHBOARD', path: '/dashboard' },
            { name: 'INCIDENTS', path: 'incidents.html' },
            { name: 'ALIENS', path: 'aliens.html' },
            { name: 'TECH', path: 'tech.html' },
            { name: 'COMMUNICATIONS', path: 'communications.html' }
        ]);

        // ---- Location Data ----
        const geoSpy = ref(null);
        const locationData = ref(null);
        const lastCheckIn = ref(Date.now() - 1000 * 60 * 60 * 3); // 3 hours ago
        const fieldStatus = ref('ACTIVE');

        // ---- Dashboard Data ----
        const alerts = ref([]);
        const localAlienCount = ref(Math.floor(Math.random() * 20) + 5);
        const localThreatLevel = ref('MODERATE');
        const memoryWipes = ref(Math.floor(Math.random() * 10));

        // ---- Missions & Incidents ----
        const activeIncidents = ref([]);
        const activeMissions = ref([
            {
                id: 'M-7734',
                title: 'CENTRAL PARK ANOMALY',
                description: 'Investigate temporal disturbance near Bethesda Fountain. Multiple civilian reports of "disappearing ducks."',
                team: 'SOLO',
                location: 'CENTRAL PARK',
                status: 'IN PROGRESS',
                deadline: Date.now() + 1000 * 60 * 60 * 24 * 2, // 2 days from now
                priority: 'MEDIUM'
            },
            {
                id: 'M-8912',
                title: 'BROOKLYN TECH RECOVERY',
                description: 'Retrieve unauthorized Arcturian power cell from electronics shop. Owner unaware of item\'s nature.',
                team: 'AGENT K, AGENT J',
                location: 'BROOKLYN',
                status: 'ASSIGNED',
                deadline: Date.now() + 1000 * 60 * 60 * 12, // 12 hours from now
                priority: 'HIGH'
            }
        ]);

        // ---- Simulation Data ----
        // This would be replaced by actual data from GeoSpy and OSMEnvironment in a real implementation
        const simulateIncidents = () => {
            const incidentTypes = [
                { type: 'Alien Sighting', threat: 'LOW' },
                { type: 'Technology Breach', threat: 'MEDIUM' },
                { type: 'Memory Anomaly', threat: 'MEDIUM' },
                { type: 'Unauthorized Portal', threat: 'HIGH' }
            ];

            const incidentTitles = [
                'Unusual Activity at Local Cafe',
                'Unregistered Visitor at Shopping Mall',
                'Strange Readings from Subway Station',
                'Temporal Distortion in Park',
                'Energy Signature at Office Building'
            ];

            const incidentDescriptions = [
                'Multiple witnesses reported glowing eyes on an individual ordering coffee. Possible Nylonian tourist without proper eye shields.',
                'Security cameras captured shapeshifting behavior in restroom. Subject appears to be changing form in 23-minute cycles.',
                'Electromagnetic anomalies consistent with unregistered tech. Local electronics malfunctioning within 50m radius.',
                'Reports of lost time from multiple civilians. Average of 7.3 minutes unaccounted for. Possible unauthorized neuralizer use.',
                'Unusual radiation patterns detected. Consistent with Quyluthian propulsion systems. No landing permit on file.'
            ];

            // Generate 3-8 random incidents
            const count = Math.floor(Math.random() * 6) + 3;
            const incidents = [];

            for (let i = 0; i < count; i++) {
                const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
                const title = incidentTitles[Math.floor(Math.random() * incidentTitles.length)];
                const description = incidentDescriptions[Math.floor(Math.random() * incidentDescriptions.length)];

                incidents.push({
                    id: `I-${Math.floor(Math.random() * 10000)}`,
                    title,
                    description,
                    type: type.type,
                    threatLevel: type.threat,
                    timestamp: Date.now() - (Math.random() * 1000 * 60 * 60 * 24), // Random time in last 24 hours
                    coords: locationData.value && locationData.value.coords ? {
                        latitude: locationData.value.coords.latitude + (Math.random() * 0.02 - 0.01),
                        longitude: locationData.value.coords.longitude + (Math.random() * 0.02 - 0.01)
                    } : null
                });
            }

            activeIncidents.value = incidents;

            // Set local threat level based on incidents
            const highCount = incidents.filter(i => i.threatLevel === 'HIGH').length;
            const mediumCount = incidents.filter(i => i.threatLevel === 'MEDIUM').length;

            if (highCount >= 2) {
                localThreatLevel.value = 'HIGH';
            } else if (highCount === 1 || mediumCount >= 3) {
                localThreatLevel.value = 'MODERATE';
            } else {
                localThreatLevel.value = 'LOW';
            }

            // Add an alert for high threat level
            if (localThreatLevel.value === 'HIGH' && alerts.value.length === 0) {
                alerts.value.push({
                    message: 'HIGH THREAT LEVEL DETECTED IN YOUR SECTOR. PROCEED WITH CAUTION. BACKUP AVAILABLE ON REQUEST.',
                    timestamp: Date.now()
                });
            }
        };

        // ---- Terminal Animation ----
        const simulateTyping = (message, callback) => {
            let i = 0;
            currentInput.value = '';

            const interval = setInterval(() => {
                if (i < message.length) {
                    currentInput.value += message.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    if (callback) setTimeout(callback, 500);
                }
            }, 50);
        };

        // ---- Authentication Handlers ----
        const validateCredentials = () => {
            if (!agentId.value || !accessCode.value) {
                terminalLines.value.push('ERROR: CREDENTIALS REQUIRED');
                return;
            }

            loginStage.value = 'verifying';
            loginMessage.value = 'Verifying credentials...';

            terminalLines.value.push(`> AGENT ID: ${agentId.value}`);
            terminalLines.value.push('> ACCESS CODE: ********');

            simulateTyping('VERIFYING CREDENTIALS...', () => {
                terminalLines.value.push('CREDENTIALS ACCEPTED');
                currentInput.value = '';

                loginStage.value = 'scanning';
                loginMessage.value = 'Performing biometric scan...';

                simulateTyping('INITIATING BIOMETRIC SCAN...', () => {
                    terminalLines.value.push('BIOMETRIC SCAN COMPLETE');
                    terminalLines.value.push('DNA SIGNATURE VERIFIED');
                    currentInput.value = '';

                    loginStage.value = 'complete';
                    loginMessage.value = 'Access granted. Welcome, Agent.';

                    simulateTyping('ACCESS GRANTED. WELCOME, AGENT ' + agentId.value, () => {
                        setTimeout(() => {
                            isAuthenticated.value = true;

                            // Initialize GeoSpy after login
                            initGeoSpy();

                            // Simulate incidents based on location
                            setTimeout(simulateIncidents, 2000);
                        }, 1000);
                    });
                });
            });
        };

        const emergencyAccess = () => {
            terminalLines.value.push('> EMERGENCY ACCESS PROTOCOL INITIATED');
            terminalLines.value.push('> WARNING: THIS ACCESS WILL BE LOGGED');

            agentId.value = 'J';
            accessCode.value = 'EMERGENCY';
            validateCredentials();
        };

        const logout = () => {
            isAuthenticated.value = false;
            agentId.value = '';
            accessCode.value = '';
            loginStage.value = 'ready';
            terminalLines.value = [
                'MIB CENTRAL INTELLIGENCE NETWORK v23.7.31',
                'SECURE CONNECTION TERMINATED',
                'SESSION CLOSED',
                'READY FOR AUTHENTICATION'
            ];

            // Clean up location tracking
            if (geoSpy.value) {
                geoSpy.value.clearCache();
            }
        };

        // ---- GeoSpy Integration ----
        const initGeoSpy = () => {
            // Initialize GeoSpy with callback handlers
            geoSpy.value = new GeoSpy({
                fallbackToIP: true,
                useCache: true,
                onLocationSuccess: (data) => {
                    console.log('Location acquired:', data);
                    locationData.value = data;
                },
                onLocationError: (error) => {
                    console.warn('Browser location error:', error);
                    alerts.value.push({
                        message: 'WARNING: LOCATION TRACKING COMPROMISED. SWITCH TO SECURE CHANNEL.',
                        timestamp: Date.now()
                    });
                },
                onIPLocationSuccess: (data) => {
                    console.log('IP location acquired:', data);
                    locationData.value = data;
                }
            });

            // Get initial location
            geoSpy.value.getLocation()
                .then(location => {
                    locationData.value = location;
                    console.log('Initial location:', location);
                })
                .catch(error => {
                    console.error('Failed to get location:', error);
                    fieldStatus.value = 'COMPROMISED';
                });
        };

        const refreshLocationData = () => {
            if (!geoSpy.value) return;

            geoSpy.value.clearCache();
            geoSpy.value.getLocation()
                .then(location => {
                    locationData.value = location;
                    lastCheckIn.value = Date.now();

                    // Refresh incidents based on new location
                    simulateIncidents();
                })
                .catch(error => {
                    console.error('Failed to refresh location:', error);
                    fieldStatus.value = 'COMPROMISED';

                    alerts.value.push({
                        message: 'LOCATION TRACKING FAILURE. CHECK EQUIPMENT AND SURROUNDINGS FOR INTERFERENCE.',
                        timestamp: Date.now()
                    });
                });
        };

        // ---- Utility Functions ----
        const formatTime = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const formatDate = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        };

        const formatTimeAgo = (timestamp) => {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);

            if (seconds < 60) return `${seconds} SECONDS AGO`;

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes} MINUTES AGO`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} HOURS AGO`;

            const days = Math.floor(hours / 24);
            return `${days} DAYS AGO`;
        };

        const truncate = (text, length) => {
            if (text.length <= length) return text;
            return text.substring(0, length) + '...';
        };

        // ---- Route Handling ----
        const handleRouteChange = () => {
            const hash = window.location.hash;

            if (hash) {
                const path = hash.replace('#', '');
                currentPath.value = path;
            } else {
                currentPath.value = '/dashboard';
            }
        };

        // ---- Lifecycle Hooks ----
        onMounted(() => {
            // Check for URL hash changes
            window.addEventListener('hashchange', handleRouteChange);
            handleRouteChange();

            // Uncomment for auto-login during development
            // setTimeout(() => {
            //   agentId.value = 'J';
            //   accessCode.value = 'nosy';
            //   validateCredentials();
            // }, 1000);

            // Simulate terminal welcome text typing
            setTimeout(() => {
                terminalLines.value = [];
                simulateTyping('MIB CENTRAL INTELLIGENCE NETWORK v23.7.31', () => {
                    simulateTyping('INITIALIZING SECURE CONNECTION...', () => {
                        simulateTyping('ENCRYPTION PROTOCOLS ACTIVATED', () => {
                            simulateTyping('ESTABLISHING QUANTUM LINK...', () => {
                                simulateTyping('READY FOR AUTHENTICATION', () => {
                                    currentInput.value = '';
                                });
                            });
                        });
                    });
                });
            }, 1000);
        });

        // Monitor location and update check-in status
        watch(locationData, (newLocation) => {
            if (newLocation) {
                lastCheckIn.value = Date.now();
                fieldStatus.value = 'ACTIVE';
            }
        });

        // Regular location checks
        setInterval(() => {
            if (isAuthenticated.value && geoSpy.value) {
                geoSpy.value.getLocation()
                    .then(location => {
                        locationData.value = location;
                    })
                    .catch(error => {
                        console.warn('Background location check failed:', error);
                    });
            }
        }, 60000); // Check every minute

        // Return reactive values and methods for use in the template
        return {
            // Authentication
            isAuthenticated,
            agentId,
            accessCode,
            loginStage,
            loginMessage,
            terminalLines,
            currentInput,
            validateCredentials,
            emergencyAccess,
            logout,

            // Navigation
            currentPath,
            navigation,

            // Location
            locationData,
            lastCheckIn,
            fieldStatus,
            refreshLocationData,

            // Dashboard Data
            alerts,
            localAlienCount,
            localThreatLevel,
            memoryWipes,
            activeIncidents,
            activeMissions,

            // Utility Functions
            formatTime,
            formatDate,
            formatTimeAgo,
            truncate
        };
    }
});

app.mount('#app');