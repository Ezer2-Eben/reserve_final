import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { FiMap, FiTrash2 } from 'react-icons/fi';

import { APP_CONFIG } from '../../config/appConfig';

const TogoMap = ({ onZoneSelect, initialZone = null, readOnly = false, existingZones = [] }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [zones, setZones] = useState(existingZones || []);

  // Clé API Google Maps
  const GOOGLE_MAPS_API_KEY = APP_CONFIG.GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Charger l'API Google Maps
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
      // We avoid removing the google-maps API script here to prevent race conditions
      // in case other components rely on it; leaving the script loaded is safe.
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
      // Coordonnées centrées sur l'Afrique de l'Ouest (Ghana, Togo, Benin)
      const westAfricaCenter = { lat: 8.8105, lng: 0.8433 };
      
      // Créer la carte avec les contours naturels des pays
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: westAfricaCenter,
        zoom: 7.28,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        // Styles pour afficher les contours naturels des pays
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

    const displayExistingZones = (mapInstance) => {
      zones.forEach(zone => {
        if (zone.geometry && zone.geometry.coordinates) {
          const coordinates = zone.geometry.coordinates[0].map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));

          const zonePolygon = new window.google.maps.Polygon({
            paths: coordinates,
            fillColor: zone.properties?.color || '#E53E3E',
            fillOpacity: 0.3,
            strokeColor: zone.properties?.color || '#E53E3E',
            strokeWeight: 3,
            map: mapInstance
          });

          // Ajouter le nom de la zone
          addZoneLabel(mapInstance, zonePolygon, zone.name || zone.properties?.name);
        }
      });
    };

    const addZoneLabel = (mapInstance, polygon, zoneName) => {
      // Calculer le centre du polygone pour placer le label
      const bounds = new window.google.maps.LatLngBounds();
      const path = polygon.getPath();
      
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      
      const center = bounds.getCenter();

      // Créer le label
      const label = new window.google.maps.Marker({
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
    };

    const getRandomColor = () => {
      const colors = ['#E53E3E', '#38A169', '#3182CE', '#D69E2E', '#805AD5', '#319795'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    loadGoogleMaps();

    return () => {
      if (map) {
        // Nettoyer la carte
        if (window.currentPolygon) {
          window.currentPolygon.setMap(null);
        }
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
    // Zone d'exemple pour le Togo
    const exampleZone = {
      id: Date.now(),
      name: "Zone Exemple Togo",
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
        name: "Zone Exemple Togo",
        color: '#E53E3E',
        superficie: "Zone d'exemple"
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
              ? "Carte de la réserve" 
              : "Carte interactive du Togo - Utilisez l'outil de dessin pour délimiter une zone"
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
      </VStack>
    </Box>
  );
};

export default TogoMap; 