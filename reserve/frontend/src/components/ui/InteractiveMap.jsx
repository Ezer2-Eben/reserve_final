// src/components/ui/InteractiveMap.jsx
import { Box, Button, HStack, Text, VStack, Badge, useToast, SimpleGrid, Card, CardBody, Select } from '@chakra-ui/react';
import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';

// Remplacez par votre clé API MapTiler
const MAPTILER_API_KEY = 'YHTQsENEYrr2M8S1zxVX';

const InteractiveMap = forwardRef((props, ref) => {
  const {
    onZoneSelect,
    readOnly = false,
    existingZones = [],
    fitBounds = null,
    onMapReady = null,
    highlightZoneId = null,
    initialView = [1.1659, 8.6195], // [lng, lat] pour le Togo
    initialZoom = 8,
    showTopBar = true,
    showRegionStats = true,
    onStatsUpdate = null
  } = props;

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [mapStats, setMapStats] = useState(null);
  const [mapStyle, setMapStyle] = useState('hybrid');
  const [communesData, setCommunesData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const toast = useToast();

  // Exposer la carte au parent
  useImperativeHandle(ref, () => ({
    setView: (center, zoom) => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: center,
          zoom: zoom,
          duration: 1500
        });
      }
    },
    fitBounds: (bounds, options) => {
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 18,
          animate: true,
          duration: 1.5,
          ...options
        });
      }
    },
    getMap: () => mapRef.current,
    getDrawingTools: () => drawRef.current,
    resetView: () => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: initialView,
          zoom: initialZoom,
          duration: 1500
        });
      }
    }
  }));

  // Appliquer le fitBounds quand il change
  useEffect(() => {
    if (fitBounds && mapRef.current) {
      mapRef.current.fitBounds(fitBounds, {
        padding: [50, 50],
        maxZoom: 18,
        animate: true,
        duration: 1.5
      });
    }
  }, [fitBounds]);

  // Mettre en évidence une zone spécifique
  useEffect(() => {
    if (highlightZoneId && mapRef.current && existingZones.length > 0) {
      const zone = existingZones.find(z => z.id === highlightZoneId);
      if (zone && zone.geometry) {
        // Calculer les bounds de la zone
        const coordinates = zone.geometry.coordinates[0];
        const bounds = new window.maptilersdk.LngLatBounds();
        
        coordinates.forEach(coord => {
          bounds.extend(coord);
        });
        
        mapRef.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15,
          animate: true,
          duration: 2
        });
        
        // Mettre en surbrillance la zone
        if (mapRef.current.getLayer(`highlight-${highlightZoneId}`)) {
          mapRef.current.removeLayer(`highlight-${highlightZoneId}`);
          mapRef.current.removeSource(`highlight-${highlightZoneId}`);
        }
        
        mapRef.current.addSource(`highlight-${highlightZoneId}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: zone.geometry,
            properties: { name: zone.name || 'Zone' }
          }
        });
        
        mapRef.current.addLayer({
          id: `highlight-${highlightZoneId}`,
          type: 'line',
          source: `highlight-${highlightZoneId}`,
          paint: {
            'line-color': '#ff0000',
            'line-width': 4,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2]
          }
        });
      }
    }
  }, [highlightZoneId, existingZones]);

  // Charger les données GeoJSON des communes
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setIsLoadingData(true);
        const response = await fetch('/data/données_commune.geojson');
        
        if (!response.ok) {
          throw new Error(`Fichier non trouvé (HTTP ${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data || !data.features || data.features.length === 0) {
          throw new Error('Fichier GeoJSON vide ou invalide');
        }
        
        setCommunesData(data);
        calculateMapStats(data);
        console.log(`✅ ${data.features.length} communes chargées`);
      } catch (error) {
        console.error('Erreur chargement GeoJSON:', error);
        toast({
          title: '❌ Erreur de chargement',
          description: 'Placez le fichier données_commune.geojson dans public/data/',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadGeoJSON();
  }, [toast]);

  // Quand la carte est prête
  const handleMapCreated = (map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  };

  // Initialiser MapTiler
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !window.maptilersdk) return;

    // Configuration MapTiler
    window.maptilersdk.config.apiKey = MAPTILER_API_KEY;

    // Créer la carte
    const map = new window.maptilersdk.Map({
      container: mapContainerRef.current,
      style: getMapStyle(mapStyle),
      center: initialView,
      zoom: initialZoom,
      minZoom: 7,
      maxZoom: 20,
      language: 'fr'
    });

    mapRef.current = map;

    map.on('load', () => {
      handleMapCreated(map);
      
      // Ajouter les contrôles
      map.addControl(new window.maptilersdk.NavigationControl(), 'top-right');
      map.addControl(new window.maptilersdk.FullscreenControl(), 'top-right');
      map.addControl(new window.maptilersdk.ScaleControl(), 'bottom-left');

      // Ajouter les communes
      if (communesData) {
        addCommunesToMap(map, communesData);
      }

      // Ajouter les outils de dessin si non lecture seule
      if (!readOnly) {
        addDrawingTools(map);
      }

      // Ajouter les zones existantes
      if (existingZones && existingZones.length > 0) {
        addExistingZones(map, existingZones);
      }

      // Appliquer fitBounds initial si fourni
      if (fitBounds) {
        map.fitBounds(fitBounds, {
          padding: [50, 50],
          maxZoom: 18,
          animate: true,
          duration: 1.5
        });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [communesData, mapStyle, readOnly, existingZones, fitBounds, initialView, initialZoom]);

  // Styles de carte MapTiler
  const getMapStyle = (style) => {
    const styles = {
      hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`,
      satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`,
      streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
      basic: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`,
      outdoor: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_API_KEY}`,
      topo: `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_API_KEY}`
    };
    return styles[style] || styles.hybrid;
  };

  // Ajouter les communes sur la carte
  const addCommunesToMap = (map, data) => {
    // Vérifier si la source existe déjà
    if (map.getSource('communes')) {
      map.getSource('communes').setData(data);
      return;
    }

    // Ajouter la source des communes
    map.addSource('communes', {
      type: 'geojson',
      data: data
    });

    // Couche de remplissage (polygones)
    map.addLayer({
      id: 'communes-fill',
      type: 'fill',
      source: 'communes',
      paint: {
        'fill-color': [
          'match',
          ['get', 'NAME_1'],
          'Centre', '#f59e0b',
          'Kara', '#ef4444',
          'Maritime', '#3b82f6',
          'Plateaux', '#10b981',
          'Savanes', '#8b5cf6',
          '#6b7280'
        ],
        'fill-opacity': 0.15
      }
    });

    // Couche de bordures
    map.addLayer({
      id: 'communes-outline',
      type: 'line',
      source: 'communes',
      paint: {
        'line-color': '#ffffff',
        'line-width': 0.5,
        'line-opacity': 0.4
      }
    });

    // Couche de survol
    map.addLayer({
      id: 'communes-hover',
      type: 'line',
      source: 'communes',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0
      }
    });

    // Instancier le popup de survol s'il n'existe pas
    if (!window.hoverPopup) {
      window.hoverPopup = new window.maptilersdk.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15
      });
    }

    // Événements de survol
    map.on('mousemove', 'communes-fill', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;
        
        const communeName = props.NAME_3 || '';
        let reservesCount = 0;
        
        // Calculer le nombre de réserves dans cette commune (par correspondance de texte)
        if (existingZones && existingZones.length > 0) {
          reservesCount = existingZones.filter(z => {
             const loc = z.properties?.localisation?.toLowerCase() || '';
             const nom = z.properties?.nom?.toLowerCase() || z.name?.toLowerCase() || '';
             return (communeName && loc.includes(communeName.toLowerCase())) || 
                    (communeName && nom.includes(communeName.toLowerCase()));
          }).length;
        }

        setSelectedCommune({
          name: props.NAME_3 || 'Commune',
          region: props.NAME_1 || 'Région',
          prefecture: props.NAME_2 || 'Préfecture',
          reservesCount: reservesCount,
          gid: props.GID_3
        });

        map.getCanvas().style.cursor = 'pointer';
        
        // Highlight au survol
        map.setPaintProperty('communes-hover', 'line-opacity', 0.8);
        map.setFilter('communes-hover', ['==', 'GID_3', props.GID_3]);

        // Afficher le popup
        window.hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: Arial; padding: 5px; min-width: 150px;">
              <strong style="color: #2c3e50; font-size: 14px;">📍 ${props.NAME_3 || 'Commune'}</strong><br/>
              <span style="font-size: 12px; color: #666;">${props.NAME_1 || 'Région'} • ${props.NAME_2 || 'Préfecture'}</span><br/>
              <div style="margin-top: 6px; padding: 4px; background: ${reservesCount > 0 ? '#dcfce7' : '#f1f5f9'}; border-radius: 4px; display: inline-block;">
                <span style="font-size: 12px; color: ${reservesCount > 0 ? '#166534' : '#475569'};"><strong>${reservesCount}</strong> réserve(s)</span>
              </div>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on('mouseleave', 'communes-fill', () => {
      setSelectedCommune(null);
      map.getCanvas().style.cursor = '';
      map.setPaintProperty('communes-hover', 'line-opacity', 0);
      if (window.hoverPopup) window.hoverPopup.remove();
    });

    // Événement de clic
    map.on('click', 'communes-fill', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;

        // Popup
        new window.maptilersdk.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: Arial; padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
                📍 ${props.NAME_3 || 'Commune'}
              </h3>
              <div style="margin: 5px 0;">
                <strong>Région:</strong> ${props.NAME_1 || 'N/A'}
              </div>
              <div style="margin: 5px 0;">
                <strong>Préfecture:</strong> ${props.NAME_2 || 'N/A'}
              </div>
              <div style="margin: 5px 0;">
                <strong>ID:</strong> <span style="color: #666; font-size: 11px;">${props.GID_3 || 'N/A'}</span>
              </div>
            </div>
          `)
          .addTo(map);

        // Zoomer sur la commune
        const bounds = new window.maptilersdk.LngLatBounds();
        if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates[0][0].forEach(coord => {
            bounds.extend(coord);
          });
        } else if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
          });
        }
        map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    });
  };

  // Ajouter les outils de dessin
  const addDrawingTools = (map) => {
    if (!window.MapboxDraw || drawRef.current) return;

    const draw = new window.MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.4
          }
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3
          }
        }
      ]
    });

    map.addControl(draw, 'top-left');
    drawRef.current = draw;

    map.on('draw.create', (e) => {
      const feature = e.features[0];
      onZoneSelect?.(JSON.stringify(feature));
      toast({
        title: '✅ Zone créée',
        status: 'success',
        duration: 2000
      });
    });

    map.on('draw.delete', () => {
      onZoneSelect?.(null);
      toast({
        title: '🗑️ Zone supprimée',
        status: 'warning',
        duration: 2000
      });
    });

    map.on('draw.update', (e) => {
      const feature = e.features[0];
      onZoneSelect?.(JSON.stringify(feature));
      toast({
        title: '✏️ Zone modifiée',
        status: 'info',
        duration: 2000
      });
    });
  };

  // Ajouter les zones existantes
  const addExistingZones = (map, zones) => {
    zones.forEach((zone, index) => {
      if (!zone.geometry) return;

      const sourceId = `reserve-${zone.id || index}`;
      
      // Supprimer la source existante si elle existe
      if (map.getSource(sourceId)) {
        map.removeLayer(`reserve-fill-${sourceId}`);
        map.removeLayer(`reserve-outline-${sourceId}`);
        map.removeSource(sourceId);
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: zone.geometry,
          properties: { 
            name: zone.name || 'Réserve',
            id: zone.id || index
          }
        }
      });

      map.addLayer({
        id: `reserve-fill-${sourceId}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#ff7800',
          'fill-opacity': zone.id === highlightZoneId ? 0.6 : 0.4
        }
      });

      map.addLayer({
        id: `reserve-outline-${sourceId}`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#ff5500',
          'line-width': zone.id === highlightZoneId ? 3 : 2
        }
      });

      // Ajouter un popup pour la zone
      map.on('click', `reserve-fill-${sourceId}`, (e) => {
        if (e.features.length > 0) {
          const props = e.features[0].properties;
          
          new window.maptilersdk.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: Arial; padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #ff5500; font-size: 16px; border-bottom: 2px solid #ff5500; padding-bottom: 5px;">
                  ⚠️ ${props.name}
                </h3>
                <div style="margin: 5px 0;">
                  <strong>Type:</strong> Zone existante
                </div>
                <div style="margin: 5px 0;">
                  <strong>ID:</strong> <span style="color: #666; font-size: 11px;">${props.id}</span>
                </div>
              </div>
            `)
            .addTo(map);
        }
      });

      // Effet de survol
      map.on('mouseenter', `reserve-fill-${sourceId}`, () => {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(`reserve-outline-${sourceId}`, 'line-width', 3);
      });

      map.on('mouseleave', `reserve-fill-${sourceId}`, () => {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(`reserve-outline-${sourceId}`, 'line-width', zone.id === highlightZoneId ? 3 : 2);
      });
    });
  };

  // Calculer les statistiques
  const calculateMapStats = (data) => {
    if (!data || !data.features) return;

    const regions = {};
    const prefectures = new Set();

    data.features.forEach(feature => {
      const region = feature.properties.NAME_1 || 'Inconnu';
      const prefecture = feature.properties.NAME_2 || 'Inconnu';
      
      regions[region] = (regions[region] || 0) + 1;
      if (prefecture !== 'Inconnu') prefectures.add(prefecture);
    });

    const stats = {
      communes: data.features.length,
      regions: Object.keys(regions).length,
      prefectures: prefectures.size,
      byRegion: regions
    };

    setMapStats(stats);
    if (onStatsUpdate) onStatsUpdate(stats);
  };

  // Changer le style de carte
  const handleMapStyleChange = (style) => {
    setMapStyle(style);
    if (mapRef.current) {
      mapRef.current.setStyle(getMapStyle(style));
      
      // Réajouter les couches après changement de style
      mapRef.current.once('style.load', () => {
        if (communesData) {
          addCommunesToMap(mapRef.current, communesData);
        }
        if (existingZones && existingZones.length > 0) {
          addExistingZones(mapRef.current, existingZones);
        }
        if (!readOnly && drawRef.current) {
          mapRef.current.addControl(drawRef.current, 'top-left');
        }
        
        // Réappliquer le highlight si nécessaire
        if (highlightZoneId) {
          const zone = existingZones.find(z => z.id === highlightZoneId);
          if (zone) {
            // Réappliquer la mise en évidence
          }
        }
      });
    }
  };

  // Recentrer
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: initialView,
        zoom: initialZoom,
        duration: 1500
      });
    }
  };

  // Couleurs par région
  const getColorByRegion = (region) => {
    const colors = {
      'Centre': '#f59e0b',
      'Kara': '#ef4444',
      'Maritime': '#3b82f6',
      'Plateaux': '#10b981',
      'Savanes': '#8b5cf6'
    };
    return colors[region] || '#6b7280';
  };

  return (
    <VStack spacing={4} align="stretch" w="full">
      {/* Loader */}
      {isLoadingData && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">⏳ Chargement des communes du Togo...</Text>
        </Box>
      )}

      {/* Barre d'information */}
      {showTopBar && (
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <HStack spacing={3} flexWrap="wrap">
            {mapStats && (
              <>
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                  📍 {mapStats.communes} Communes
                </Badge>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  🗺️ {mapStats.regions} Régions
                </Badge>
                <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                  🏛️ {mapStats.prefectures} Préfectures
                </Badge>
              </>
            )}
          </HStack>
          
          <HStack spacing={2}>
            <Select 
              size="sm" 
              value={mapStyle} 
              onChange={(e) => handleMapStyleChange(e.target.value)}
              w="150px"
            >
              <option value="hybrid">🛰️ Hybride</option>
              <option value="satellite">📡 Satellite</option>
              <option value="streets">🗺️ Rues</option>
              <option value="outdoor">🌳 Extérieur</option>
              <option value="topo">⛰️ Topographique</option>
            </Select>
            <Button size="sm" onClick={resetView} colorScheme="blue" variant="outline">
              🔄 Recentrer
            </Button>
          </HStack>
        </HStack>
      )}

      {/* Statistiques par région */}
      {mapStats && mapStats.byRegion && showRegionStats && (
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2}>
          {Object.entries(mapStats.byRegion).map(([region, count]) => (
            <Card key={region} size="sm" variant="outline">
              <CardBody py={2}>
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="medium">{region}</Text>
                  <Badge 
                    fontSize="xs"
                    bg={getColorByRegion(region)}
                    color="white"
                  >
                    {count}
                  </Badge>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Commune sélectionnée */}
      {selectedCommune && (
        <Box bg="blue.50" p={3} borderRadius="md" border="1px" borderColor="blue.200">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="bold" color="blue.800">
                📍 {selectedCommune.name}
              </Text>
              <Text fontSize="xs" color="blue.600">
                {selectedCommune.region} • {selectedCommune.prefecture}
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color={selectedCommune.reservesCount > 0 ? "green.600" : "gray.500"} mt={1}>
                {selectedCommune.reservesCount} réserve(s) dans cette commune
              </Text>
            </VStack>
            <VStack align="end">
              <Badge colorScheme="blue" fontSize="xs">
                {selectedCommune.gid}
              </Badge>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Zone en surbrillance */}
      {highlightZoneId && (
        <Box bg="red.50" p={2} borderRadius="md" border="1px" borderColor="red.200">
          <Text fontSize="xs" fontWeight="bold" color="red.700">
            🎯 Zone en surbrillance (ID: {highlightZoneId})
          </Text>
        </Box>
      )}

      {/* Carte MapTiler */}
      <Box position="relative" w="full" h="700px" borderRadius="lg" overflow="hidden" border="2px" borderColor="gray.200" shadow="xl">
        <Box 
          ref={mapContainerRef}
          w="full"
          h="full"
        />

        {/* Contrôles Flottants (Visible quand la barre supérieure est cachée) */}
        {!showTopBar && (
          <Box position="absolute" top={4} right={4} zIndex={10}>
            <VStack spacing={2} align="end">
              <Select 
                size="sm" 
                value={mapStyle} 
                onChange={(e) => handleMapStyleChange(e.target.value)}
                w="140px"
                bg="white"
                borderRadius="md"
                boxShadow="lg"
                className="glassmorphism"
                borderColor="gray.200"
                _hover={{ borderColor: 'brand.300' }}
              >
                <option value="hybrid">🛰️ Hybride</option>
                <option value="satellite">📡 Satellite</option>
                <option value="streets">🗺️ Rues</option>
                <option value="outdoor">🌳 Extérieur</option>
                <option value="topo">⛰️ Topographique</option>
              </Select>
              <Button 
                size="sm" 
                onClick={resetView} 
                colorScheme="brand" 
                bg="white"
                color="brand.600"
                variant="solid" 
                leftIcon={<span>🔄</span>}
                boxShadow="lg"
                borderRadius="md"
                _hover={{ bg: 'brand.50' }}
              >
                Recentrer
              </Button>
            </VStack>
          </Box>
        )}
      </Box>

      {/* Légende */}
      <Box bg="gray.50" p={4} borderRadius="md">
        <Text fontSize="sm" fontWeight="bold" mb={3}>
          🎨 Légende des régions du Togo
        </Text>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
          {['Centre', 'Kara', 'Maritime', 'Plateaux', 'Savanes'].map(region => (
            <HStack key={region}>
              <Box 
                w="20px" 
                h="20px" 
                bg={getColorByRegion(region)} 
                borderRadius="sm" 
                border="1px" 
                borderColor="gray.300" 
              />
              <Text fontSize="xs" fontWeight="medium">{region}</Text>
            </HStack>
          ))}
          <HStack>
            <Box w="20px" h="20px" bg="#ff7800" borderRadius="sm" border="1px" borderColor="gray.300" />
            <Text fontSize="xs" fontWeight="medium">Réserves</Text>
          </HStack>
          {highlightZoneId && (
            <HStack>
              <Box w="20px" h="20px" bg="#ff0000" borderRadius="sm" border="1px" borderColor="gray.300" />
              <Text fontSize="xs" fontWeight="medium">Zone active</Text>
            </HStack>
          )}
        </SimpleGrid>
      </Box>

      {/* Instructions */}
      {!readOnly && (
        <Box bg="blue.50" p={3} borderRadius="md" fontSize="sm" color="blue.800">
          <Text fontWeight="bold" mb={1}>💡 Instructions :</Text>
          <Text>• Zoomez jusqu'au niveau 20 pour voir les maisons et rues</Text>
          <Text>• Mode Hybride recommandé pour voir satellite + noms de lieux</Text>
          <Text>• Utilisez l'outil polygone (en haut à gauche) pour délimiter les lots</Text>
          <Text>• Cliquez sur une commune pour zoomer et voir ses détails</Text>
          <Text>• Utilisez l'icône poubelle pour supprimer une zone dessinée</Text>
        </Box>
      )}
    </VStack>
  );
});

InteractiveMap.displayName = 'InteractiveMap';

export default InteractiveMap;