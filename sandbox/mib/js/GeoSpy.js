/**
 * GeoSpy.js - A lightweight, plug-and-play geolocation library
 * Perfect for creating location-aware forbidden interfaces
 * 
 * Created by Amartha for Absurd Industries
 * No aliens were harmed in the making of this library
 */

class GeoSpy {
    constructor(options = {}) {
        this.options = {
            ipInfoToken: options.ipInfoToken || null,
            fallbackToIP: options.fallbackToIP !== false,
            useCache: options.useCache !== false,
            cacheExpiry: options.cacheExpiry || 10 * 60 * 1000, // 10 minutes
            mockLocation: options.mockLocation || null,
            onLocationSuccess: options.onLocationSuccess || null,
            onLocationError: options.onLocationError || null,
            onIPLocationSuccess: options.onIPLocationSuccess || null,
            onIPLocationError: options.onIPLocationError || null
        };

        this.locationData = null;
        this.error = null;
        this.pending = false;

        // Initialize cache
        if (this.options.useCache) {
            this._initCache();
        }
    }

    /**
     * Initialize the cache system
     * @private
     */
    _initCache() {
        // Check if we have a cached location
        const cachedData = localStorage.getItem('geospy_location');
        if (cachedData) {
            try {
                const { data, timestamp } = JSON.parse(cachedData);
                const now = new Date().getTime();

                // Check if cache is still valid
                if (now - timestamp < this.options.cacheExpiry) {
                    this.locationData = data;
                } else {
                    localStorage.removeItem('geospy_location');
                }
            } catch (e) {
                localStorage.removeItem('geospy_location');
            }
        }
    }

    /**
     * Save location data to cache
     * @private
     */
    _saveToCache(data) {
        if (!this.options.useCache) return;

        const cacheObj = {
            data,
            timestamp: new Date().getTime()
        };

        localStorage.setItem('geospy_location', JSON.stringify(cacheObj));
    }

    /**
     * Get user's location using browser geolocation API
     * @returns {Promise} Promise resolving to location data
     */
    async getBrowserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const error = new Error('Geolocation is not supported by this browser');
                if (this.options.onLocationError) this.options.onLocationError(error);
                reject(error);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const locationData = {
                            coords: {
                                latitude,
                                longitude,
                                accuracy: position.coords.accuracy
                            },
                            timestamp: position.timestamp,
                            source: 'browser_geolocation'
                        };

                        // Get additional location info using reverse geocoding
                        try {
                            const geocodeData = await this._reverseGeocode(latitude, longitude);
                            locationData.geocode = geocodeData;
                        } catch (geocodeError) {
                            console.warn('Reverse geocoding failed:', geocodeError);
                        }

                        if (this.options.onLocationSuccess) this.options.onLocationSuccess(locationData);
                        resolve(locationData);

                        // Cache the result
                        this._saveToCache(locationData);
                    } catch (error) {
                        if (this.options.onLocationError) this.options.onLocationError(error);
                        reject(error);
                    }
                },
                (error) => {
                    if (this.options.onLocationError) this.options.onLocationError(error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * Get location info based on IP address
     * @returns {Promise} Promise resolving to IP-based location data
     */
    async getIPLocation() {
        try {
            let ipUrl = 'https://ipinfo.io/json';
            if (this.options.ipInfoToken) {
                ipUrl += `?token=${this.options.ipInfoToken}`;
            }

            const response = await fetch(ipUrl);

            if (!response.ok) {
                throw new Error(`IP info request failed with status ${response.status}`);
            }

            const data = await response.json();

            // Parse the location data
            let locationData = {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                loc: data.loc,
                postal: data.postal,
                timezone: data.timezone,
                source: 'ip_geolocation'
            };

            // If we have coordinates, parse them
            if (data.loc && data.loc.includes(',')) {
                const [latitude, longitude] = data.loc.split(',').map(Number);
                locationData.coords = {
                    latitude,
                    longitude
                };
            }

            if (this.options.onIPLocationSuccess) this.options.onIPLocationSuccess(locationData);
            return locationData;
        } catch (error) {
            if (this.options.onIPLocationError) this.options.onIPLocationError(error);
            throw error;
        }
    }

    /**
     * Reverse geocode coordinates to get address information
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {Promise} Promise resolving to geocode data
     * @private
     */
    async _reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'GeoSpy.js Location Library'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Reverse geocoding error:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two points
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @param {string} unit - Unit of measurement (km or mi)
     * @returns {number} Distance between points
     */
    getDistance(lat1, lon1, lat2, lon2, unit = 'km') {
        const R = unit === 'mi' ? 3958.8 : 6371; // Earth radius in miles or km
        const dLat = this._toRad(lat2 - lat1);
        const dLon = this._toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        return d;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     * @private
     */
    _toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Check if the user is within a certain radius of a point
     * @param {number} targetLat - Target latitude
     * @param {number} targetLon - Target longitude
     * @param {number} radiusKm - Radius in kilometers
     * @returns {Promise<boolean>} Promise resolving to true if user is within radius
     */
    async isNearLocation(targetLat, targetLon, radiusKm) {
        try {
            const location = await this.getLocation();

            if (!location || !location.coords) {
                return false;
            }

            const distance = this.getDistance(
                location.coords.latitude,
                location.coords.longitude,
                targetLat,
                targetLon
            );

            return distance <= radiusKm;
        } catch (error) {
            console.error('Error checking proximity:', error);
            return false;
        }
    }

    /**
     * Get the user's location (using cache if available)
     * @returns {Promise} Promise resolving to location data
     */
    async getLocation() {
        // If we already have location data cached and it's valid, return it
        if (this.locationData && this.options.useCache) {
            return this.locationData;
        }

        // If we have a mock location set, use that
        if (this.options.mockLocation) {
            return this.options.mockLocation;
        }

        // If there's already a pending request, wait for it
        if (this.pending) {
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (!this.pending) {
                        clearInterval(checkInterval);
                        if (this.error) {
                            reject(this.error);
                        } else {
                            resolve(this.locationData);
                        }
                    }
                }, 100);
            });
        }

        this.pending = true;
        this.error = null;

        try {
            // Try browser geolocation first
            try {
                const browserLocation = await this.getBrowserLocation();
                this.locationData = browserLocation;
                this.pending = false;
                return browserLocation;
            } catch (browserError) {
                // If browser geolocation fails and fallback is enabled, try IP-based
                if (this.options.fallbackToIP) {
                    const ipLocation = await this.getIPLocation();
                    this.locationData = ipLocation;
                    this.pending = false;
                    return ipLocation;
                } else {
                    throw browserError;
                }
            }
        } catch (error) {
            this.error = error;
            this.pending = false;
            throw error;
        }
    }

    /**
     * Mock the user's location for testing
     * @param {Object} mockData - Mock location data
     */
    mockLocation(mockData) {
        this.options.mockLocation = mockData;
        return this;
    }

    /**
     * Clear the cached location data
     */
    clearCache() {
        localStorage.removeItem('geospy_location');
        this.locationData = null;
        return this;
    }
}

// Export the library
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = GeoSpy;
} else {
    window.GeoSpy = GeoSpy;
}