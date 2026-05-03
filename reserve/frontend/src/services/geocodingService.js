// src/services/geocodingService.js - VERSION AVANCÉE
import * as turf from '@turf/turf';

class GeocodingService {
  constructor() {
    this.geocoder = null;
    this.placesService = null;
    this.elevationService = null;
    this.geocodeCache = new Map();
    this.cacheTimeout = 3600000; // 1 heure
    this.initServices();
  }

  initServices() {
    if (window.google && window.google.maps) {
      this.geocoder = new window.google.maps.Geocoder();
      this.elevationService = new window.google.maps.ElevationService();
      // PlacesService nécessite un élément DOM
      const div = document.createElement('div');
      this.placesService = new window.google.maps.places.PlacesService(div);
    }
  }

  // ==================== GÉOCODAGE INVERSE AVANCÉ ====================
  async reverseGeocode(lat, lng) {
    if (!this.geocoder) {
      this.initServices();
      if (!this.geocoder) {
        throw new Error('Google Maps Geocoder non disponible');
      }
    }

    // Vérifier le cache
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.geocodeCache.has(cacheKey)) {
      const cached = this.geocodeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    return new Promise((resolve, reject) => {
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      this.geocoder.geocode({ location: latlng }, async (results, status) => {
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          const formattedAddress = results[0].formatted_address;
          const placeId = results[0].place_id;
          
          const locationInfo = await this.extractAdvancedLocationInfo(
            addressComponents, 
            formattedAddress,
            placeId,
            latlng
          );
          
          // Mettre en cache
          this.geocodeCache.set(cacheKey, {
            data: locationInfo,
            timestamp: Date.now()
          });
          
          resolve(locationInfo);
        } else {
          reject(new Error(`Géocodage échoué: ${status}`));
        }
      });
    });
  }

  // ==================== EXTRACTION D'INFORMATIONS AVANCÉES ====================
  async extractAdvancedLocationInfo(addressComponents, formattedAddress, placeId, latlng) {
    let locality = '';
    let sublocality = '';
    let administrativeArea = '';
    let administrativeArea2 = '';
    let country = '';
    let countryCode = '';
    let neighborhood = '';
    let postalCode = '';

    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('neighborhood')) {
        neighborhood = component.long_name;
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        sublocality = component.long_name;
      } else if (types.includes('locality')) {
        locality = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        administrativeArea2 = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        administrativeArea = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
        countryCode = component.short_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    }

    // Hiérarchie de localisation
    const primaryLocation = neighborhood || sublocality || locality || administrativeArea2 || administrativeArea;
    
    // Construction de la localisation complète
    const fullLocation = this.buildFullLocation(
      neighborhood, 
      sublocality, 
      locality, 
      administrativeArea2,
      administrativeArea, 
      country
    );

    // Obtenir l'élévation
    const elevation = await this.getElevation(latlng);

    // Obtenir les détails du lieu via Places API
    const placeDetails = await this.getPlaceDetails(placeId);

    return {
      primaryLocation,
      fullLocation,
      neighborhood,
      sublocality,
      locality,
      administrativeArea,
      administrativeArea2,
      country,
      countryCode,
      postalCode,
      formattedAddress,
      placeId,
      elevation,
      placeDetails,
      coordinates: {
        lat: latlng.lat,
        lng: latlng.lng
      }
    };
  }

  buildFullLocation(neighborhood, sublocality, locality, area2, area, country) {
    const parts = [];
    
    if (neighborhood && neighborhood !== locality) parts.push(neighborhood);
    if (sublocality && sublocality !== locality) parts.push(sublocality);
    if (locality) parts.push(locality);
    if (area2 && !parts.includes(area2)) parts.push(area2);
    if (area && !parts.includes(area)) parts.push(area);
    if (country && !parts.includes(country)) parts.push(country);

    return parts.join(', ');
  }

  // ==================== ÉLÉVATION ====================
  async getElevation(latlng) {
    if (!this.elevationService) return null;

    return new Promise((resolve) => {
      this.elevationService.getElevationForLocations(
        { locations: [latlng] },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve({
              meters: Math.round(results[0].elevation),
              feet: Math.round(results[0].elevation * 3.28084)
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // ==================== PLACES API ====================
  async getPlaceDetails(placeId) {
    if (!this.placesService || !placeId) return null;

    return new Promise((resolve) => {
      this.placesService.getDetails(
        { placeId: placeId },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              name: place.name,
              types: place.types,
              rating: place.rating,
              website: place.website,
              phoneNumber: place.formatted_phone_number
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // ==================== GÉNÉRATION DE NOM INTELLIGENT ====================
  generateReserveName(locationInfo, type = '', includeCountry = false) {
    const { primaryLocation, locality, administrativeArea, country } = locationInfo;
    
    let baseName = primaryLocation || locality || administrativeArea;
    
    if (!baseName) return '';

    // Nettoyer le nom
    baseName = this.cleanLocationName(baseName);
    
    // Construire le nom selon le type
    let reserveName = '';
    
    if (type) {
      // Types spécifiques avec formatage adapté
      switch (type.toLowerCase()) {
        case 'parc national':
          reserveName = `Parc National de ${baseName}`;
          break;
        case 'réserve naturelle':
          reserveName = `Réserve Naturelle de ${baseName}`;
          break;
        case 'forêt classée':
          reserveName = `Forêt Classée de ${baseName}`;
          break;
        case 'zone de protection':
          reserveName = `Zone de Protection de ${baseName}`;
          break;
        case 'réserve de biosphère':
          reserveName = `Réserve de Biosphère de ${baseName}`;
          break;
        case 'sanctuaire':
          reserveName = `Sanctuaire de ${baseName}`;
          break;
        case 'aire marine protégée':
          reserveName = `Aire Marine Protégée de ${baseName}`;
          break;
        default:
          reserveName = `${type} de ${baseName}`;
      }
    } else {
      reserveName = `Réserve de ${baseName}`;
    }

    // Ajouter le pays si demandé
    if (includeCountry && country && !reserveName.includes(country)) {
      reserveName += ` (${country})`;
    }

    return reserveName;
  }

  cleanLocationName(name) {
    return name
      .replace(/[^\w\sÀ-ÿ-]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // ==================== CALCULS GÉOMÉTRIQUES AVANCÉS ====================
  calculateZoneCenter(wkt) {
    try {
      const coordinates = this.parseWKTCoordinates(wkt);
      
      if (coordinates.length === 0) return null;

      // Utiliser Turf.js pour un calcul plus précis du centroïde
      const polygon = turf.polygon([[
        ...coordinates.map(c => [c.lng, c.lat]),
        [coordinates[0].lng, coordinates[0].lat] // Fermer le polygone
      ]]);

      const centroid = turf.centroid(polygon);
      
      return {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0]
      };
    } catch (error) {
      console.error('Erreur calcul centre:', error);
      // Fallback: moyenne simple
      return this.calculateSimpleCenter(wkt);
    }
  }

  calculateSimpleCenter(wkt) {
    const coordinates = this.parseWKTCoordinates(wkt);
    
    if (coordinates.length === 0) return null;

    let sumLat = 0;
    let sumLng = 0;
    
    coordinates.forEach(coord => {
      sumLat += coord.lat;
      sumLng += coord.lng;
    });

    return {
      lat: sumLat / coordinates.length,
      lng: sumLng / coordinates.length
    };
  }

  parseWKTCoordinates(wkt) {
    const coordinates = [];
    
    try {
      const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
      if (!match) return coordinates;

      const coordString = match[1];
      const coordPairs = coordString.split(',');

      coordPairs.forEach(pair => {
        const [lng, lat] = pair.trim().split(' ').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          coordinates.push({ lat, lng });
        }
      });
    } catch (error) {
      console.error('Erreur parsing WKT:', error);
    }

    return coordinates;
  }

  // ==================== ANALYSE SPATIALE ====================
  calculateArea(wkt) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      const turfCoords = coords.map(c => [c.lng, c.lat]);
      turfCoords.push(turfCoords[0]); // Fermer le polygone

      const polygon = turf.polygon([turfCoords]);
      const area = turf.area(polygon); // m²
      
      return {
        squareMeters: area,
        squareKilometers: area / 1000000,
        hectares: area / 10000,
        acres: area * 0.000247105
      };
    } catch (error) {
      console.error('Erreur calcul superficie:', error);
      return null;
    }
  }

  calculatePerimeter(wkt) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      const turfCoords = coords.map(c => [c.lng, c.lat]);
      turfCoords.push(turfCoords[0]);

      const line = turf.lineString(turfCoords);
      const length = turf.length(line, { units: 'kilometers' });
      
      return {
        kilometers: length,
        meters: length * 1000,
        miles: length * 0.621371
      };
    } catch (error) {
      console.error('Erreur calcul périmètre:', error);
      return null;
    }
  }

  calculateBounds(wkt) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      const turfCoords = coords.map(c => [c.lng, c.lat]);
      turfCoords.push(turfCoords[0]);

      const polygon = turf.polygon([turfCoords]);
      const bbox = turf.bbox(polygon);
      
      return {
        minLng: bbox[0],
        minLat: bbox[1],
        maxLng: bbox[2],
        maxLat: bbox[3],
        center: {
          lng: (bbox[0] + bbox[2]) / 2,
          lat: (bbox[1] + bbox[3]) / 2
        }
      };
    } catch (error) {
      console.error('Erreur calcul limites:', error);
      return null;
    }
  }

  // ==================== BUFFER / ZONE TAMPON ====================
  createBuffer(wkt, radiusKm) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      const turfCoords = coords.map(c => [c.lng, c.lat]);
      turfCoords.push(turfCoords[0]);

      const polygon = turf.polygon([turfCoords]);
      const buffered = turf.buffer(polygon, radiusKm, { units: 'kilometers' });
      
      return this.convertGeoJSONToWKT(buffered);
    } catch (error) {
      console.error('Erreur création buffer:', error);
      return null;
    }
  }

  // ==================== CONVERSIONS ====================
  convertGeoJSONToWKT(geojson) {
    try {
      const coords = geojson.geometry.coordinates[0];
      const wktCoords = coords.map(c => `${c[0]} ${c[1]}`).join(', ');
      return `POLYGON((${wktCoords}))`;
    } catch (error) {
      console.error('Erreur conversion GeoJSON->WKT:', error);
      return null;
    }
  }

  convertWKTToGeoJSON(wkt) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      const geoCoords = coords.map(c => [c.lng, c.lat]);
      geoCoords.push(geoCoords[0]); // Fermer

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [geoCoords]
        },
        properties: {}
      };
    } catch (error) {
      console.error('Erreur conversion WKT->GeoJSON:', error);
      return null;
    }
  }

  // ==================== SIMPLIFICATION DE GÉOMÉTRIE ====================
  simplifyGeometry(wkt, tolerance = 0.01) {
    try {
      const geojson = this.convertWKTToGeoJSON(wkt);
      const simplified = turf.simplify(geojson, { tolerance: tolerance, highQuality: true });
      return this.convertGeoJSONToWKT(simplified);
    } catch (error) {
      console.error('Erreur simplification:', error);
      return wkt;
    }
  }

  // ==================== VALIDATION ====================
  isValidWKT(wkt) {
    try {
      const coords = this.parseWKTCoordinates(wkt);
      
      // Vérifications de base
      if (coords.length < 3) return false;
      
      // Vérifier que les coordonnées sont valides
      for (const coord of coords) {
        if (coord.lat < -90 || coord.lat > 90) return false;
        if (coord.lng < -180 || coord.lng > 180) return false;
      }
      
      // Vérifier que le polygone n'est pas auto-intersectant
      const geojson = this.convertWKTToGeoJSON(wkt);
      if (!geojson) return false;
      
      const kinks = turf.kinks(geojson);
      if (kinks.features.length > 0) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== DISTANCE ENTRE POINTS ====================
  calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
    const from = turf.point([lng1, lat1]);
    const to = turf.point([lng2, lat2]);
    const distance = turf.distance(from, to, { units: 'kilometers' });
    
    switch (unit) {
      case 'km':
        return distance;
      case 'm':
        return distance * 1000;
      case 'mi':
        return distance * 0.621371;
      default:
        return distance;
    }
  }

  // ==================== GESTION DU CACHE ====================
  clearCache() {
    this.geocodeCache.clear();
  }

  getCacheSize() {
    return this.geocodeCache.size;
  }

  getCacheStats() {
    let validEntries = 0;
    const now = Date.now();
    
    this.geocodeCache.forEach((entry) => {
      if (now - entry.timestamp < this.cacheTimeout) {
        validEntries++;
      }
    });

    return {
      total: this.geocodeCache.size,
      valid: validEntries,
      expired: this.geocodeCache.size - validEntries
    };
  }
}

// Instance singleton
const geocodingService = new GeocodingService();
export default geocodingService;