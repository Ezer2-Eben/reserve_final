// src/pages/VisitePage.jsx
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Flex,
  Avatar,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Center,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiSearch, 
  FiX, 
  FiLogOut,
  FiZoomIn,
  FiMapPin,
  FiMap,
  FiInfo,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

import InteractiveMap from '../components/ui/InteractiveMap';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { reserveService } from '../services/apiService';

const VisitePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [existingReserves, setExistingReserves] = useState([]);
  const [allReserves, setAllReserves] = useState([]);
  const [loadingReserves, setLoadingReserves] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedZoneId, setHighlightedZoneId] = useState(null);
  const [highlightedZoneName, setHighlightedZoneName] = useState('');
  const [zoomData, setZoomData] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapStats, setMapStats] = useState(null);
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get('highlight');
    
    if (highlightId) {
      setHighlightedZoneId(highlightId);
      
      const lat = params.get('lat');
      const lng = params.get('lng');
      const zoom = params.get('zoom');
      const minLat = params.get('minLat');
      const minLng = params.get('minLng');
      const maxLat = params.get('maxLat');
      const maxLng = params.get('maxLng');
      
      if (lat && lng && zoom) {
        setZoomData({
          center: [parseFloat(lng), parseFloat(lat)],
          zoom: parseInt(zoom),
          bounds: minLat && minLng && maxLat && maxLng ? [
            [parseFloat(minLng), parseFloat(minLat)],
            [parseFloat(maxLng), parseFloat(maxLat)]
          ] : null
        });
      }
    }
  }, [location.search]);

  useEffect(() => {
    const loadExistingReserves = async () => {
      try {
        setLoadingReserves(true);
        setError(null);
        const reserves = await reserveService.getAll();
        
        setAllReserves(reserves.filter(r => r.zone));
        
        const formattedReserves = reserves.map(reserve => {
          try {
            if (reserve.zone) {
              const zoneData = JSON.parse(reserve.zone);
              const isHighlighted = highlightedZoneId && reserve.id.toString() === highlightedZoneId;
              
              if (isHighlighted) {
                setHighlightedZoneName(reserve.nom);
              }
              
              return {
                id: reserve.id,
                properties: {
                  nom: reserve.nom,
                  type: reserve.type,
                  statut: reserve.statut,
                  superficie: reserve.superficie,
                  localisation: reserve.localisation,
                  isHighlighted: isHighlighted,
                },
                geometry: zoneData.geometry || zoneData,
                color: isHighlighted 
                  ? 'var(--chakra-colors-brand-500)'
                  : getColorByStatut(reserve.statut),
                borderColor: isHighlighted
                  ? 'var(--chakra-colors-brand-600)'
                  : getBorderColorByStatut(reserve.statut),
                borderWidth: isHighlighted ? 4 : 1,
                fillOpacity: isHighlighted ? 0.6 : 0.3,
              };
            }
            return null;
          } catch (error) {
            console.error(`Erreur parsing zone pour réserve ${reserve.id}:`, error);
            return null;
          }
        }).filter(r => r !== null);
        
        setExistingReserves(formattedReserves);
        
      } catch (error) {
        console.error('Erreur chargement réserves existantes:', error);
        setError('Impossible de charger les réserves. Vérifiez votre connexion.');
      } finally {
        setLoadingReserves(false);
      }
    };

    loadExistingReserves();
  }, [highlightedZoneId]);

  const getColorByStatut = (statut) => {
    const colorMap = {
      'EN_PROJET': 'rgba(255, 193, 7, 0.3)',
      'EN_COURS': 'rgba(33, 150, 243, 0.3)',
      'RESERVE': 'rgba(76, 175, 80, 0.3)',
      'PROTEGE': 'rgba(244, 67, 54, 0.3)',
    };
    return colorMap[statut] || 'rgba(158, 158, 158, 0.3)';
  };

  const getBorderColorByStatut = (statut) => {
    const colorMap = {
      'EN_PROJET': '#FFC107',
      'EN_COURS': '#2196F3',
      'RESERVE': '#4CAF50',
      'PROTEGE': '#F44336',
    };
    return colorMap[statut] || '#9E9E9E';
  };

  const filteredReserves = existingReserves.filter(reserve => {
    return searchQuery === '' || 
      reserve.properties.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reserve.properties.localisation.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const safeZoomTo = useCallback((center, zoom, bounds) => {
    if (!mapRef.current || !isMapReady) return false;

    try {
      if (bounds && mapRef.current.fitBounds) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 18, animate: true, duration: 1.5 });
        return true;
      } else if (center && mapRef.current.flyTo) {
        mapRef.current.flyTo({ center: center, zoom: zoom || 13, duration: 1000 });
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du zoom:', error);
      return false;
    }
    return false;
  }, [isMapReady]);

  const calculateZoomData = (reserve) => {
    if (!reserve || !reserve.zone) return null;
    try {
      const zoneData = JSON.parse(reserve.zone);
      if (zoneData.geometry?.coordinates) {
        const coordinates = zoneData.geometry.coordinates;
        if (zoneData.geometry.type === 'Polygon' && coordinates[0]) {
          const points = coordinates[0];
          let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
          
          points.forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          });
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          let zoomLevel = 12;
          if (latDiff > 0.5 || lngDiff > 0.5) zoomLevel = 10;
          if (latDiff > 1 || lngDiff > 1) zoomLevel = 9;
          if (latDiff < 0.1 && lngDiff < 0.1) zoomLevel = 15;
          if (latDiff < 0.05 && lngDiff < 0.05) zoomLevel = 17;
          
          return {
            center: [centerLng, centerLat],
            zoom: zoomLevel,
            bounds: [[minLng, minLat], [maxLng, maxLat]],
            name: reserve.nom
          };
        }
      }
    } catch (error) {
      console.error('Erreur calcul zoom:', error);
    }
    
    if (reserve.latitude && reserve.longitude) {
      return { center: [reserve.longitude, reserve.latitude], zoom: 13, bounds: null, name: reserve.nom };
    }
    return null;
  };

  const handleReserveSelect = (reserveId) => {
    if (!reserveId) {
      clearHighlight();
      return;
    }
    
    const reserve = allReserves.find(r => r.id.toString() === reserveId);
    if (!reserve) return;
    
    setHighlightedZoneId(reserveId);
    setHighlightedZoneName(reserve.nom);
    
    const zoomData = calculateZoomData(reserve);
    if (zoomData) {
      setZoomData(zoomData);
      const params = new URLSearchParams({
        highlight: reserveId,
        lat: zoomData.center[1].toFixed(6),
        lng: zoomData.center[0].toFixed(6),
        zoom: zoomData.zoom.toString()
      });
      if (zoomData.bounds) {
        params.append('minLat', zoomData.bounds[0][1].toFixed(6));
        params.append('minLng', zoomData.bounds[0][0].toFixed(6));
        params.append('maxLat', zoomData.bounds[1][1].toFixed(6));
        params.append('maxLng', zoomData.bounds[1][0].toFixed(6));
      }
      navigate(`/visite?${params.toString()}`, { replace: true });
      
      if (!isMapReady) return;
      
      const zoomSuccessful = safeZoomTo(zoomData.center, zoomData.zoom, zoomData.bounds);
      if (!zoomSuccessful) {
        setTimeout(() => safeZoomTo(zoomData.center, zoomData.zoom, zoomData.bounds), 500);
      }
    } else {
      setHighlightedZoneId(reserveId);
      setHighlightedZoneName(reserve.nom);
      navigate(`/visite?highlight=${reserveId}`, { replace: true });
    }
  };

  const focusOnHighlightedZone = useCallback(() => {
    if (highlightedZoneId && zoomData && isMapReady) {
      safeZoomTo(zoomData.center, zoomData.zoom, zoomData.bounds);
    }
  }, [highlightedZoneId, zoomData, isMapReady, safeZoomTo]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const clearHighlight = () => {
    setHighlightedZoneId(null);
    setHighlightedZoneName('');
    setZoomData(null);
    navigate('/visite', { replace: true });
  };

  const handleMapReady = (mapInstance) => {
    mapRef.current = mapInstance;
    setIsMapReady(true);
    if (zoomData && highlightedZoneId) {
      setTimeout(() => safeZoomTo(zoomData.center, zoomData.zoom, zoomData.bounds), 300);
    }
  };

  return (
    <Box h="100vh" bg="gray.100" overflow="hidden" position="relative">
      
      {/* GLASMORPHIC NAVBAR OVERLAY */}
      <Box 
        position="absolute" 
        top={4} 
        left={4} 
        right={4} 
        zIndex={100} 
        display="flex"
        className="glassmorphism"
        borderRadius="xl"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.1)"
        p={3}
      >
        <Flex justify="space-between" align="center" w="full">
          <HStack spacing={4}>
            <Logo size="32px" />
            <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
              <Text fontSize="md" fontWeight="bold" color="gray.800" lineHeight="1">
                Visite des Réserves
              </Text>
              <Text fontSize="10px" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                Exploration Togo
              </Text>
            </VStack>
            
            <HStack spacing={2} ml={4} display={{ base: 'none', lg: 'flex' }}>
              {mapStats ? (
                <>
                  <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs" display="flex" alignItems="center" gap={1}>
                    <FiMapPin size={10} /> {mapStats.communes} Communes
                  </Badge>
                  <Badge colorScheme="green" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs" display="flex" alignItems="center" gap={1}>
                    <FiMap size={10} /> {mapStats.regions} Régions
                  </Badge>
                  <Badge colorScheme="orange" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs" display="flex" alignItems="center" gap={1}>
                    <FiInfo size={10} /> {mapStats.prefectures} Préfectures
                  </Badge>
                </>
              ) : (
                <Spinner size="xs" color="brand.500" />
              )}
            </HStack>
          </HStack>

          <HStack spacing={4} flex="1" maxW="600px" mx={8}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                ref={searchInputRef}
                placeholder="Rechercher une réserve (ex: Forêt du Nord)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderRadius="full"
                border="1px solid"
                borderColor="gray.200"
                boxShadow="sm"
                _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 2px var(--chakra-colors-brand-200)', outline: 'none' }}
                _hover={{ borderColor: 'gray.300' }}
              />
              {searchQuery && (
                <InputRightElement>
                  <IconButton icon={<FiX />} size="sm" variant="ghost" onClick={clearSearch} borderRadius="full" />
                </InputRightElement>
              )}
            </InputGroup>
          </HStack>

          <HStack spacing={3}>
            {user?.role === 'ADMIN' && (
              <Button size="md" variant="outline" colorScheme="brand" borderRadius="full" onClick={() => navigate('/dashboard')}>
                Admin
              </Button>
            )}
            <Menu>
              <MenuButton as={IconButton} icon={<Avatar size="sm" bg="brand.500" name={user?.username} />} variant="ghost" borderRadius="full" />
              <MenuList border="none" shadow="lg" borderRadius="xl">
                <MenuItem px={4} py={2} _focus={{ bg: 'transparent' }} cursor="default">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{user?.username}</Text>
                    <Text fontSize="xs" color="gray.500" textTransform="capitalize">{user?.role?.toLowerCase()}</Text>
                  </VStack>
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500" fontWeight="medium">Déconnexion</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* LEFT PANEL OVERLAY */}
      <Box
        position="absolute"
        top="90px"
        left={4}
        bottom={4}
        w="350px"
        zIndex={90}
        display={{ base: 'none', lg: 'flex' }}
        flexDirection="column"
        bg="white"
        borderRadius="xl"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.1)"
        overflow="hidden"
      >
        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
          <Heading size="sm" color="gray.700" mb={2}>Réserves Naturelles</Heading>
          <Text fontSize="xs" color="gray.500">Explorez les zones protégées et réserves forestières de la région.</Text>
        </Box>
        
        <Box flex="1" overflowY="auto" p={2}>
          {loadingReserves ? (
            <Center h="100%"><Spinner color="brand.500" /></Center>
          ) : filteredReserves.length > 0 ? (
            <VStack spacing={2} align="stretch">
              {filteredReserves.map(reserve => (
                <Card 
                  key={reserve.id} 
                  variant="outline" 
                  borderColor={reserve.id.toString() === highlightedZoneId ? 'brand.500' : 'gray.100'}
                  bg={reserve.id.toString() === highlightedZoneId ? 'brand.50' : 'white'}
                  cursor="pointer"
                  onClick={() => handleReserveSelect(reserve.id.toString())}
                  _hover={{ borderColor: 'brand.400', shadow: 'sm', transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                >
                  <CardBody p={4}>
                    <Flex justify="space-between" align="flex-start" mb={2}>
                      <Text fontWeight="bold" color="gray.800" noOfLines={1} flex="1">
                        {reserve.properties.nom}
                      </Text>
                      {reserve.properties.statut && (
                        <Badge ml={2} colorScheme={reserve.properties.statut === 'RESERVE' ? 'green' : 'blue'} variant="subtle" fontSize="2xs">
                          {reserve.properties.statut}
                        </Badge>
                      )}
                    </Flex>
                    <HStack fontSize="xs" color="gray.500" spacing={4}>
                      <HStack spacing={1}><FiMapPin /><Text isTruncated>{reserve.properties.localisation}</Text></HStack>
                      {reserve.properties.superficie && (
                        <HStack spacing={1}><FiMap /><Text>{reserve.properties.superficie} ha</Text></HStack>
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          ) : (
            <Center h="100%" p={6}>
              <VStack textAlign="center" color="gray.400">
                <FiInfo size={32} />
                <Text fontSize="sm">Aucune réserve trouvée correspondant à votre recherche.</Text>
              </VStack>
            </Center>
          )}
        </Box>

        {/* STATISTIQUES PAR RÉGION (Bas du panneau détaché) */}
        {mapStats && mapStats.byRegion && (
          <Box p={4} borderTop="1px solid" borderColor="gray.100" bg="gray.50">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wider">
              Stats par Région
            </Text>
            <SimpleGrid columns={2} spacing={2}>
              {Object.entries(mapStats.byRegion).map(([region, count]) => (
                <Flex key={region} align="center" justify="space-between" bg="white" p={2} borderRadius="md" shadow="xs" border="1px" borderColor="gray.100">
                  <Text fontSize="xs" color="gray.600" fontWeight="medium" isTruncated>{region}</Text>
                  <Badge 
                    fontSize="2xs" 
                    bg="brand.500" 
                    color="white" 
                    borderRadius="full"
                    minW="20px"
                    textAlign="center"
                  >
                    {count}
                  </Badge>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* FLOAT OVERLAY - ACTIVE RESERVE (Mobile & Desktop interactions) */}
      {highlightedZoneId && highlightedZoneName && (
        <Box
          position="absolute"
          bottom={8}
          left="50%"
          transform="translateX(-50%)"
          zIndex={100}
          bg="white"
          borderRadius="full"
          boxShadow="0 8px 32px rgba(0,0,0,0.15)"
          p={2}
          pr={4}
          display="flex"
          alignItems="center"
          className="animate-slide-up"
        >
          <Flex align="center">
            <IconButton
              icon={<FiX />}
              size="sm"
              isRound
              variant="ghost"
              color="gray.400"
              onClick={clearHighlight}
              mr={2}
            />
            <Text fontSize="sm" fontWeight="bold" color="gray.800" mr={4}>
              {highlightedZoneName}
            </Text>
            <Button
              size="sm"
              colorScheme="brand"
              borderRadius="full"
              leftIcon={<FiZoomIn />}
              onClick={focusOnHighlightedZone}
            >
              Centrer
            </Button>
          </Flex>
        </Box>
      )}

      {/* MAP FULL SCREEN */}
      <Box h="100%" w="100%" position="absolute" top={0} left={0} zIndex={1}>
        {error ? (
          <Center h="100%" w="100%">
            <Alert status="error" maxW="md" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          </Center>
        ) : (
          <InteractiveMap
            ref={mapRef}
            existingZones={filteredReserves}
            readOnly={true}
            userRole={user?.role}
            showControls={true}
            initialView={zoomData?.center || [1.1659, 8.6195]} // Bénin
            initialZoom={zoomData?.zoom || 7}
            showLegend={false}
            highlightZoneId={highlightedZoneId}
            onMapReady={handleMapReady}
            fitBounds={zoomData?.bounds}
            showTopBar={false}
            showRegionStats={false}
            onStatsUpdate={setMapStats}
          />
        )}
      </Box>
    </Box>
  );
};

export default VisitePage;