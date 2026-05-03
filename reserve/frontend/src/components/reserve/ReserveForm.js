// src/components/reserve/ReserveForm.js - VERSION AVANCÉE
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  Textarea,
  useToast,
  VStack,
  Progress,
  Badge,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  InputGroup,
  InputRightElement,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Heading
} from '@chakra-ui/react';
import * as turf from '@turf/turf';
import { useEffect, useState } from 'react';
import { FiRefreshCw, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { reserveService } from '../../services/apiService';
import geocodingService from '../../services/geocodingService';

const ReserveForm = ({ zone, onSuccess, onCancel, reserves = [] }) => {
  const toast = useToast();

  // États du formulaire
  const [nom, setNom] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // États pour la détection automatique
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  
  // États pour les analyses spatiales
  const [spatialAnalysis, setSpatialAnalysis] = useState(null);
  const [nearbyReserves, setNearbyReserves] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  // Détection automatique lors du changement de zone
  useEffect(() => {
    if (zone) {
      performAdvancedAnalysis(zone);
    }
  }, [zone]);

  // Validation en temps réel
  useEffect(() => {
    validateFormProgress();
  }, [nom, localisation, superficie, type, statut, latitude, longitude, zone]);

  // ==================== ANALYSE SPATIALE AVANCÉE ====================
  const performAdvancedAnalysis = async (wktZone) => {
    setIsDetectingLocation(true);
    setIsAnalyzing(true);
    
    try {
      // 1. Calculer le centre de la zone
      const center = geocodingService.calculateZoneCenter(wktZone);
      
      if (center) {
        // 2. Géocodage inverse pour obtenir l'adresse
        const locationInfo = await geocodingService.reverseGeocode(center.lat, center.lng);
        setDetectedLocation(locationInfo);
        
        // Pré-remplir les champs
        if (locationInfo.fullLocation) {
          setLocalisation(locationInfo.fullLocation);
        }
        if (locationInfo.primaryLocation) {
          const suggestedName = geocodingService.generateReserveName(locationInfo);
          setNom(suggestedName);
        }
        if (center.lat && center.lng) {
          setLatitude(center.lat.toFixed(6));
          setLongitude(center.lng.toFixed(6));
        }

        // 3. Analyse spatiale avancée
        await performSpatialAnalysis(wktZone, center);
      }
    } catch (error) {
      console.warn('Erreur analyse spatiale:', error);
      toast({
        title: 'Information',
        description: 'Analyse spatiale limitée - continuez manuellement',
        status: 'info',
        duration: 3000
      });
    } finally {
      setIsDetectingLocation(false);
      setIsAnalyzing(false);
    }
  };

  const performSpatialAnalysis = async (wktZone, center) => {
    try {
      // Convertir WKT en GeoJSON
      const zoneGeoJSON = parseWKTToGeoJSON(wktZone);
      
      if (!zoneGeoJSON) return;

      // Calculer superficie et périmètre
      const area = turf.area(zoneGeoJSON) / 1000000; // km²
      const perimeter = turf.length(turf.lineString(zoneGeoJSON.geometry.coordinates[0]), { units: 'kilometers' });
      
      // Calculer la compacité (ratio périmètre/superficie)
      const compactness = (4 * Math.PI * (area * 1000000)) / Math.pow(perimeter * 1000, 2);
      
      setSuperficie(area.toFixed(2));
      
      setSpatialAnalysis({
        area: area,
        perimeter: perimeter,
        compactness: compactness,
        center: center
      });

      // Rechercher les réserves à proximité
      findNearbyReserves(center, zoneGeoJSON);
      
      // Détecter les conflits/chevauchements
      detectSpatialConflicts(zoneGeoJSON);

    } catch (error) {
      console.error('Erreur analyse spatiale:', error);
    }
  };

  const parseWKTToGeoJSON = (wkt) => {
    try {
      if (!wkt || typeof wkt !== 'string') return null;
      
      const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
      if (!match) return null;

      const coordString = match[1];
      const coordPairs = coordString.split(',');
      
      const coordinates = coordPairs.map(pair => {
        const [lng, lat] = pair.trim().split(' ').map(Number);
        return [lng, lat];
      });

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      };
    } catch (error) {
      console.error('Erreur parsing WKT:', error);
      return null;
    }
  };

  const findNearbyReserves = (center, currentZoneGeoJSON) => {
    if (!reserves || reserves.length === 0) return;

    const nearby = reserves
      .map(reserve => {
        if (!reserve.latitude || !reserve.longitude) return null;
        
        const point = turf.point([reserve.longitude, reserve.latitude]);
        const centerPoint = turf.point([center.lng, center.lat]);
        const distance = turf.distance(point, centerPoint, { units: 'kilometers' });
        
        return {
          ...reserve,
          distance: distance
        };
      })
      .filter(r => r && r.distance < 50) // Dans un rayon de 50km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Top 5

    setNearbyReserves(nearby);
  };

  const detectSpatialConflicts = (currentZoneGeoJSON) => {
    if (!reserves || reserves.length === 0) return;

    const detectedConflicts = [];

    reserves.forEach(reserve => {
      if (!reserve.zone) return;

      try {
        const reserveGeoJSON = parseWKTToGeoJSON(reserve.zone);
        if (!reserveGeoJSON) return;

        // Vérifier intersection
        const intersection = turf.intersect(
          turf.featureCollection([currentZoneGeoJSON, reserveGeoJSON])
        );

        if (intersection) {
          const intersectionArea = turf.area(intersection) / 1000000; // km²
          
          detectedConflicts.push({
            reserve: reserve,
            type: 'overlap',
            area: intersectionArea,
            severity: intersectionArea > 1 ? 'high' : 'medium'
          });
        }
      } catch (error) {
        console.warn('Erreur détection conflit:', reserve.nom, error);
      }
    });

    setConflicts(detectedConflicts);

    if (detectedConflicts.length > 0) {
      toast({
        title: '⚠️ Chevauchement détecté',
        description: `${detectedConflicts.length} conflit(s) spatial(aux) trouvé(s)`,
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // ==================== VALIDATION INTELLIGENTE ====================
  const validateFormProgress = () => {
    let progress = 0;
    const fields = [
      { value: nom, weight: 20 },
      { value: localisation, weight: 20 },
      { value: superficie, weight: 15 },
      { value: type, weight: 10 },
      { value: statut, weight: 10 },
      { value: latitude, weight: 10 },
      { value: longitude, weight: 10 },
      { value: zone, weight: 5 }
    ];

    fields.forEach(field => {
      if (field.value && field.value.toString().trim()) {
        progress += field.weight;
      }
    });

    setValidationProgress(progress);
  };

  const getValidationColor = () => {
    if (validationProgress < 40) return 'red';
    if (validationProgress < 70) return 'orange';
    if (validationProgress < 100) return 'yellow';
    return 'green';
  };

  // ==================== GESTION DU FORMULAIRE ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!zone) {
      toast({
        title: 'Zone manquante',
        description: 'Veuillez délimiter une zone sur la carte.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!nom.trim() || !localisation.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Le nom et la localisation sont obligatoires.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Avertissement si conflits détectés
    if (conflicts.length > 0) {
      const confirmed = window.confirm(
        `⚠️ Attention: ${conflicts.length} chevauchement(s) détecté(s) avec d'autres réserves.\n\n` +
        `Voulez-vous quand même enregistrer cette réserve ?`
      );
      
      if (!confirmed) return;
    }

    try {
      const payload = {
        nom: nom.trim(),
        localisation: localisation.trim(),
        superficie: superficie ? parseFloat(superficie) : null,
        type: type || null,
        statut: statut || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        zone: zone.trim()
      };

      await reserveService.create(payload);

      toast({
        title: '✅ Réserve créée avec succès',
        description: `La réserve "${nom}" a été enregistrée`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      // Réinitialiser
      resetForm();
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Erreur création réserve:', error);
      
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || error.message || "Impossible d'enregistrer la réserve",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setNom('');
    setLocalisation('');
    setSuperficie('');
    setType('');
    setStatut('');
    setLatitude('');
    setLongitude('');
    setDetectedLocation(null);
    setSpatialAnalysis(null);
    setNearbyReserves([]);
    setConflicts([]);
    setValidationProgress(0);
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) onCancel();
  };

  const regenerateName = () => {
    if (!detectedLocation) return;
    
    const newName = geocodingService.generateReserveName(detectedLocation, type);
    setNom(newName);
    
    toast({
      title: 'Nom régénéré',
      description: `Nouveau nom: ${newName}`,
      status: 'info',
      duration: 2000
    });
  };

  // ==================== RENDU ====================
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Barre de progression */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
              Progression du formulaire
            </Text>
            <Badge colorScheme={getValidationColor()} fontSize="sm">
              {validationProgress}%
            </Badge>
          </HStack>
          <Progress 
            value={validationProgress} 
            size="sm" 
            colorScheme={getValidationColor()}
            borderRadius="full"
          />
        </Box>

        {/* Alertes */}
        {!zone && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">
                Aucune zone définie
              </Text>
              <Text fontSize="xs">
                Utilisez les outils de dessin sur la carte pour délimiter votre réserve
              </Text>
            </VStack>
          </Alert>
        )}

        {zone && isDetectingLocation ? <Alert status="info" borderRadius="md">
            <Spinner size="sm" mr={3} />
            <Text fontSize="sm">
              Analyse spatiale en cours... Détection de la localisation et calcul des métriques
            </Text>
          </Alert> : null}

        {zone && detectedLocation && !isDetectingLocation ? <Alert status="success" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1} flex={1}>
              <Text fontSize="sm" fontWeight="semibold">
                📍 Localisation détectée automatiquement
              </Text>
              <Text fontSize="xs" color="gray.600">
                {detectedLocation.formattedAddress}
              </Text>
            </VStack>
          </Alert> : null}

        {/* Conflits spatiaux */}
        {conflicts.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1} flex={1}>
              <Text fontSize="sm" fontWeight="semibold">
                ⚠️ {conflicts.length} chevauchement{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''}
              </Text>
              {conflicts.slice(0, 2).map((conflict, idx) => (
                <Text key={idx} fontSize="xs" color="orange.700">
                  • {conflict.reserve.nom}: {conflict.area.toFixed(2)} km² de chevauchement
                </Text>
              ))}
            </VStack>
          </Alert>
        )}

        {/* Section 1: Informations de base */}
        <Card variant="outline">
          <CardHeader pb={2}>
            <Heading size="sm">📋 Informations de base</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Nom de la réserve
                  {detectedLocation ? <Badge ml={2} colorScheme="blue" fontSize="xs">Auto-généré</Badge> : null}
                </FormLabel>
                <InputGroup>
                  <Input 
                    value={nom} 
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Parc National de la Pendjari"
                    bg={detectedLocation ? "blue.50" : "white"}
                  />
                  {detectedLocation ? <InputRightElement>
                      <Tooltip label="Régénérer le nom">
                        <IconButton
                          icon={<FiRefreshCw />}
                          size="sm"
                          variant="ghost"
                          onClick={regenerateName}
                          aria-label="Régénérer"
                        />
                      </Tooltip>
                    </InputRightElement> : null}
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Localisation
                  {detectedLocation ? <Badge ml={2} colorScheme="blue" fontSize="xs">Auto-détectée</Badge> : null}
                </FormLabel>
                <Input 
                  value={localisation} 
                  onChange={(e) => setLocalisation(e.target.value)}
                  placeholder="Ex: Atacora, Bénin"
                  bg={detectedLocation ? "blue.50" : "white"}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Type de réserve</FormLabel>
                  <Select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Sélectionner"
                  >
                    <option value="Parc National">Parc National</option>
                    <option value="Réserve Naturelle">Réserve Naturelle</option>
                    <option value="Forêt Classée">Forêt Classée</option>
                    <option value="Zone de Protection">Zone de Protection</option>
                    <option value="Réserve de Biosphère">Réserve de Biosphère</option>
                    <option value="Sanctuaire">Sanctuaire</option>
                    <option value="Aire Marine Protégée">Aire Marine Protégée</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Statut</FormLabel>
                  <Select 
                    value={statut} 
                    onChange={(e) => setStatut(e.target.value)}
                    placeholder="Sélectionner"
                  >
                    <option value="Active">Active</option>
                    <option value="Protégée">Protégée</option>
                    <option value="En cours de création">En cours de création</option>
                    <option value="Proposée">Proposée</option>
                    <option value="En maintenance">En maintenance</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Section 2: Métriques spatiales */}
        {spatialAnalysis ? <Card variant="outline" bg="green.50">
            <CardHeader pb={2}>
              <Heading size="sm">📊 Analyse spatiale</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={3} spacing={4}>
                <Stat>
                  <StatLabel fontSize="xs">Superficie</StatLabel>
                  <StatNumber fontSize="md">{spatialAnalysis.area.toFixed(2)} km²</StatNumber>
                  <StatHelpText fontSize="xs">
                    {(spatialAnalysis.area * 100).toFixed(0)} hectares
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Périmètre</StatLabel>
                  <StatNumber fontSize="md">{spatialAnalysis.perimeter.toFixed(2)} km</StatNumber>
                  <StatHelpText fontSize="xs">
                    {(spatialAnalysis.perimeter * 1000).toFixed(0)} mètres
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Compacité</StatLabel>
                  <StatNumber fontSize="md">{(spatialAnalysis.compactness * 100).toFixed(1)}%</StatNumber>
                  <StatHelpText fontSize="xs">
                    {spatialAnalysis.compactness > 0.7 ? '✅ Compacte' : '⚠️ Allongée'}
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card> : null}

        {/* Section 3: Coordonnées */}
        <Card variant="outline">
          <CardHeader pb={2}>
            <Heading size="sm">🌍 Coordonnées géographiques</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={3} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Latitude</FormLabel>
                <Input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ex: 10.5"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Longitude</FormLabel>
                <Input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ex: 1.2"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">
                  Superficie (km²)
                  {spatialAnalysis ? <Badge ml={2} colorScheme="green" fontSize="xs">Auto</Badge> : null}
                </FormLabel>
                <Input
                  type="number"
                  value={superficie}
                  onChange={(e) => setSuperficie(e.target.value)}
                  placeholder="Auto-calculée"
                  step="0.01"
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Réserves à proximité */}
        {nearbyReserves.length > 0 && (
          <Card variant="outline" bg="blue.50">
            <CardHeader pb={2}>
              <Heading size="sm">📍 Réserves à proximité</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {nearbyReserves.map((reserve, idx) => (
                  <HStack key={idx} justify="space-between" p={2} bg="white" borderRadius="md">
                    <Text fontSize="sm">{reserve.nom}</Text>
                    <Badge colorScheme="blue" fontSize="xs">
                      {reserve.distance.toFixed(1)} km
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Zone WKT */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold">
            Zone géographique (WKT)
            <Tooltip label="Well-Known Text - Format standard pour les géométries">
              <span style={{ marginLeft: '8px', cursor: 'help' }}>
                <FiInfo style={{ display: 'inline', fontSize: '14px' }} />
              </span>
            </Tooltip>
          </FormLabel>
          <Textarea 
            value={zone} 
            isReadOnly 
            rows={3} 
            bg="gray.50"
            fontSize="xs"
            fontFamily="mono"
            placeholder="La zone sera générée automatiquement après le dessin sur la carte"
          />
        </FormControl>

        {/* Boutons d'action */}
        <Divider />
        
        <HStack spacing={3} justify="flex-end">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            colorScheme="green" 
            isDisabled={!zone || validationProgress < 60}
            leftIcon={<FiCheckCircle />}
          >
            Enregistrer la réserve
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ReserveForm;