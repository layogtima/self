/**
 * OSM Environment Integration for GeoSpy
 * Leverages OpenStreetMap data to create interactive elements based on real locations
 */

class OSMEnvironment {
  constructor(options = {}) {
    this.options = {
      radius: options.radius || 2, // km
      map: options.map || null,
      categories: options.categories || [
        'amenity', 'tourism', 'leisure',
        'natural', 'building', 'historic'
      ],
      maxFeatures: options.maxFeatures || 50,
      onDataLoaded: options.onDataLoaded || null
    };

    this.pois = [];
    this.customFeatures = options.customFeatures || [];
  }

  /**
   * Fetch nearby points of interest from OpenStreetMap
   * @param {Object} location - Location object with coords
   * @returns {Promise} Promise resolving to array of POIs
   */
  async fetchNearbyPOIs(location) {
    if (!location || !location.coords) {
      throw new Error('Valid location with coordinates required');
    }

    const { latitude, longitude } = location.coords;

    // Calculate bounding box (roughly radius km around the point)
    const latOffset = this.options.radius / 111.32; // 1 degree lat is approx 111.32km
    const lonOffset = this.options.radius / (111.32 * Math.cos(latitude * Math.PI / 180));

    const bbox = {
      south: latitude - latOffset,
      west: longitude - lonOffset,
      north: latitude + latOffset,
      east: longitude + lonOffset
    };

    // Build Overpass API query
    // This queries for various interesting features within our bounding box
    const overpassQuery = `
        [out:json];
        (
          ${this.options.categories.map(category =>
      `node["${category}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
             way["${category}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
             relation["${category}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`
    ).join('\n')}
        );
        out center body;
      `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Overpass API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Process OSM data into standardized POIs
      this.pois = this._processOSMData(data, location);

      // Add custom features if any
      if (this.customFeatures.length > 0) {
        this.pois = [...this.pois, ...this.customFeatures];
      }

      // Sort by distance
      this.pois.sort((a, b) => a.distance - b.distance);

      // Limit number of features to prevent cluttering
      if (this.pois.length > this.options.maxFeatures) {
        this.pois = this.pois.slice(0, this.options.maxFeatures);
      }

      if (this.options.onDataLoaded) {
        this.options.onDataLoaded(this.pois);
      }

      return this.pois;
    } catch (error) {
      console.error('Error fetching OSM data:', error);
      throw error;
    }
  }

  /**
   * Process raw OSM data into standardized POIs
   * @private
   */
  _processOSMData(osmData, userLocation) {
    const { latitude, longitude } = userLocation.coords;
    const processedPOIs = [];

    if (!osmData.elements || !Array.isArray(osmData.elements)) {
      return [];
    }

    for (const element of osmData.elements) {
      // Skip elements without tags
      if (!element.tags) continue;

      // Get coordinates based on element type
      let lat, lon;

      if (element.type === 'node') {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        continue; // Skip if we can't determine coordinates
      }

      // Calculate distance to user
      const distance = this._calculateDistance(
        latitude, longitude, lat, lon
      );

      // Determine the type of location
      const locationType = this._determineLocationType(element.tags);

      // Skip if we couldn't determine a type
      if (!locationType) continue;

      // Add to our processed POIs
      processedPOIs.push({
        id: `osm-${element.id}`,
        osmId: element.id,
        type: locationType.type,
        subtype: locationType.subtype,
        name: element.tags.name || locationType.defaultName,
        coords: { latitude: lat, longitude: lon },
        distance: distance,
        tags: element.tags,
        description: this._generateDescription(element.tags, locationType),
        icon: locationType.icon,
        interactionType: locationType.interactionType
      });
    }

    return processedPOIs;
  }

  /**
   * Calculate distance between two coordinates
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @private
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Determine the type of location based on OSM tags
   * @private
   */
  _determineLocationType(tags) {
    // These maps OSM tags to our application's categories
    // and provides default names, icons, and possible interactions

    // Check for amenities
    if (tags.amenity) {
      const amenityTypes = {
        'restaurant': {
          type: 'amenity',
          subtype: 'food',
          defaultName: 'Restaurant',
          icon: 'restaurant',
          interactionType: 'civilian-sighting'
        },
        'cafe': {
          type: 'amenity',
          subtype: 'food',
          defaultName: 'Café',
          icon: 'cafe',
          interactionType: 'civilian-sighting'
        },
        'bar': {
          type: 'amenity',
          subtype: 'nightlife',
          defaultName: 'Bar',
          icon: 'bar',
          interactionType: 'entity-sighting'
        },
        'hospital': {
          type: 'amenity',
          subtype: 'healthcare',
          defaultName: 'Hospital',
          icon: 'hospital',
          interactionType: 'memory-anomaly'
        },
        'school': {
          type: 'amenity',
          subtype: 'education',
          defaultName: 'School',
          icon: 'school',
          interactionType: 'strange-activity'
        },
        'university': {
          type: 'amenity',
          subtype: 'education',
          defaultName: 'University',
          icon: 'university',
          interactionType: 'technology-breach'
        },
        'police': {
          type: 'amenity',
          subtype: 'security',
          defaultName: 'Police Station',
          icon: 'police',
          interactionType: 'agency-outpost'
        },
        'library': {
          type: 'amenity',
          subtype: 'education',
          defaultName: 'Library',
          icon: 'library',
          interactionType: 'information-breach'
        }
      };

      if (amenityTypes[tags.amenity]) {
        return amenityTypes[tags.amenity];
      }

      // Generic amenity
      return {
        type: 'amenity',
        subtype: tags.amenity,
        defaultName: tags.amenity.charAt(0).toUpperCase() + tags.amenity.slice(1),
        icon: 'marker',
        interactionType: 'observation-point'
      };
    }

    // Check for natural features
    if (tags.natural) {
      const naturalTypes = {
        'water': {
          type: 'natural',
          subtype: 'water',
          defaultName: 'Water Body',
          icon: 'water',
          interactionType: 'anomalous-readings'
        },
        'peak': {
          type: 'natural',
          subtype: 'mountain',
          defaultName: 'Mountain Peak',
          icon: 'mountain',
          interactionType: 'surveillance-point'
        },
        'forest': {
          type: 'natural',
          subtype: 'woodland',
          defaultName: 'Forest',
          icon: 'forest',
          interactionType: 'entity-sighting'
        },
        'beach': {
          type: 'natural',
          subtype: 'coastal',
          defaultName: 'Beach',
          icon: 'beach',
          interactionType: 'strange-activity'
        }
      };

      if (naturalTypes[tags.natural]) {
        return naturalTypes[tags.natural];
      }

      // Generic natural feature
      return {
        type: 'natural',
        subtype: tags.natural,
        defaultName: tags.natural.charAt(0).toUpperCase() + tags.natural.slice(1),
        icon: 'leaf',
        interactionType: 'observation-point'
      };
    }

    // Check for historic sites
    if (tags.historic) {
      return {
        type: 'historic',
        subtype: tags.historic,
        defaultName: 'Historic Site',
        icon: 'historic',
        interactionType: 'temporal-anomaly'
      };
    }

    // Check for tourism spots
    if (tags.tourism) {
      const tourismTypes = {
        'museum': {
          type: 'tourism',
          subtype: 'cultural',
          defaultName: 'Museum',
          icon: 'museum',
          interactionType: 'artifact-containment'
        },
        'hotel': {
          type: 'tourism',
          subtype: 'accommodation',
          defaultName: 'Hotel',
          icon: 'hotel',
          interactionType: 'visitor-lodging'
        },
        'attraction': {
          type: 'tourism',
          subtype: 'attraction',
          defaultName: 'Tourist Attraction',
          icon: 'attraction',
          interactionType: 'surveillance-point'
        }
      };

      if (tourismTypes[tags.tourism]) {
        return tourismTypes[tags.tourism];
      }

      // Generic tourism spot
      return {
        type: 'tourism',
        subtype: tags.tourism,
        defaultName: 'Tourist Spot',
        icon: 'tourism',
        interactionType: 'observation-point'
      };
    }

    // Check for buildings
    if (tags.building) {
      const buildingTypes = {
        'apartments': {
          type: 'building',
          subtype: 'residential',
          defaultName: 'Apartment Building',
          icon: 'building',
          interactionType: 'civilian-sighting'
        },
        'commercial': {
          type: 'building',
          subtype: 'commercial',
          defaultName: 'Commercial Building',
          icon: 'building',
          interactionType: 'surveillance-point'
        },
        'industrial': {
          type: 'building',
          subtype: 'industrial',
          defaultName: 'Industrial Building',
          icon: 'industry',
          interactionType: 'technology-breach'
        }
      };

      if (buildingTypes[tags.building]) {
        return buildingTypes[tags.building];
      }

      // Generic building
      return {
        type: 'building',
        subtype: tags.building,
        defaultName: 'Building',
        icon: 'building',
        interactionType: 'observation-point'
      };
    }

    // Default if no specific type is found
    return null;
  }

  /**
   * Generate a description for a POI based on its tags and type
   * @private
   */
  _generateDescription(tags, locationType) {
    // For MIB-style flavor text

    const generalDescriptions = {
      'civilian-sighting': [
        "Multiple civilian reports of unusual activity.",
        "Witnesses described unidentified individuals conducting surveys.",
        "Local residents report strange lights at night.",
        "Complaints of electronic interference filed recently."
      ],
      'entity-sighting': [
        "Unconfirmed reports of non-terrestrial entities in vicinity.",
        "Distinctive bio-signatures detected near this location.",
        "Strange behavioral patterns observed in local fauna.",
        "Multiple witnesses reported humanoid figures with unusual features."
      ],
      'memory-anomaly': [
        "Cluster of unexplained amnesia cases reported.",
        "Time distortion field detected in proximity.",
        "Multiple subjects reporting identical dreams near this location.",
        "Neuralizer activity suspected. Memory wipe assessment required."
      ],
      'technology-breach': [
        "Unauthorized technology signatures detected.",
        "Unusual energy readings consistent with non-terrestrial tech.",
        "Potential reverse-engineering of restricted technologies.",
        "Quantum fluctuations detected in electronic equipment nearby."
      ],
      'agency-outpost': [
        "Classified facility. Clearance level 4 required for details.",
        "Monitoring station disguised as civilian infrastructure.",
        "Field agents stationed on rotation. Check in required.",
        "Secure communications relay point. Encryption protocols in effect."
      ],
      'information-breach': [
        "Sensitive information potentially compromised.",
        "Unauthorized knowledge distribution suspected.",
        "Classified materials may have been accessed by civilians.",
        "Information containment protocols recommended."
      ],
      'anomalous-readings': [
        "Instruments show unusual radiation patterns.",
        "Gravitational anomalies detected in proximity.",
        "Electromagnetic interference consistent with portal activity.",
        "Atmospheric composition shows trace non-terrestrial elements."
      ],
      'surveillance-point': [
        "Optimal vantage point for field observation.",
        "Recommended position for monitoring adjacent locations.",
        "Strategic importance: provides overview of surrounding area.",
        "Previous surveillance operations conducted successfully here."
      ],
      'temporal-anomaly': [
        "Temporal inconsistencies detected. Exercise caution.",
        "Reports of objects appearing from different time periods.",
        "Chrononaut division alerted to potential timeline disturbance.",
        "Time displacement signatures consistent with unauthorized travel."
      ],
      'artifact-containment': [
        "Non-terrestrial artifacts potentially stored at this location.",
        "Historical objects of extraterrestrial origin catalogued here.",
        "Secure containment protocols in effect for anomalous items.",
        "Multiple containment breaches reported. Proceed with caution."
      ],
      'visitor-lodging': [
        "Known accommodation for non-terrestrial visitors.",
        "Disguised resting facility for intergalactic tourists.",
        "Temporary housing for diplomatic entities from System Zeta-9.",
        "Bio-adaptation chambers available for non-oxygen breathers."
      ],
      'observation-point': [
        "Standard observation post. Report any unusual activity.",
        "Routine surveillance recommended at this location.",
        "Previous incidents make this location of particular interest.",
        "Maintain discreet presence while monitoring this area."
      ],
      'strange-activity': [
        "Pattern of unexplained phenomena reported by locals.",
        "Recurring anomalies without clear explanation.",
        "Frequent equipment malfunctions in this area.",
        "Statistical improbabilities detected in event occurrences."
      ]
    };

    // If we have the location's name, use it in the description
    const locationName = tags.name ? tags.name : locationType.defaultName;

    // Get random description for the interaction type
    const interactionType = locationType.interactionType;
    const descriptionPool = generalDescriptions[interactionType] || generalDescriptions['observation-point'];
    const generalDescription = descriptionPool[Math.floor(Math.random() * descriptionPool.length)];

    // Create specific descriptions based on location type
    let specificDescription = '';

    switch (locationType.type) {
      case 'amenity':
        if (locationType.subtype === 'food') {
          specificDescription = "Frequent gatherings of individuals with unusual dietary requirements noted.";
        } else if (locationType.subtype === 'education') {
          specificDescription = "Research into sensitive topics may require monitoring.";
        } else if (locationType.subtype === 'healthcare') {
          specificDescription = "Medical anomalies reported that exceed standard treatment protocols.";
        }
        break;

      case 'natural':
        specificDescription = "Natural features provide cover for clandestine activities.";
        break;

      case 'historic':
        specificDescription = "Historical significance may relate to previous extraterrestrial contact.";
        break;

      case 'tourism':
        specificDescription = "High civilian traffic provides cover for both our agents and non-terrestrial visitors.";
        break;

      case 'building':
        specificDescription = "Structure may contain undocumented sublevels or modified architecture.";
        break;

      default:
        specificDescription = "Standard protocols apply when operating in this area.";
    }

    // Combine general and specific descriptions
    return `${generalDescription} ${specificDescription}`;
  }

  /**
   * Add POIs to a Leaflet map
   * @param {Object} map - Leaflet map object
   */
  addPOIsToMap(map) {
    if (!map) {
      if (!this.options.map) {
        throw new Error('No map provided');
      }
      map = this.options.map;
    }

    // Clear existing markers if needed
    if (this.markers) {
      this.markers.forEach(marker => marker.remove());
    }

    this.markers = [];

    // Add markers for each POI
    this.pois.forEach(poi => {
      // Determine marker color based on interaction type
      const interactionColors = {
        'civilian-sighting': '#4ade80', // green
        'entity-sighting': '#fb923c', // orange
        'memory-anomaly': '#a78bfa', // purple
        'technology-breach': '#60a5fa', // blue
        'agency-outpost': '#f43f5e', // red
        'temporal-anomaly': '#facc15', // yellow
        'artifact-containment': '#f97316', // orange
        'information-breach': '#14b8a6', // teal
      };

      const defaultColor = '#9ca3af'; // gray
      const color = interactionColors[poi.interactionType] || defaultColor;

      // Create custom icon
      const icon = L.divIcon({
        className: 'poi-marker',
        html: `<div class="w-3 h-3 rounded-full" style="background-color: ${color}; box-shadow: 0 0 5px ${color}"></div>`,
        iconSize: [15, 15],
        iconAnchor: [7.5, 7.5]
      });

      // Create marker
      const marker = L.marker([poi.coords.latitude, poi.coords.longitude], {
        icon: icon,
        title: poi.name
      }).addTo(map);

      // Create popup content
      const popupContent = `
          <div class="text-black">
            <div class="font-bold">${poi.name}</div>
            <div class="text-xs">${poi.type.toUpperCase()}: ${poi.subtype}</div>
            <div class="text-xs mt-1">${poi.description}</div>
            <div class="text-xs mt-1">Distance: ${poi.distance.toFixed(2)} km</div>
            <div class="mt-2">
              <button class="investigate-btn text-xs bg-black text-green-400 px-2 py-1 rounded" 
                data-poi-id="${poi.id}">INVESTIGATE</button>
            </div>
          </div>
        `;

      marker.bindPopup(popupContent);

      // Store the marker
      this.markers.push(marker);

      // Add click handler after popup is opened
      marker.on('popupopen', () => {
        setTimeout(() => {
          const investigateBtn = document.querySelector(`.investigate-btn[data-poi-id="${poi.id}"]`);
          if (investigateBtn) {
            investigateBtn.addEventListener('click', () => {
              this._handleInvestigate(poi);
            });
          }
        }, 100);
      });
    });

    return this.markers;
  }

  /**
   * Handle investigation of a POI
   * @private
   */
  _handleInvestigate(poi) {
    // This would trigger specific game interactions based on the POI
    console.log('Investigating:', poi);

    // Create an incident based on this POI
    const incident = this._generateIncidentFromPOI(poi);

    // Dispatch custom event that the main app can listen for
    const event = new CustomEvent('mib:investigation', {
      detail: {
        poi,
        incident
      }
    });

    document.dispatchEvent(event);
  }

  /**
   * Generate an in-game incident based on a real-world POI
   * @param {Object} poi - Point of interest
   * @returns {Object} Generated incident
   * @private
   */
  _generateIncidentFromPOI(poi) {
    // Create a unique ID for the incident
    const id = `${poi.interactionType.charAt(0).toUpperCase()}${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 100)}`;

    // Determine threat level based on interaction type
    const threatLevels = {
      'civilian-sighting': 'LOW',
      'entity-sighting': 'MEDIUM',
      'memory-anomaly': 'MEDIUM',
      'technology-breach': 'HIGH',
      'agency-outpost': 'LOW',
      'information-breach': 'HIGH',
      'anomalous-readings': 'MEDIUM',
      'surveillance-point': 'LOW',
      'temporal-anomaly': 'HIGH',
      'artifact-containment': 'HIGH',
      'visitor-lodging': 'LOW',
      'observation-point': 'LOW',
      'strange-activity': 'MEDIUM'
    };

    const threatLevel = threatLevels[poi.interactionType] || 'LOW';

    // Format incident type nicely
    const formattedType = poi.interactionType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Generate incident title
    const titles = {
      'civilian-sighting': [
        `Unusual Behavior at ${poi.name}`,
        `Suspicious Activity Report: ${poi.name}`,
        `Civilian Witness Debrief Required`
      ],
      'entity-sighting': [
        `Non-Terrestrial Entity at ${poi.name}`,
        `Biological Anomaly Detected`,
        `Unregistered Visitor Sighting`
      ],
      'memory-anomaly': [
        `Mass Amnesia Incident`,
        `Memory Displacement Event`,
        `Temporal Cognition Distortion`
      ],
      'technology-breach': [
        `Unauthorized Tech Signature`,
        `Alien Technology Detected`,
        `Advanced Device Recovery`
      ],
      'agency-outpost': [
        `Field Office Check-In Required`,
        `Secure Facility Status Report`,
        `Agent Rendezvous Point`
      ],
      'information-breach': [
        `Knowledge Containment Failure`,
        `Classified Data Exposure`,
        `Information Security Breach`
      ],
      'anomalous-readings': [
        `Unexplained Energy Signature`,
        `Atmospheric Anomaly Detection`,
        `Sensor Array Abnormality`
      ],
      'surveillance-point': [
        `Observation Post Activation`,
        `Surveillance Network Node`,
        `Field Monitoring Station`
      ],
      'temporal-anomaly': [
        `Timeline Inconsistency Detected`,
        `Chronal Displacement Event`,
        `Temporal Rift Activity`
      ],
      'artifact-containment': [
        `Non-Terrestrial Artifact Security`,
        `Object of Unknown Origin`,
        `Containment Protocol Activation`
      ],
      'visitor-lodging': [
        `Registered Alien Visitor Check`,
        `Diplomatic Guest Monitoring`,
        `Visitor Accommodation Security`
      ],
      'observation-point': [
        `Field Surveillance Assignment`,
        `Area Monitoring Duty`,
        `Observation Detail`
      ],
      'strange-activity': [
        `Unexplained Phenomena Cluster`,
        `Statistical Anomaly Investigation`,
        `Pattern Recognition Alert`
      ]
    };

    const titleOptions = titles[poi.interactionType] || [`Incident at ${poi.name}`];
    const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];

    return {
      id,
      type: formattedType,
      title,
      description: poi.description,
      coords: poi.coords,
      distanceKm: poi.distance,
      timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 6), // Random time in last 6 hours
      threatLevel,
      poiReference: poi.id
    };
  }

  /**
   * Get all POIs of a specific type
   * @param {string} type - Type of POI to filter for
   * @returns {Array} Filtered POIs
   */
  getPOIsByType(type) {
    return this.pois.filter(poi => poi.type === type);
  }

  /**
   * Get all POIs with a specific interaction type
   * @param {string} interactionType - Interaction type to filter for
   * @returns {Array} Filtered POIs
   */
  getPOIsByInteractionType(interactionType) {
    return this.pois.filter(poi => poi.interactionType === interactionType);
  }

  /**
   * Add a custom feature to the environment
   * @param {Object} feature - Custom feature to add
   */
  addCustomFeature(feature) {
    this.customFeatures.push(feature);
    return this;
  }
}

// Export the class
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = OSMEnvironment;
} else {
  window.OSMEnvironment = OSMEnvironment;
}