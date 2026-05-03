// src/components/maps/TogoLeafletMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, Button, HStack, VStack, Text, 
  IconButton, Tooltip, useToast, Badge,
  Menu, MenuButton, MenuList, MenuItem,
  Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  Switch, Divider, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { FeatureGroup, MapContainer, TileLayer, Polygon, 
         Marker, Popup, GeoJSON, LayersControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import axios from 'axios';
import * as turf from '@turf/turf';
import {
  FiTrash2, FiDownload, FiSettings, FiGrid,
  FiCrosshair, FiSquare, FiTarget, FiMap
} from 'react-icons/fi';

const TogoLeafletMap = ({ 
  onZoneSelect,
  initialZone = null,
  readOnly = false,
  existingZones = [],
  adminId = null
}) => {
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);
  const [map, setMap] = useState(null);
  const [zones, setZones] = useState(existingZones || []);
  const [togoData, setTogoData] = useState(null);
  const [regionsData, setRegionsData] = useState(null);
  const [prefecturesData, setPrefecturesData] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [layerVisibility, setLayerVisibility] = useState({
    regions: true,
    prefectures: false,
    reserves: true,
    roads: false,
    rivers: false
  });
  const [mapStyle, setMapStyle] = useState('osm'); // 'osm', 'topo', 'satellite'
  const toast = useToast();

  // Configuration des serveurs
  const QGIS_SERVER_URL = 'http://localhost:8080/qgisserver'; // Adaptez l'URL
  const GEOSERVER_URL = 'http://localhost:8080/geoserver'; // Alternative

  // Centre du Togo
  const TOGO_CENTER = [8.6195, 0.8248];
  const DEFAULT_ZOOM = 8;

  // ==================== INITIALISATION ====================
  useEffect(() => {
    if (mapRef.current) {
      initMap();
      loadTogoBoundaries();
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  const initMap = () => {
    const mapInstance = L.map('togo-map', {
      center: TOGO_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: [
        [6.0, -0.2],  // Sud-Ouest
        [11.5, 2.0]   // Nord-Est
      ],
      maxBoundsViscosity: 1.0
    });

    // Ajouter les tuiles selon le style choisi
    updateTileLayer(mapInstance, mapStyle);

    // Ajouter les contrôles
    L.control.scale({ imperial: false }).addTo(mapInstance);
    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    // Activer le dessin si pas en lecture seule
    if (!readOnly) {
      initDrawingTools(mapInstance);
    }

    setMap(mapInstance);
  };

  const updateTileLayer = (mapInstance, style) => {
    // Supprimer les anciennes tuiles
    mapInstance.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });

    let tileLayer;
    switch(style) {
      case 'topo':
        tileLayer = L.tileLayer(
          'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          {
            attribution: '© OpenTopoMap',
            maxZoom: 17
          }
        );
        break;
      case 'satellite':
        tileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '© Esri',
            maxZoom: 19
          }
        );
        break;
      default: // OSM
        tileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '© OpenStreetMap',
            maxZoom: 19
          }
        );
    }

    tileLayer.addTo(mapInstance);
  };

  const loadTogoBoundaries = async () => {
    try {
      // Charger les limites du Togo (GeoJSON)
      const togoResponse = await axios.get('/data/togo-boundary.geojson');
      setTogoData(togoResponse.data);

      // Charger les régions
      const regionsResponse = await axios.get('/data/togo-regions.geojson');
      setRegionsData(regionsResponse.data);

      // Charger les préfectures
      const prefecturesResponse = await axios.get('/data/togo-prefectures.geojson');
      setPrefecturesData(prefecturesResponse.data);

      // Charger les réserves existantes via API
      if (adminId) {
        const reservesResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/reserves/admin/${adminId}`
        );
        displayReserves(reservesResponse.data);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données cartographiques',
        status: 'error',
        duration: 5000
      });
    }
  };

  // ==================== OUTILS DE DESSIN ====================
  const initDrawingTools = (mapInstance) => {
    // Initialiser le plugin de dessin
    mapInstance.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: true,
      cutPolygon: false,
      editMode: true,
      dragMode: true,
      removalMode: true
    });

    // Écouter les événements de dessin
    mapInstance.on('pm:create', (e) => {
      handleShapeCreated(e);
    });

    mapInstance.on('pm:edit', (e) => {
      handleShapeEdited(e);
    });

    mapInstance.on('pm:remove', (e) => {
      handleShapeRemoved(e);
    });
  };

  const handleShapeCreated = (e) => {
    const layer = e.layer;
    const shapeType = e.shape;
    const coordinates = extractCoordinates(layer, shapeType);

    // Calculer la superficie
    const area = calculateArea(coordinates, shapeType);

    // Demander le nom de la zone
    const zoneName = prompt(
      `Nouvelle zone ${shapeType}\n` +
      `Superficie: ${area.toFixed(2)} km²\n\n` +
      `Nom de la zone:`,
      `Réserve ${zones.length + 1}`
    );

    if (zoneName) {
      const zoneData = {
        id: Date.now(),
        name: zoneName,
        type: 'Feature',
        geometry: {
          type: shapeType === 'circle' ? 'Polygon' : shapeType,
          coordinates: shapeType === 'circle' ? [coordinates] : coordinates
        },
        properties: {
          name: zoneName,
          area: area * 1000000, // en m²
          createdBy: adminId,
          createdAt: new Date().toISOString(),
          type: shapeType,
          color: getRandomColor()
        }
      };

      // Ajouter à l'état
      const newZones = [...zones, zoneData];
      setZones(newZones);
      
      // Notifier le parent
      if (onZoneSelect) {
        onZoneSelect(JSON.stringify(zoneData, null, 2));
      }

      // Ajouter un popup
      layer.bindPopup(`
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">
            📍 ${zoneName}
          </h3>
          <p style="margin: 4px 0;">
            <strong>Type:</strong> ${shapeType}
          </p>
          <p style="margin: 4px 0;">
            <strong>Superficie:</strong> ${area.toFixed(2)} km²
          </p>
          <p style="margin: 8px 0 0 0; font-size: 0.8em; color: #666;">
            Créé le: ${new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      `);

      // Ajouter un style personnalisé
      if (shapeType === 'Polygon' || shapeType === 'Rectangle') {
        layer.setStyle({
          fillColor: zoneData.properties.color,
          fillOpacity: 0.4,
          color: '#333',
          weight: 2
        });
      }

      toast({
        title: 'Zone créée',
        description: `${zoneName} ajoutée avec succès`,
        status: 'success',
        duration: 3000
      });
    } else {
      // Supprimer la forme si pas de nom
      layer.remove();
    }
  };

  const extractCoordinates = (layer, shapeType) => {
    switch(shapeType) {
      case 'Polygon':
        return layer.getLatLngs()[0].map(ll => [ll.lng, ll.lat]);
      case 'Rectangle':
        const bounds = layer.getBounds();
        return [
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          [bounds.getNorthEast().lng, bounds.getSouthWest().lat],
          [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
          [bounds.getSouthWest().lng, bounds.getNorthEast().lat],
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat]
        ];
      case 'Circle':
        const center = layer.getLatLng();
        const radius = layer.getRadius() / 1000; // km
        const circle = turf.circle(
          [center.lng, center.lat],
          radius,
          { steps: 64, units: 'kilometers' }
        );
        return circle.geometry.coordinates[0];
      default:
        return [];
    }
  };

  const calculateArea = (coordinates, shapeType) => {
    try {
      if (shapeType === 'Circle') {
        const radius = turf.distance(
          turf.point(coordinates[0]),
          turf.point(coordinates[1]),
          { units: 'kilometers' }
        );
        return Math.PI * radius * radius;
      }

      const polygon = turf.polygon([coordinates]);
      return turf.area(polygon) / 1000000; // km²
    } catch (error) {
      console.error('Erreur calcul superficie:', error);
      return 0;
    }
  };

  // ==================== AFFICHAGE DES DONNÉES ====================
  const displayReserves = (reservesData) => {
    if (!map || !reservesData) return;

    // Créer un GeoJSON layer pour les réserves
    const reservesLayer = L.geoJSON(reservesData, {
      style: (feature) => ({
        fillColor: '#3182CE',
        fillOpacity: 0.5,
        color: '#2C5282',
        weight: 2
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.name) {
          const popupContent = `
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">
                🏞️ ${feature.properties.name}
              </h3>
              ${feature.properties.area ? `
                <p style="margin: 4px 0;">
                  <strong>Superficie:</strong> ${(feature.properties.area / 1000000).toFixed(2)} km²
                </p>
              ` : ''}
              ${feature.properties.type ? `
                <p style="margin: 4px 0;">
                  <strong>Type:</strong> ${feature.properties.type}
                </p>
              ` : ''}
              ${feature.properties.status ? `
                <p style="margin: 4px 0;">
                  <strong>Statut:</strong> ${feature.properties.status}
                </p>
              ` : ''}
            </div>
          `;
          layer.bindPopup(popupContent);
        }
      }
    }).addTo(map);

    // Ajouter au contrôle des couches
    if (map._layersControl) {
      map._layersControl.addOverlay(reservesLayer, 'Réserves administratives');
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================
  const getRandomColor = () => {
    const colors = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', 
                   '#805AD5', '#319795', '#DD6B20'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleExport = (format) => {
    if (zones.length === 0) {
      toast({
        title: 'Aucune zone',
        description: 'Aucune zone à exporter',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    const exportData = {
      type: 'FeatureCollection',
      features: zones
    };

    let dataStr, mimeType, fileName;

    switch(format) {
      case 'geojson':
        dataStr = JSON.stringify(exportData, null, 2);
        mimeType = 'application/geo+json';
        fileName = `reserves_togo_${Date.now()}.geojson`;
        break;
      case 'shp':
        // Pour Shapefile, besoin d'une API backend
        exportToShapefile(exportData);
        return;
      case 'kml':
        dataStr = convertToKML(exportData);
        mimeType = 'application/vnd.google-earth.kml+xml';
        fileName = `reserves_togo_${Date.now()}.kml`;
        break;
      default:
        dataStr = JSON.stringify(zones, null, 2);
        mimeType = 'application/json';
        fileName = `reserves_${Date.now()}.json`;
    }

    downloadFile(dataStr, fileName, mimeType);
  };

  const convertToKML = (geojson) => {
    // Conversion simplifiée GeoJSON vers KML
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>Réserves administratives - Togo</name>
  <description>Export depuis le système de gestion</description>`;

    geojson.features.forEach(feature => {
      const coords = feature.geometry.coordinates[0]
        .map(coord => `${coord[0]},${coord[1]},0`)
        .join(' ');

      kml += `
  <Placemark>
    <name>${feature.properties.name}</name>
    <description>
      Superficie: ${(feature.properties.area / 1000000).toFixed(2)} km²
    </description>
    <Style>
      <LineStyle>
        <color>ff0000</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>4dff0000</color>
      </PolyStyle>
    </Style>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>${coords}</coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>`;
    });

    kml += `
</Document>
</kml>`;

    return kml;
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export réussi',
      description: `Fichier ${fileName} téléchargé`,
      status: 'success',
      duration: 3000
    });
  };

  const clearAllZones = () => {
    if (map) {
      map.eachLayer(layer => {
        if (layer.pm && !(layer instanceof L.TileLayer)) {
          layer.remove();
        }
      });
    }
    setZones([]);
    
    toast({
      title: 'Carte effacée',
      description: 'Toutes les zones ont été supprimées',
      status: 'info',
      duration: 3000
    });
  };

  const changeMapStyle = (style) => {
    setMapStyle(style);
    if (map) {
      updateTileLayer(map, style);
    }
  };

  // ==================== RENDU ====================
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Barre d'outils */}
        <HStack justify="space-between" flexWrap="wrap" p={4} bg="white" borderRadius="md" shadow="sm">
          <Text fontSize="lg" fontWeight="bold" color="blue.700">
            🇹🇬 Carte interactive du Togo
          </Text>
          
          {!readOnly && (
            <HStack spacing={2}>
              {/* Sélection du style de carte */}
              <Menu>
                <MenuButton as={Button} size="sm" leftIcon={<FiMap />}>
                  Fond de carte
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => changeMapStyle('osm')}>
                    OpenStreetMap
                  </MenuItem>
                  <MenuItem onClick={() => changeMapStyle('topo')}>
                    Topographique
                  </MenuItem>
                  <MenuItem onClick={() => changeMapStyle('satellite')}>
                    Satellite
                  </MenuItem>
                </MenuList>
              </Menu>

              {/* Export */}
              <Menu>
                <MenuButton as={Button} size="sm" leftIcon={<FiDownload />}>
                  Exporter
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleExport('geojson')}>
                    GeoJSON
                  </MenuItem>
                  <MenuItem onClick={() => handleExport('kml')}>
                    KML (Google Earth)
                  </MenuItem>
                  <MenuItem onClick={() => handleExport('shp')}>
                    Shapefile
                  </MenuItem>
                </MenuList>
              </Menu>

              <IconButton
                icon={<FiTrash2 />}
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={clearAllZones}
                aria-label="Effacer tout"
              />
            </HStack>
          )}
        </HStack>

        {/* Panneau de contrôle des couches */}
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiSettings />
                  <Text fontWeight="semibold">Couches cartographiques</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text>Limites régionales</Text>
                  <Switch
                    isChecked={layerVisibility.regions}
                    onChange={(e) => setLayerVisibility({
                      ...layerVisibility,
                      regions: e.target.checked
                    })}
                  />
                </HStack>
                <HStack justify="space-between">
                  <Text>Préfectures</Text>
                  <Switch
                    isChecked={layerVisibility.prefectures}
                    onChange={(e) => setLayerVisibility({
                      ...layerVisibility,
                      prefectures: e.target.checked
                    })}
                  />
                </HStack>
                <HStack justify="space-between">
                  <Text>Réserves</Text>
                  <Switch
                    isChecked={layerVisibility.reserves}
                    onChange={(e) => setLayerVisibility({
                      ...layerVisibility,
                      reserves: e.target.checked
                    })}
                  />
                </HStack>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Statistiques */}
        {zones.length > 0 && (
          <HStack spacing={4} p={3} bg="blue.50" borderRadius="md">
            <Badge colorScheme="blue">
              🏞️ {zones.length} zone{zones.length > 1 ? 's' : ''}
            </Badge>
            <Badge colorScheme="green">
              📏 {zones.reduce((sum, z) => sum + (z.properties?.area || 0), 0) / 1000000} km²
            </Badge>
          </HStack>
        )}

        {/* Carte */}
        <Box
          id="togo-map"
          ref={mapRef}
          h="600px"
          borderRadius="lg"
          border="2px"
          borderColor="gray.200"
          overflow="hidden"
          boxShadow="lg"
        />

        {/* Instructions */}
        {!readOnly && (
          <Box p={4} bg="gray.50" borderRadius="md">
            <Text fontWeight="semibold" mb={2}>🎯 Comment dessiner une réserve :</Text>
            <VStack spacing={1} align="stretch">
              <Text>1. Utilisez l'outil "Polygon" pour dessiner une zone libre</Text>
              <Text>2. Utilisez "Rectangle" ou "Circle" pour des formes régulières</Text>
              <Text>3. Modifiez les points existants avec l'outil d'édition</Text>
              <Text>4. Donnez un nom à votre zone lorsque demandé</Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default TogoLeafletMap;