// src/pages/nouvelle_reserve.jsx - Repurposed for Exploration Géographique
import {
  Box, Flex, VStack, HStack, Heading, Text, Button,
  IconButton, Card, CardBody, Divider, Switch, Drawer,
  DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, useDisclosure, SimpleGrid, Icon,
  Tooltip, Badge
} from '@chakra-ui/react';
import * as turf from '@turf/turf';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  FiZoomIn, FiZoomOut, FiNavigation, 
  FiTarget, FiGrid, FiDownload, FiLayers, FiMenu, 
  FiArrowLeft, FiMap, FiChevronRight, FiCheckCircle, FiMapPin
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import DrawingToolsPanel from '../components/maps/DrawingToolsPanel';
import InteractiveDrawingMap from '../components/maps/InteractiveDrawingMap';
import RegionSelectorMap from '../components/maps/RegionSelectorMap';
import ZoneInfoPanel from '../components/maps/ZoneInfoPanel';
import communesGeoJSON from '../data/donnees_commune.json';
import { reserveService } from '../services/apiService';

const ExplorationPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const drawingToolsRef = useRef(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  // État pour les réserves existantes et les compteurs géographiques
  const [existingReserves, setExistingReserves] = useState([]);
  const [reserveStats, setReserveStats] = useState({ regions: {}, prefectures: {}, communes: {} });

  // États du flux (entonnoir géographique)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);

  const [geometry, setGeometry] = useState(null);
  const [zoneName, setZoneName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState('polygon');
  const [measurements, setMeasurements] = useState({
    area: 0, perimeter: 0, areaHectares: 0,
    areaSquareMeters: 0, bounds: null,
    centerLat: 0, centerLng: 0
  });

  const [mapStyle, setMapStyle] = useState('satellite');
  const [showLabels, setShowLabels] = useState(true);
  const [showCommunes, setShowCommunes] = useState(true);
  const [mapCenter] = useState([8.5, 0.8]);
  const [mapZoom] = useState(10);
  
  const [mapBounds, setMapBounds] = useState({
    minLat: 6.1, maxLat: 11.1, minLng: -0.1, maxLng: 1.8
  });

  // Hiérarchie générée depuis le GeoJSON
  const hierarchy = useMemo(() => {
    const data = {};
    if (communesGeoJSON && communesGeoJSON.features) {
       communesGeoJSON.features.forEach(feature => {
          const r = feature.properties.NAME_1;
          const p = feature.properties.NAME_2;
          const c = feature.properties.NAME_3;
          
          if (!data[r]) data[r] = {};
          if (!data[r][p]) data[r][p] = [];
          
          data[r][p].push({
             name: c,
             feature: feature
          });
       });
    }
    return data;
  }, []);

  useEffect(() => {
    const fetchExistingReserves = async () => {
      try {
        const data = await reserveService.getAll();
        setExistingReserves(data);

        // Calculer la distribution des zones
        const stats = { regions: {}, prefectures: {}, communes: {} };
        
        data.forEach(reserve => {
          if (reserve.latitude && reserve.longitude && communesGeoJSON?.features) {
            try {
              const pt = turf.point([reserve.longitude, reserve.latitude]);
              
              // Trouver la commune (recherche géographique)
              let foundCommune = null;
              for (const feature of communesGeoJSON.features) {
                // Utiliser booleanPointInPolygon pour vérifier si le point est dans la géométrie
                if (turf.booleanPointInPolygon(pt, feature.geometry)) {
                   foundCommune = feature;
                   break;
                }
              }

              if (foundCommune) {
                const r = foundCommune.properties.NAME_1;
                const p = foundCommune.properties.NAME_2;
                const c = foundCommune.properties.NAME_3;
                
                stats.regions[r] = (stats.regions[r] || 0) + 1;
                stats.prefectures[p] = (stats.prefectures[p] || 0) + 1;
                stats.communes[c] = (stats.communes[c] || 0) + 1;
              }
            } catch (err) {
               console.error("Erreur géo-spatiale pour la réserve:", reserve.nom, err);
            }
          }
        });
        
        setReserveStats(stats);
      } catch (error) {
        console.error('Erreur lors du chargement des réserves existantes:', error);
      }
    };
    fetchExistingReserves();
  }, [communesGeoJSON]);

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setCurrentStep(2);
  };

  const handlePrefectureSelect = (prefecture) => {
    setSelectedPrefecture(prefecture);
    setCurrentStep(3);
  };

  const handleCommuneSelect = (commune) => {
    setSelectedCommune(commune);
    const box = turf.bbox(commune.feature);
    setMapBounds({
      minLng: box[0], minLat: box[1], maxLng: box[2], maxLat: box[3]
    });
    setCurrentStep(4);
  };

  const handleGoBack = () => {
    if (currentStep === 4) {
      setCurrentStep(3);
      setSelectedCommune(null);
      setMapBounds({ minLat: 6.1, maxLat: 11.1, minLng: -0.1, maxLng: 1.8 });
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setSelectedPrefecture(null);
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedRegion(null);
    } else {
      navigate('/dashboard/reserves');
    }
  };

  const handleGeometryComplete = useCallback((geo) => {
    if (!geo) return;
    setGeometry(geo);
    
    // Simplification du calcul des mesures
    const feature = { type: 'Feature', properties: {}, geometry: geo };
    const area = turf.area(feature); // m²
    const center = turf.center(feature);
    
    setMeasurements({
      area: area,
      perimeter: 0, // Optionnel ici
      areaHectares: area / 10000,
      areaSquareMeters: area,
      centerLat: center.geometry.coordinates[1],
      centerLng: center.geometry.coordinates[0]
    });

    onOpen();
  }, [onOpen]);

  const handleClearDrawing = () => {
    setGeometry(null);
    setMeasurements({ area: 0, perimeter: 0, areaHectares: 0, areaSquareMeters: 0, bounds: null, centerLat: 0, centerLng: 0 });
    if (drawingToolsRef.current) drawingToolsRef.current.clearDrawing();
  };

  const handleDrawingStart = () => { setIsDrawing(true); };
  const handleDrawingEnd = () => { setIsDrawing(false); };

  const getStepText = () => {
    if (currentStep === 1) return "Sélectionnez la Région (1/4)";
    if (currentStep === 2) return `Région ${selectedRegion} - Préfecture (2/4)`;
    if (currentStep === 3) return `Préfecture ${selectedPrefecture} - Commune (3/4)`;
    return `Commune : ${selectedCommune?.name} - Exploration (4/4)`;
  };

  return (
    <Box h="100vh" bg="gray.50" overflow="hidden" display="flex" flexDirection="column">
      {/* HEADER */}
      <Flex bg="white" p={4} align="center" justify="space-between" shadow="sm" borderBottom="1px" borderColor="gray.200" zIndex={1000}>
        <HStack spacing={4}>
          <IconButton icon={<FiArrowLeft />} variant="ghost" aria-label="Retour" onClick={handleGoBack} />
          <VStack align="start" spacing={0}>
            <Heading size="md" color="brand.600">🗺️ Exploration Géographique</Heading>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">{getStepText()}</Text>
          </VStack>
        </HStack>
        
        <HStack spacing={2} display={{ base: 'none', lg: 'flex' }} color="gray.400" fontSize="sm">
          <Flex align="center" color={currentStep >= 1 ? 'brand.500' : 'inherit'} fontWeight={currentStep === 1 ? 'bold' : 'normal'}>
            <Icon as={FiMap} mr={1} /> Région
          </Flex>
          <Icon as={FiChevronRight} />
          <Flex align="center" color={currentStep >= 2 ? 'brand.500' : 'inherit'} fontWeight={currentStep === 2 ? 'bold' : 'normal'}>
            <Icon as={FiMapPin} mr={1} /> Préfecture
          </Flex>
          <Icon as={FiChevronRight} />
          <Flex align="center" color={currentStep >= 3 ? 'brand.500' : 'inherit'} fontWeight={currentStep === 3 ? 'bold' : 'normal'}>
            <Icon as={FiMapPin} mr={1} /> Commune
          </Flex>
          <Icon as={FiChevronRight} />
          <Flex align="center" color={currentStep === 4 ? 'brand.500' : 'inherit'} fontWeight={currentStep === 4 ? 'bold' : 'normal'}>
            <Icon as={FiCheckCircle} mr={1} /> Exploration
          </Flex>
        </HStack>

        <HStack spacing={3}>
          {currentStep === 4 && (
            <Button leftIcon={<FiMenu />} variant="outline" onClick={onOpen} ref={btnRef}>
              Détails de la zone
            </Button>
          )}
        </HStack>
      </Flex>

      {/* CONTENT */}
      <Box flex="1" position="relative" overflowY="auto" overflowX="hidden" bg="gray.100">
        {currentStep === 1 && (
          <Flex h="full" w="full" p={{ base: 4, md: 8 }} align="center" justify="center">
            <Box maxW="1200px" w="full" h={{ base: '80vh', lg: '90vh' }}>
              <RegionSelectorMap 
                 communesData={communesGeoJSON} 
                 onRegionSelect={handleRegionSelect} 
                 communeStats={reserveStats.communes}
              />
            </Box>
          </Flex>
        )}

        {currentStep === 2 && (
          <Box p={8} maxW="1200px" mx="auto">
            <Heading size="lg" mb={6} color="gray.700">Préfectures - {selectedRegion}</Heading>
            <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={6}>
              {Object.keys(hierarchy[selectedRegion] || {}).sort().map(prefecture => {
                const count = reserveStats.prefectures[prefecture] || 0;
                return (
                <Card key={prefecture} cursor="pointer" _hover={{ shadow: 'xl', borderColor: 'brand.300' }} borderWidth="2px" borderColor="transparent" onClick={() => handlePrefectureSelect(prefecture)}>
                  <CardBody p={6} position="relative">
                    {count > 0 && (
                      <Badge position="absolute" top={3} right={3} colorScheme="red" borderRadius="full" px={2} py={1}>
                        {count} {count > 1 ? 'réserves' : 'réserve'}
                      </Badge>
                    )}
                    <VStack spacing={3}>
                      <Icon as={FiLayers} boxSize={8} color="brand.500" />
                      <Text fontSize="xl" fontWeight="bold" textAlign="center">{prefecture}</Text>
                      <Text fontSize="sm" color="gray.500">{hierarchy[selectedRegion][prefecture].length} communes</Text>
                    </VStack>
                  </CardBody>
                </Card>
              )})}
            </SimpleGrid>
          </Box>
        )}

        {currentStep === 3 && (
          <Box p={8} maxW="1200px" mx="auto">
            <Heading size="lg" mb={6} color="gray.700">Communes - {selectedPrefecture}</Heading>
            <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={6}>
              {hierarchy[selectedRegion][selectedPrefecture].sort((a,b) => a.name.localeCompare(b.name)).map((commune, idx) => {
                const count = reserveStats.communes[commune.name] || 0;
                return (
                <Card key={idx} cursor="pointer" _hover={{ shadow: 'xl', borderColor: 'brand.400' }} borderWidth="2px" borderColor="transparent" bg="white" onClick={() => handleCommuneSelect(commune)}>
                  <CardBody p={5}>
                    <HStack spacing={4} justify="space-between">
                       <HStack spacing={4}>
                         <Flex bg="brand.50" p={3} borderRadius="full" color="brand.600"><Icon as={FiTarget} boxSize={5} /></Flex>
                         <Text fontSize="md" fontWeight="bold">{commune.name}</Text>
                       </HStack>
                       {count > 0 && (
                         <Badge colorScheme="red" borderRadius="full" px={2} py={1}>
                           {count}
                         </Badge>
                       )}
                    </HStack>
                  </CardBody>
                </Card>
              )})}
            </SimpleGrid>
          </Box>
        )}

        {currentStep === 4 && (
          <Box h="full" w="full" position="relative">
            <Box position="absolute" top={4} right={4} zIndex={500}>
              <Card shadow="md">
                <CardBody p={3}>
                  <VStack spacing={3} align="stretch">
                    <HStack spacing={2} justify="center">
                      <Tooltip label="Satellite"><IconButton icon={<FiGrid />} size="sm" colorScheme={mapStyle === 'satellite' ? 'brand' : 'gray'} onClick={() => setMapStyle('satellite')} /></Tooltip>
                      <Tooltip label="Topographique"><IconButton icon={<FiNavigation />} size="sm" colorScheme={mapStyle === 'topographic' ? 'brand' : 'gray'} onClick={() => setMapStyle('topographic')} /></Tooltip>
                    </HStack>
                    <HStack spacing={2} justify="center">
                      <IconButton icon={<FiZoomIn />} size="sm" onClick={() => mapRef.current?.zoomIn()} />
                      <IconButton icon={<FiZoomOut />} size="sm" onClick={() => mapRef.current?.zoomOut()} />
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                       <HStack justify="space-between"><Text fontSize="xs">Labels</Text><Switch size="sm" isChecked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /></HStack>
                       <HStack justify="space-between"><Text fontSize="xs">Communes</Text><Switch size="sm" isChecked={showCommunes} onChange={(e) => setShowCommunes(e.target.checked)} /></HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <InteractiveDrawingMap
              ref={mapRef}
              style={mapStyle}
              showLabels={showLabels}
              center={mapCenter}
              zoom={mapZoom}
              bounds={mapBounds}
              onGeometryComplete={handleGeometryComplete}
              drawingMode={drawingMode}
              geometry={geometry}
              drawingToolsRef={drawingToolsRef}
              communesData={communesGeoJSON}
              showCommunes={showCommunes}
              onDrawingStart={handleDrawingStart}
              onDrawingEnd={handleDrawingEnd}
              existingReserves={existingReserves}
            />
          </Box>
        )}
      </Box>

      {/* DRAWER */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>📍 Détails de l'Exploration</DrawerHeader>
          <DrawerBody>
            <VStack spacing={6} align="stretch">
              <DrawingToolsPanel 
                drawingMode={drawingMode} setDrawingMode={setDrawingMode} 
                isDrawing={isDrawing} setIsDrawing={setIsDrawing} 
                onClear={handleClearDrawing} geometry={geometry} 
                measurements={measurements} drawingToolsRef={drawingToolsRef} 
                onDrawingStart={handleDrawingStart} onDrawingEnd={handleDrawingEnd}
              />
              
              <Divider />

              {geometry && (
                <>
                  <ZoneInfoPanel geometry={geometry} measurements={measurements} zoneName={zoneName} setZoneName={setZoneName} />
                  <Divider />
                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm"><strong>Latitude :</strong> {measurements.centerLat?.toFixed(6)}°</Text>
                        <Text fontSize="sm"><strong>Longitude :</strong> {measurements.centerLng?.toFixed(6)}°</Text>
                        <Text fontSize="sm"><strong>Superficie :</strong> {measurements.areaHectares?.toFixed(2)} ha</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Button leftIcon={<FiDownload />} onClick={() => {
                    const geoJSON = { type: "Feature", properties: { date: new Date().toISOString(), ...measurements }, geometry };
                    const dataStr = JSON.stringify(geoJSON, null, 2);
                    const link = document.createElement('a');
                    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                    link.download = `exploration_${new Date().getTime()}.geojson`;
                    link.click();
                  }}>Exporter GeoJSON</Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ExplorationPage;