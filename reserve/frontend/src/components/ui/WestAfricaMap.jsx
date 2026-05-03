// src/components/ui/WestAfricaMap.jsx
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { FiMap, FiTrash2 } from 'react-icons/fi';

import { APP_CONFIG } from '../../config/appConfig';

const WestAfricaMap = ({ onZoneSelect, initialZone = null, readOnly = false, existingZones = [] }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [zones, setZones] = useState(existingZones || []);
  const overlaysRef = useRef([]);

  const displayExistingZones = (mapInstance, zonesToDisplay = zones) => {
    // Clear previous overlays
    overlaysRef.current.forEach(o => {
      try { if (o && o.setMap) o.setMap(null); } catch (e) { console.debug('Error removing overlay', e); }
    });
    overlaysRef.current = [];

    zonesToDisplay.forEach(zone => {
      try {
        if (zone.geometry && zone.geometry.coordinates) {
          const coordinates = zone.geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }));

          const zonePolygon = new window.google.maps.Polygon({
            paths: coordinates,
            fillColor: zone.properties?.color || '#E53E3E',
            fillOpacity: 0.3,
            strokeColor: zone.properties?.color || '#E53E3E',
            strokeWeight: 3,
            map: mapInstance
          });

          overlaysRef.current.push(zonePolygon);
          addZoneLabel(mapInstance, zonePolygon, zone.name || zone.properties?.name);
        }
      } catch (error) {
        console.error('Erreur affichage zone:', zone.name, error);
      }
    });
  };

  const addZoneLabel = (mapInstance, polygon, zoneName) => {
    try {
      const bounds = new window.google.maps.LatLngBounds();
      const path = polygon.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      const center = bounds.getCenter();
      new window.google.maps.Marker({
        position: center,
        map: mapInstance,
        label: {
          text: zoneName,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0,
          fillColor: 'transparent',
          fillOpacity: 0,
          strokeColor: 'transparent',
          strokeOpacity: 0
        }
      });
    } catch (e) {
      console.debug('Error adding zone label', e);
    }
  };

  // Clé API Google Maps
  const GOOGLE_MAPS_API_KEY = APP_CONFIG.GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Charger l'API Google Maps
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      let script = document.querySelector('script[data-google-maps-api]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('data-google-maps-api', 'true');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else if (window.google && window.google.maps) {
        initializeMap();
      }
    };

    const initializeMap = () => {
      // Coordonnées exactes de l'image Google Maps (Afrique de l'Ouest)
      const westAfricaCenter = { lat: 8.8105, lng: 0.8433 };
      
      // Créer la carte avec les contours naturels des pays
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: westAfricaCenter,
        zoom: 7.28, // Zoom exact de l'image
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        // Styles pour afficher les contours naturels des pays comme dans l'image
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'administrative.country',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#000000' }, { weight: 1 }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f2' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#a9d3f2' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Carte normale avec les contours naturels des pays (Ghana, Togo, Benin)
      // Les frontières sont affichées naturellement par Google Maps

      // Afficher les zones existantes
      displayExistingZones(mapInstance);

      if (!readOnly) {
        // Créer le gestionnaire de dessin
        const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
          position: window.google.maps.ControlPosition.TOP_RIGHT,
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            drawingModes: [
              window.google.maps.drawing.OverlayType.POLYGON
            ]
          },
          polygonOptions: {
            fillColor: '#E53E3E',
            fillOpacity: 0.3,
            strokeColor: '#E53E3E',
            strokeWeight: 3,
            clickable: true,
            editable: true,
            zIndex: 1
          }
        });

        drawingManagerInstance.setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);

        // Écouter les événements de dessin
        window.google.maps.event.addListener(drawingManagerInstance, 'polygoncomplete', (polygon) => {
          // Demander le nom de la zone
          const zoneName = prompt('Entrez le nom de cette zone (ex: Zone A, Réserve Nord, etc.) :');
          
          if (zoneName) {
            // Obtenir les coordonnées du polygone
            const path = polygon.getPath();
            const coordinates = [];
            
            for (let i = 0; i < path.getLength(); i++) {
              const vertex = path.getAt(i);
              coordinates.push([vertex.lng(), vertex.lat()]);
            }

            // Créer l'objet zone avec nom
            const zoneData = {
              id: Date.now(),
              name: zoneName,
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [coordinates]
              },
              properties: {
                name: zoneName,
                color: getRandomColor(),
                createdAt: new Date().toISOString()
              }
            };

            // Ajouter la zone à la liste
            const newZones = [...zones, zoneData];
            setZones(newZones);

            // Ajouter le nom sur la carte
            addZoneLabel(mapInstance, polygon, zoneName);

            // Convertir en format GeoJSON pour le callback
            onZoneSelect(JSON.stringify(zoneData, null, 2));
          } else {
            // Si pas de nom, supprimer le polygone
            polygon.setMap(null);
          }
        });
      }

      // Charger la zone initiale si elle existe
      if (initialZone) {
        try {
          const zoneData = JSON.parse(initialZone);
          if (zoneData.geometry && zoneData.geometry.coordinates) {
            const coordinates = zoneData.geometry.coordinates[0].map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));

            const initialPolygon = new window.google.maps.Polygon({
              paths: coordinates,
              fillColor: '#E53E3E',
              fillOpacity: 0.3,
              strokeColor: '#E53E3E',
              strokeWeight: 3,
              map: mapInstance
            });

            setPolygon(initialPolygon);
            window.currentPolygon = initialPolygon;
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la zone initiale:', error);
        }
      }

      setMap(mapInstance);
      setIsMapLoaded(true);
    };

    

    

    const getRandomColor = () => {
      const colors = ['#E53E3E', '#38A169', '#3182CE', '#D69E2E', '#805AD5', '#319795'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    loadGoogleMaps();

    return () => {
      try {
        if (map) {
          if (window.currentPolygon) {
            window.currentPolygon.setMap(null);
            window.currentPolygon = null;
          }
          // clear listeners and overlays
          try {
            window.google.maps.event.clearInstanceListeners(map);
          } catch (e) {
            console.debug('Error clearing map listeners', e);
          }
          // if drawing manager exists
          if (drawingManager) {
            try {
              window.google.maps.event.clearInstanceListeners(drawingManager);
              drawingManager.setMap(null);
            } catch (e) {
              console.debug('Error clearing drawingManager', e);
            }
          }
        }
        // Remove injected google maps script only if previously appended
        // We avoid removing the google-maps API script here to prevent race conditions
        // in case other components rely on it; leaving the script loaded is safe.
      } catch (err) {
        console.error('Erreur cleanup WestAfricaMap:', err);
      }
    };
  }, [onZoneSelect, initialZone, readOnly, zones]);

  const handleClearZone = () => {
    if (window.currentPolygon) {
      window.currentPolygon.setMap(null);
      window.currentPolygon = null;
      setPolygon(null);
      onZoneSelect('');
    }
  };

  const handleExampleZone = () => {
    // Zone d'exemple pour l'Afrique de l'Ouest
    const exampleZone = {
      id: Date.now(),
      name: "Zone Exemple Afrique de l'Ouest",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [0.772, 6.137], // Sud-Ouest
          [1.778, 6.137], // Sud-Est
          [1.778, 11.138], // Nord-Est
          [0.772, 11.138], // Nord-Ouest
          [0.772, 6.137]  // Retour au début
        ]]
      },
      properties: {
        name: "Zone Exemple Afrique de l'Ouest",
        color: '#E53E3E',
        createdAt: new Date().toISOString()
      }
    };
    
    onZoneSelect(JSON.stringify(exampleZone, null, 2));
  };

  return (
    <Box>
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            {readOnly 
              ? "Carte de l'Afrique de l'Ouest" 
              : "Carte interactive de l'Afrique de l'Ouest - Utilisez l'outil de dessin pour délimiter une zone"
            }
          </Text>
          {!readOnly && isMapLoaded ? <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<FiMap />}
                onClick={handleExampleZone}
                colorScheme="blue"
                variant="outline"
              >
                Zone exemple
              </Button>
              {polygon ? <Button
                  size="sm"
                  leftIcon={<FiTrash2 />}
                  onClick={handleClearZone}
                  colorScheme="red"
                  variant="outline"
                >
                  Effacer
                </Button> : null}
            </HStack> : null}
        </HStack>
        
        <Box 
          ref={mapRef} 
          h="500px" 
          w="100%" 
          borderRadius="md"
          border="1px"
          borderColor="gray.200"
          overflow="hidden"
        />
        
        {!readOnly && (
          <Text fontSize="xs" color="gray.500">
            💡 Utilisez l'outil de dessin (icône polygone) en haut à droite pour délimiter une zone.
            Les coordonnées seront automatiquement ajoutées au formulaire.
          </Text>
        )}

        {/* Afficher la liste des zones créées */}
        {zones.length > 0 && (
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Zones créées ({zones.length}) :
            </Text>
            <VStack spacing={2} align="stretch">
              {zones.map((zone, index) => (
                <HStack 
                  key={zone.id || index}
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md"
                  justify="space-between"
                >
                  <Text fontSize="sm">
                    {zone.name || zone.properties?.name || `Zone ${index + 1}`}
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => {
                      const newZones = zones.filter((_, i) => i !== index);
                      setZones(newZones);
                    }}
                  >
                    Supprimer
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default WestAfricaMap; 