// src/pages/dashboard/reserves.jsx
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Collapse,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Progress,
    Select,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Textarea,
    Th,
    Thead,
    Tooltip,
    Tr,
    useDisclosure,
    useToast,
    VStack,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import {
    FiEye,
    FiMap,
    FiSearch,
    FiFilter,
    FiDownload,
    FiPlus,
    FiUpload,
    FiFile,
    FiLink,
    FiX,
    FiTrash2,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import InteractiveMap from '../../components/ui/InteractiveMap';
import { reserveService, litigeService, occupationService, documentService, alerteService, projetService } from '../../services/apiService';
import geocodingService from '../../services/geocodingService';

// ==================== UTM CONVERSION ====================
/**
 * Converts Latitude/Longitude to UTM coordinates (Zone 31N for Togo region).
 * Returns {zone, easting, northing} or null if invalid input.
 */
const latLonToUTM = (lat, lon) => {
  if (lat === '' || lon === '' || lat === null || lon === null) return null;
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) return null;

  const a = 6378137.0; // WGS84 semi-major axis
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const e = Math.sqrt(e2);
  const k0 = 0.9996;

  const latRad = (latNum * Math.PI) / 180;
  const lonRad = (lonNum * Math.PI) / 180;

  // Auto-detect zone or force zone 31 for Togo
  const zoneNumber = Math.floor((lonNum + 180) / 6) + 1;
  const zoneLon = ((zoneNumber - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (lonRad - zoneLon);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * latRad) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * latRad));

  const easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * (e2 / (1 - e2))) * A ** 5) / 120) +
    500000;

  let northing =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * (e2 / (1 - e2))) * A ** 6) / 720));

  if (latNum < 0) northing += 10000000;

  const hemisphere = latNum >= 0 ? 'N' : 'S';
  return {
    zone: `${zoneNumber}${hemisphere}`,
    easting: Math.round(easting),
    northing: Math.round(northing),
  };
};

// ==================== COMPOSANT FORMULAIRE ====================
const ReserveForm = ({ isOpen, onClose, reserve = null, onSuccess, isReadOnly = false }) => {
  const [formData, setFormData] = useState({
    nom: '',
    localisation: '',
    superficie: '',
    type: 'ORDINAIRE',
    codeReserve: '',
    situationGeographique: '',
    latitude: '',
    longitude: '',
    statut: 'ACTIF',
    affectation: '',
    zone: '',
  });
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reserves, setReserves] = useState([]);
  const [spatialStats, setSpatialStats] = useState(null);

  const toast = useToast();

  const [litiges, setLitiges] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loadingLinked, setLoadingLinked] = useState(false);

  // États pour l'ajout de document inline
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docUploadType, setDocUploadType] = useState('local');
  const [docFile, setDocFile] = useState(null);
  const [docExternalUrl, setDocExternalUrl] = useState('');
  const [docNom, setDocNom] = useState('');
  const [docCategorie, setDocCategorie] = useState('ADMINISTRATIF');
  const [docDescription, setDocDescription] = useState('');
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [docUploading, setDocUploading] = useState(false);

  useEffect(() => {
    if (reserve && isOpen) {
      setLitiges([]);
      setOccupations([]);
      setDocuments([]);
      setAlertes([]);
      setProjets([]);

      const fetchOne = async (fn, setter, label) => {
        try {
          const data = await fn(reserve.id);
          setter(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(`Erreur chargement ${label}:`, err?.message || err);
          setter([]);
        }
      };

      const loadAll = async () => {
        setLoadingLinked(true);
        try {
          await Promise.all([
            fetchOne(async (id) => {
              const all = await litigeService.getAll();
              return all.filter(item => item.reserve && item.reserve.id === id);
            }, setLitiges, 'litiges'),
            fetchOne(async (id) => {
              const all = await occupationService.getAll();
              return all.filter(item => item.reserve && item.reserve.id === id);
            }, setOccupations, 'occupations'),
            fetchOne(async (id) => {
              const allDocs = await documentService.getAll();
              return allDocs.filter(d => d.reserve && d.reserve.id === id);
            }, setDocuments, 'documents'),
            fetchOne(async (id) => {
              const all = await alerteService.getAll();
              return all.filter(item => item.reserve && item.reserve.id === id);
            }, setAlertes, 'alertes'),
            fetchOne(async (id) => {
              const all = await projetService.getAll();
              return all.filter(item => item.reserve && item.reserve.id === id);
            }, setProjets, 'projets'),
          ]);
        } finally {
          setLoadingLinked(false);
        }
      };

      loadAll();
    }
    // Reset doc form when modal opens/closes
    setShowAddDoc(false);
    setDocFile(null);
    setDocExternalUrl('');
    setDocNom('');
    setDocCategorie('ADMINISTRATIF');
    setDocDescription('');
  }, [reserve, isOpen]);

  const refreshDocuments = async () => {
    if (!reserve) return;
    try {
      const data = await documentService.getByReserve(reserve.id);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur rechargement documents:', err);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (docUploadType === 'local' && !docFile) {
      toast({ title: 'Veuillez sélectionner un fichier', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    if (docUploadType === 'external' && !docExternalUrl) {
      toast({ title: 'Veuillez saisir une URL', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setDocUploading(true);
    setDocUploadProgress(0);
    try {
      if (docUploadType === 'local') {
        const formData = new FormData();
        formData.append('file', docFile);
        formData.append('reserveId', reserve.id);
        formData.append('nomFichier', docNom || docFile.name.replace(/\.[^/.]+$/, ''));
        formData.append('categorie', docCategorie);
        formData.append('description', docDescription);
        const interval = setInterval(() => {
          setDocUploadProgress(prev => { if (prev >= 85) { clearInterval(interval); return 85; } return prev + 10; });
        }, 200);
        await documentService.uploadFile(formData);
        clearInterval(interval);
        setDocUploadProgress(100);
      } else {
        await documentService.createExternalDocument({
          nomFichier: docNom || 'Document externe',
          url: docExternalUrl,
          reserveId: reserve.id,
          categorie: docCategorie,
          description: docDescription,
          typeFichier: 'AUTRE',
        });
      }
      toast({ title: '✅ Document ajouté avec succès', status: 'success', duration: 3000, isClosable: true });
      setShowAddDoc(false);
      setDocFile(null);
      setDocExternalUrl('');
      setDocNom('');
      setDocDescription('');
      setDocUploadProgress(0);
      await refreshDocuments();
    } catch (err) {
      toast({ title: 'Erreur lors de l\'ajout', description: err?.response?.data?.error || err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await documentService.delete(docId);
      toast({ title: 'Document supprimé', status: 'info', duration: 2000, isClosable: true });
      await refreshDocuments();
    } catch (err) {
      toast({ title: 'Erreur suppression', status: 'error', duration: 3000, isClosable: true });
    }
  };

  useEffect(() => {
    if (reserve) {
      setFormData({
        nom: reserve.nom || '',
        localisation: reserve.localisation || '',
        superficie: reserve.superficie || '',
        type: reserve.type || 'ORDINAIRE',
        codeReserve: reserve.codeReserve || '',
        situationGeographique: reserve.situationGeographique || '',
        latitude: reserve.latitude || '',
        longitude: reserve.longitude || '',
        statut: reserve.statut || 'ACTIF',
        affectation: reserve.affectation || '',
        zone: reserve.zone || '',
      });
      if (reserve.zone) {
        calculateSpatialStats(reserve.zone);
      }
    } else {
      setFormData({
        nom: '',
        localisation: '',
        superficie: '',
        type: 'ORDINAIRE',
        codeReserve: '',
        situationGeographique: '',
        latitude: '',
        longitude: '',
        statut: 'ACTIF',
        affectation: '',
        zone: '',
      });
    }
  }, [reserve, isOpen]);

  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const [data, allDocs] = await Promise.all([
          reserveService.getAll(),
          documentService.getAll()
        ]);
        const reservesWithDocs = data.map(r => ({
          ...r,
          documents: allDocs.filter(d => d.reserve && d.reserve.id === r.id)
        }));
        setReserves(reservesWithDocs);
      } catch (error) {
        console.error('Erreur chargement réserves:', error);
      }
    };
    fetchReserves();
  }, []);

  const calculateSpatialStats = (wkt) => {
    try {
      const area = geocodingService.calculateArea(wkt);
      const perimeter = geocodingService.calculatePerimeter(wkt);
      const bounds = geocodingService.calculateBounds(wkt);
      
      setSpatialStats({
        area,
        perimeter,
        bounds
      });
    } catch (error) {
      console.error('Erreur calcul stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        superficie: formData.superficie ? parseFloat(formData.superficie) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (reserve) {
        await reserveService.update(reserve.id, submitData);
        toast({
          title: '✅ Réserve mise à jour',
          description: 'La réserve a été mise à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await reserveService.create(submitData);
        toast({
          title: '✅ Réserve créée',
          description: 'La réserve a été créée avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data || 'Une erreur est survenue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleZoneSelect = useCallback((zoneData) => {
    setFormData(prev => ({
      ...prev,
      zone: zoneData,
    }));
    
    if (zoneData) {
      try {
        const parsedZone = JSON.parse(zoneData);
        if (parsedZone.geometry) {
          const wkt = geocodingService.convertGeoJSONToWKT(parsedZone);
          if (wkt) {
            calculateSpatialStats(wkt);
          }
        }
      } catch (e) {
        calculateSpatialStats(zoneData);
      }
    }
  }, []);

  const parseZoneData = (zoneString) => {
    if (!zoneString) return null;
    
    try {
      const parsed = JSON.parse(zoneString);
      return {
        id: parsed.properties?.id || reserve?.id,
        name: parsed.properties?.name || reserve?.nom,
        properties: parsed.properties || { name: reserve?.nom || 'Zone' },
        geometry: parsed.geometry
      };
    } catch (error) {
      if (typeof zoneString === 'string' && zoneString.startsWith('POLYGON')) {
        try {
          const geojson = geocodingService.convertWKTToGeoJSON(zoneString);
          return {
            id: reserve?.id,
            name: reserve?.nom || 'Zone WKT',
            properties: { name: reserve?.nom || 'Zone WKT' },
            geometry: geojson?.geometry || {
              type: 'Polygon',
              coordinates: [[]]
            }
          };
        } catch (wktError) {
          console.error('Erreur conversion WKT:', wktError);
          return null;
        }
      }
      return null;
    }
  };
  
  const getExistingZones = () => {
    return reserves
      .filter(r => r.zone && r.id !== reserve?.id)
      .map(r => parseZoneData(r.zone))
      .filter(r => r && r.geometry);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent maxW="90vw" maxH="90vh" overflowY="auto">
        <ModalHeader>
          {isReadOnly 
            ? `📋 Détails de la réserve: ${reserve?.nom}` 
            : reserve 
              ? '✏️ Modifier la réserve' 
              : '➕ Créer une nouvelle réserve'
          }
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab>📝 Informations</Tab>
                <Tab>🗺️ Cartographie</Tab>
                {spatialStats ? <Tab>📊 Analyses</Tab> : null}
                {isReadOnly ? <Tab>⚖️ Litiges ({litiges.length})</Tab> : null}
                {isReadOnly ? <Tab>📂 Documents ({documents.length})</Tab> : null}
                {isReadOnly ? <Tab>🏠 Occupations ({occupations.length})</Tab> : null}
                {isReadOnly ? <Tab>🚨 Alertes ({alertes.length})</Tab> : null}
                {isReadOnly ? <Tab>🏗️ Projets ({projets.length})</Tab> : null}
              </TabList>

              <TabPanels>
                {/* Onglet Informations */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Nom de la réserve</FormLabel>
                      <Input
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Nom de la réserve"
                        isReadOnly={isReadOnly}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Localisation</FormLabel>
                      <Input
                        name="localisation"
                        value={formData.localisation}
                        onChange={handleChange}
                        placeholder="Localisation de la réserve"
                        isReadOnly={isReadOnly}
                      />
                    </FormControl>

                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Superficie (m²)</FormLabel>
                        <NumberInput
                          value={formData.superficie}
                          onChange={(value) => handleNumberChange('superficie', value)}
                          min={0}
                          precision={2}
                          isReadOnly={isReadOnly}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Type de réserve</FormLabel>
                        <Select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          isDisabled={isReadOnly}
                        >
                          <option value="ORDINAIRE">Réserve Administrative Ordinaire</option>
                          <option value="SPECIALE">Réserve Administrative Spéciale</option>
                          <option value="NATUREL">Naturelle</option>
                          <option value="PROTEGE">Protégée</option>
                          <option value="COMMUNAUTAIRE">Communautaire</option>
                        </Select>
                        {formData.type ? <Badge mt={1} colorScheme={formData.type === 'SPECIALE' ? 'orange' : 'blue'}>
                            {formData.type === 'SPECIALE' ? '📋 Spéciale — Places publiques / Marchés' : '📌 Ordinaire — Attribution standard'}
                          </Badge> : null}
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl>
                        <FormLabel>Latitude</FormLabel>
                        <NumberInput
                          value={formData.latitude}
                          onChange={(value) => handleNumberChange('latitude', value)}
                          precision={6}
                          isReadOnly={isReadOnly}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Longitude</FormLabel>
                        <NumberInput
                          value={formData.longitude}
                          onChange={(value) => handleNumberChange('longitude', value)}
                          precision={6}
                          isReadOnly={isReadOnly}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </HStack>

                    {/* Affichage UTM calculé */}
                    {(() => {
                      const utm = latLonToUTM(formData.latitude, formData.longitude);
                      if (!utm) return null;
                      return (
                        <Box
                          w="full"
                          p={3}
                          bg="blue.50"
                          border="1px solid"
                          borderColor="blue.200"
                          borderRadius="md"
                          fontSize="sm"
                        >
                          <Text fontWeight="semibold" color="blue.700" mb={1}>
                            🗺️ Coordonnées UTM (WGS84)
                          </Text>
                          <HStack spacing={6} flexWrap="wrap">
                            <Text color="blue.600">
                              <strong>Zone :</strong> {utm.zone}
                            </Text>
                            <Text color="blue.600">
                              <strong>Est (E) :</strong> {utm.easting.toLocaleString()} m
                            </Text>
                            <Text color="blue.600">
                              <strong>Nord (N) :</strong> {utm.northing.toLocaleString()} m
                            </Text>
                          </HStack>
                        </Box>
                      );
                    })()}

                    <HStack spacing={4} w="full">
                      <FormControl>
                        <FormLabel>Code Réserve</FormLabel>
                        <Input
                          name="codeReserve"
                          value={formData.codeReserve}
                          onChange={handleChange}
                          placeholder="Ex: RES-2024-001"
                          isReadOnly={isReadOnly}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Situation Géographique</FormLabel>
                        <Input
                          name="situationGeographique"
                          value={formData.situationGeographique}
                          onChange={handleChange}
                          placeholder="Préfecture, Commune, Région"
                          isReadOnly={isReadOnly}
                        />
                      </FormControl>
                    </HStack>

                    <FormControl>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        name="statut"
                        value={formData.statut}
                        onChange={handleChange}
                        isDisabled={isReadOnly}
                      >
                        <option value="ACTIF">Actif</option>
                        <option value="INACTIF">Inactif</option>
                        <option value="EN_MAINTENANCE">En maintenance</option>
                        <option value="EN_PROJET">En projet</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Usage Prévu / Affectation</FormLabel>
                      <Input
                        name="affectation"
                        value={formData.affectation}
                        onChange={handleChange}
                        placeholder="Ex: Éducation, Santé, Agriculture..."
                        isReadOnly={isReadOnly}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Onglet Cartographie */}
                <TabPanel>
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="full">
                      <Heading size="sm">Délimitation de la zone</Heading>
                      {!isReadOnly && (
                        <Button
                          size="sm"
                          leftIcon={showMap ? <FiEye /> : <FiMap />}
                          onClick={() => setShowMap(!showMap)}
                          colorScheme="blue"
                          variant="outline"
                        >
                          {showMap ? 'Masquer la carte' : 'Afficher la carte'}
                        </Button>
                      )}
                    </HStack>
                    
                    {showMap ? (
                      <Box w="full" h="500px" border="1px" borderColor="gray.200" borderRadius="md">
                        <InteractiveMap 
                          onZoneSelect={!isReadOnly ? handleZoneSelect : undefined}
                          readOnly={isReadOnly}
                          existingZones={getExistingZones()}
                        />
                      </Box>
                    ) : null}

                    <FormControl>
                      <FormLabel>Zone (JSON/WKT)</FormLabel>
                      <Textarea
                        name="zone"
                        value={formData.zone}
                        onChange={handleChange}
                        rows={4}
                        isReadOnly={isReadOnly}
                        fontFamily="mono"
                        fontSize="xs"
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Onglet Analyses */}
                {spatialStats ? <TabPanel>
                    <VStack spacing={4}>
                      <Heading size="sm">📊 Analyses Spatiales</Heading>
                      
                      <SimpleGrid columns={2} spacing={4} w="full">
                        {spatialStats.area ? <Card>
                            <CardBody>
                              <Stat>
                                <StatLabel>Superficie</StatLabel>
                                <StatNumber>{spatialStats.area.squareKilometers.toFixed(2)} km²</StatNumber>
                                <StatHelpText>{spatialStats.area.hectares.toFixed(2)} hectares</StatHelpText>
                              </Stat>
                            </CardBody>
                          </Card> : null}
                        
                        {spatialStats.perimeter ? <Card>
                            <CardBody>
                              <Stat>
                                <StatLabel>Périmètre</StatLabel>
                                <StatNumber>{spatialStats.perimeter.kilometers.toFixed(2)} km</StatNumber>
                                <StatHelpText>{spatialStats.perimeter.meters.toFixed(0)} mètres</StatHelpText>
                              </Stat>
                            </CardBody>
                          </Card> : null}
                      </SimpleGrid>

                      {spatialStats.bounds ? <Card w="full">
                          <CardBody>
                            <Heading size="xs" mb={3}>🧭 Limites géographiques</Heading>
                            <SimpleGrid columns={2} spacing={2} fontSize="sm">
                              <Text><strong>Nord:</strong> {spatialStats.bounds.maxLat.toFixed(6)}°</Text>
                              <Text><strong>Sud:</strong> {spatialStats.bounds.minLat.toFixed(6)}°</Text>
                              <Text><strong>Est:</strong> {spatialStats.bounds.maxLng.toFixed(6)}°</Text>
                              <Text><strong>Ouest:</strong> {spatialStats.bounds.minLng.toFixed(6)}°</Text>
                            </SimpleGrid>
                          </CardBody>
                        </Card> : null}
                    </VStack>
                  </TabPanel> : null}

                {isReadOnly ? <TabPanel>
                    {loadingLinked ? (
                      <Flex justify="center" align="center" p={8}>
                        <Spinner size="lg" color="brand.500" />
                      </Flex>
                    ) : litiges.length === 0 ? (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        Aucun litige associé à cette réserve.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Titre</Th>
                              <Th>Type</Th>
                              <Th>Statut</Th>
                              <Th>Parties impliquées</Th>
                              <Th>Date d'ouverture</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {litiges.map((l) => (
                              <Tr key={l.id}>
                                <Td fontWeight="medium">{l.titre}</Td>
                                <Td>{l.type}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      l.statut === 'RESOLU'
                                        ? 'green'
                                        : l.statut === 'EN_COURS'
                                        ? 'yellow'
                                        : 'red'
                                    }
                                  >
                                    {l.statut}
                                  </Badge>
                                </Td>
                                <Td>{l.partiesImpliquees}</Td>
                                <Td>{l.dateOuverture}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel> : null}

                {isReadOnly ? <TabPanel>
                    <VStack spacing={4} align="stretch">
                      {/* Barre d'outils documents */}
                      <HStack justify="space-between">
                        <Heading size="sm" color="gray.700">📂 Documents ({documents.length})</Heading>
                        <Button
                          size="sm"
                          leftIcon={showAddDoc ? <Icon as={FiX} /> : <Icon as={FiPlus} />}
                          colorScheme={showAddDoc ? 'red' : 'teal'}
                          variant={showAddDoc ? 'ghost' : 'solid'}
                          onClick={() => { setShowAddDoc(!showAddDoc); setDocUploadProgress(0); }}
                        >
                          {showAddDoc ? 'Annuler' : 'Ajouter un document'}
                        </Button>
                      </HStack>

                      {/* Formulaire d'ajout inline */}
                      <Collapse in={showAddDoc} animateOpacity>
                        <Box
                          as="form"
                          onSubmit={handleDocUpload}
                          p={4}
                          bg="teal.50"
                          border="1px solid"
                          borderColor="teal.200"
                          borderRadius="lg"
                        >
                          <VStack spacing={3} align="stretch">
                            <Heading size="xs" color="teal.700">➕ Nouveau document</Heading>
                            <Divider borderColor="teal.200" />

                            {/* Type upload */}
                            <HStack spacing={3}>
                              <Button
                                size="sm"
                                leftIcon={<Icon as={FiFile} />}
                                colorScheme={docUploadType === 'local' ? 'teal' : 'gray'}
                                variant={docUploadType === 'local' ? 'solid' : 'outline'}
                                onClick={() => setDocUploadType('local')}
                                type="button"
                              >
                                Fichier local
                              </Button>
                              <Button
                                size="sm"
                                leftIcon={<Icon as={FiLink} />}
                                colorScheme={docUploadType === 'external' ? 'teal' : 'gray'}
                                variant={docUploadType === 'external' ? 'solid' : 'outline'}
                                onClick={() => setDocUploadType('external')}
                                type="button"
                              >
                                URL externe
                              </Button>
                            </HStack>

                            <SimpleGrid columns={2} spacing={3}>
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">Nom (optionnel)</FormLabel>
                                <Input
                                  size="sm"
                                  value={docNom}
                                  onChange={e => setDocNom(e.target.value)}
                                  placeholder={docUploadType === 'local' ? 'Nom du document...' : 'Titre du document...'}
                                  bg="white"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">Catégorie</FormLabel>
                                <Select
                                  size="sm"
                                  value={docCategorie}
                                  onChange={e => setDocCategorie(e.target.value)}
                                  bg="white"
                                >
                                  <option value="ADMINISTRATIF">📄 Administratif</option>
                                  <option value="JURIDIQUE">⚖️ Juridique</option>
                                  <option value="TECHNIQUE">🔧 Technique</option>
                                  <option value="CARTOGRAPHIQUE">🗺️ Cartographique</option>
                                  <option value="FINANCIER">💰 Financier</option>
                                  <option value="LITIGE">⚠️ Litige</option>
                                  <option value="OCCUPATION">🏠 Occupation</option>
                                  <option value="AUTRE">📁 Autre</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            {/* Fichier local */}
                            {docUploadType === 'local' && (
                              <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">Fichier</FormLabel>
                                <Input
                                  size="sm"
                                  type="file"
                                  onChange={e => setDocFile(e.target.files[0])}
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                  bg="white"
                                />
                                {docFile && (
                                  <Text fontSize="xs" color="teal.600" mt={1}>
                                    📎 {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(2)} MB)
                                  </Text>
                                )}
                              </FormControl>
                            )}

                            {/* URL externe */}
                            {docUploadType === 'external' && (
                              <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">URL du document</FormLabel>
                                <Input
                                  size="sm"
                                  type="url"
                                  value={docExternalUrl}
                                  onChange={e => setDocExternalUrl(e.target.value)}
                                  placeholder="https://example.com/document.pdf"
                                  bg="white"
                                />
                              </FormControl>
                            )}

                            <FormControl>
                              <FormLabel fontSize="xs" fontWeight="bold" color="teal.700">Description (optionnel)</FormLabel>
                              <Textarea
                                size="sm"
                                value={docDescription}
                                onChange={e => setDocDescription(e.target.value)}
                                placeholder="Description du document..."
                                rows={2}
                                bg="white"
                              />
                            </FormControl>

                            {/* Barre de progression */}
                            {docUploadProgress > 0 && (
                              <Box>
                                <Text fontSize="xs" color="teal.700" mb={1}>Upload : {docUploadProgress}%</Text>
                                <Progress value={docUploadProgress} colorScheme="teal" size="xs" borderRadius="full" />
                              </Box>
                            )}

                            <HStack justify="flex-end">
                              <Button
                                size="sm"
                                type="submit"
                                colorScheme="teal"
                                leftIcon={<Icon as={FiUpload} />}
                                isLoading={docUploading}
                                loadingText="Envoi..."
                              >
                                Enregistrer le document
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      </Collapse>

                      {/* Liste des documents */}
                      {loadingLinked ? (
                        <Flex justify="center" align="center" p={8}>
                          <Spinner size="lg" color="teal.500" />
                        </Flex>
                      ) : documents.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          Aucun document associé à cette réserve. Cliquez sur &quot;Ajouter un document&quot; pour commencer.
                        </Alert>
                      ) : (
                        <Box overflowX="auto">
                          <Table variant="simple" size="sm">
                            <Thead bg="gray.50">
                              <Tr>
                                <Th>Nom</Th>
                                <Th>Catégorie</Th>
                                <Th>Type</Th>
                                <Th>Taille</Th>
                                <Th>Date d'ajout</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {documents.map((doc) => (
                                <Tr key={doc.id} _hover={{ bg: 'gray.50' }}>
                                  <Td fontWeight="medium">{doc.nomFichierOriginal || doc.nomFichier}</Td>
                                  <Td>
                                    <Badge colorScheme="purple">{doc.categorie || 'Non classé'}</Badge>
                                  </Td>
                                  <Td fontSize="xs" color="gray.500">{doc.typeFichier}</Td>
                                  <Td fontSize="xs">{doc.tailleFichier ? `${(doc.tailleFichier / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</Td>
                                  <Td fontSize="xs">{doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : 'N/A'}</Td>
                                  <Td>
                                    <HStack spacing={1}>
                                      <Tooltip label="Télécharger">
                                        <IconButton
                                          size="xs"
                                          icon={<FiDownload />}
                                          colorScheme="blue"
                                          variant="ghost"
                                          aria-label="Télécharger"
                                          onClick={() => {
                                            window.open(`${process.env.REACT_APP_API_URL || 'https://reserve-final.onrender.com/api'}/documents/${doc.id}/download`, '_blank');
                                          }}
                                        />
                                      </Tooltip>
                                      <Tooltip label="Supprimer">
                                        <IconButton
                                          size="xs"
                                          icon={<FiTrash2 />}
                                          colorScheme="red"
                                          variant="ghost"
                                          aria-label="Supprimer"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                        />
                                      </Tooltip>
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel> : null}

                {isReadOnly ? <TabPanel>
                    {loadingLinked ? (
                      <Flex justify="center" align="center" p={8}>
                        <Spinner size="lg" color="brand.500" />
                      </Flex>
                    ) : occupations.length === 0 ? (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        Aucune occupation enregistrée sur cette réserve.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Occupant</Th>
                              <Th>Type d'occupation</Th>
                              <Th>Statut</Th>
                              <Th>Superficie (m²)</Th>
                              <Th>Date Début</Th>
                              <Th>Date Fin</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {occupations.map((occ) => (
                              <Tr key={occ.id}>
                                <Td fontWeight="medium">{occ.occupant || 'Inconnu'}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      occ.typeOccupation === 'LEGALE'
                                        ? 'green'
                                        : occ.typeOccupation === 'TOLEREE'
                                        ? 'orange'
                                        : 'red'
                                    }
                                  >
                                    {occ.typeOccupation}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={occ.statut === 'ACTIF' ? 'blue' : 'gray'}
                                  >
                                    {occ.statut}
                                  </Badge>
                                </Td>
                                <Td>{occ.superficie ? `${occ.superficie} m²` : 'N/A'}</Td>
                                <Td>{occ.dateDebut || 'N/A'}</Td>
                                <Td>{occ.dateFin || 'N/A'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel> : null}

                {isReadOnly ? <TabPanel>
                    {loadingLinked ? (
                      <Flex justify="center" align="center" p={8}>
                        <Spinner size="lg" color="brand.500" />
                      </Flex>
                    ) : alertes.length === 0 ? (
                      <Alert status="success" borderRadius="md">
                        <AlertIcon />
                        Aucune alerte active pour cette réserve.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Type</Th>
                              <Th>Description</Th>
                              <Th>Niveau</Th>
                              <Th>Statut</Th>
                              <Th>Date Limite</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {alertes.map((a) => (
                              <Tr key={a.id}>
                                <Td fontWeight="medium">{a.type}</Td>
                                <Td>{a.description}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      a.niveau === 'CRITIQUE'
                                        ? 'red'
                                        : a.niveau === 'ELEVEE'
                                        ? 'orange'
                                        : a.niveau === 'MOYENNE'
                                        ? 'yellow'
                                        : 'blue'
                                    }
                                  >
                                    {a.niveau}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={a.statutAlerte === 'ACTIVE' ? 'red' : 'green'}
                                  >
                                    {a.statutAlerte}
                                  </Badge>
                                </Td>
                                <Td>{a.dateLimite || 'N/A'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel> : null}

                {isReadOnly ? <TabPanel>
                    {loadingLinked ? (
                      <Flex justify="center" align="center" p={8}>
                        <Spinner size="lg" color="brand.500" />
                      </Flex>
                    ) : projets.length === 0 ? (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        Aucun projet associé à cette réserve.
                      </Alert>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Nom Projet</Th>
                              <Th>Maître d'ouvrage</Th>
                              <Th>Financement</Th>
                              <Th>Statut</Th>
                              <Th>Date Début</Th>
                              <Th>Date Fin</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {projets.map((p) => (
                              <Tr key={p.id}>
                                <Td fontWeight="medium">{p.nomProjet}</Td>
                                <Td>{p.maitreOuvrage}</Td>
                                <Td>{p.financement}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      p.statut === 'ACHEVE'
                                        ? 'green'
                                        : p.statut === 'EN_COURS'
                                        ? 'blue'
                                        : 'yellow'
                                    }
                                  >
                                    {p.statut}
                                  </Badge>
                                </Td>
                                <Td>{p.dateDebut || 'N/A'}</Td>
                                <Td>{p.dateFin || 'N/A'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel> : null}
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {isReadOnly ? 'Fermer' : 'Annuler'}
            </Button>
            {!isReadOnly && (
              <Button 
                colorScheme="brand"
                type="submit"
                isLoading={isLoading}
                loadingText="Enregistrement..."
              >
                {reserve ? 'Mettre à jour' : 'Créer'}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const Reserves = () => {
  const navigate = useNavigate();
  
  const [reserves, setReserves] = useState([]);
  const [filteredReserves, setFilteredReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [stats, setStats] = useState(null);
  const [reservesStats, setReservesStats] = useState({});

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();

  const fetchReserves = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reserveService.getAll();
      setReserves(data);
      setFilteredReserves(data);
      calculateStats(data);
      
      // Load stats for all reserves
      const statsPromises = data.map(async (reserve) => {
        try {
          const stats = await reserveService.getStats(reserve.id);
          return { id: reserve.id, stats };
        } catch (e) {
          return { id: reserve.id, stats: { nbDocuments: 0, nbLitiges: 0, nbOccupations: 0, nbAlertes: 0, nbProjets: 0 } };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = statsResults.reduce((acc, curr) => {
        acc[curr.id] = curr.stats;
        return acc;
      }, {});
      setReservesStats(statsMap);
      
    } catch (err) {
      console.error('Erreur chargement réserves:', err);
      setError('Erreur lors du chargement des réserves');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalSuperficie = data.reduce((sum, r) => sum + (parseFloat(r.superficie) || 0), 0);
    const byType = data.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
    const byStatut = data.reduce((acc, r) => {
      acc[r.statut] = (acc[r.statut] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total: data.length,
      totalSuperficie: totalSuperficie,
      byType: byType,
      byStatut: byStatut
    });
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  useEffect(() => {
    let filtered = reserves;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(reserve =>
        reserve.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reserve.localisation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reserve.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (filterType) {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Filtre par statut
    if (filterStatut) {
      filtered = filtered.filter(r => r.statut === filterStatut);
    }

    setFilteredReserves(filtered);
  }, [searchTerm, filterType, filterStatut, reserves]);

  // Fonction pour récupérer les données de la zone pour le zoom
  const getZoneDataForZoom = (reserve) => {
    if (!reserve.zone) return null;
    
    try {
      const zoneData = JSON.parse(reserve.zone);
      
      // Extraire les coordonnées de la zone
      if (zoneData.geometry && zoneData.geometry.coordinates) {
        const coordinates = zoneData.geometry.coordinates;
        
        // Pour un Polygon, coordinates[0] contient les points
        if (zoneData.geometry.type === 'Polygon' && coordinates[0]) {
          const points = coordinates[0];
          
          // Calculer les bornes (bounds) de la zone
          let minLat = Infinity;
          let maxLat = -Infinity;
          let minLng = Infinity;
          let maxLng = -Infinity;
          
          points.forEach(point => {
            const [lng, lat] = point;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          });
          
          // Calculer le centre de la zone
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          
          // Calculer la taille de la zone (pour déterminer le niveau de zoom)
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          
          // Calculer un niveau de zoom adapté (plus la zone est petite, plus on zoom)
          let zoomLevel = 12; // Zoom par défaut pour une zone précise
          
          if (latDiff > 0.5 || lngDiff > 0.5) {
            zoomLevel = 10; // Zone plus large
          } else if (latDiff > 1 || lngDiff > 1) {
            zoomLevel = 9; // Zone très large
          } else if (latDiff < 0.1 && lngDiff < 0.1) {
            zoomLevel = 15; // Zone très petite, zoom maximal
          } else if (latDiff < 0.05 && lngDiff < 0.05) {
            zoomLevel = 17; // Zone minuscule, zoom encore plus
          }
          
          return {
            center: [centerLat, centerLng],
            zoom: zoomLevel,
            bounds: [[minLat, minLng], [maxLat, maxLng]],
            name: reserve.nom
          };
        }
      }
    } catch (error) {
      console.error('Erreur parsing zone pour zoom:', error);
    }
    
    // Fallback: utiliser les coordonnées latitude/longitude si disponibles
    if (reserve.latitude && reserve.longitude) {
      return {
        center: [reserve.latitude, reserve.longitude],
        zoom: 13,
        bounds: null,
        name: reserve.nom
      };
    }
    
    return null;
  };

  // Fonction pour voir sur la carte avec zoom
  const handleViewOnMap = (reserveId, reserveNom) => {
    const reserve = reserves.find(r => r.id === reserveId);
    
    if (!reserve) {
      toast({
        title: 'Erreur',
        description: 'Réserve non trouvée',
        status: 'error',
        duration: 2000,
      });
      return;
    }
    
    // Obtenir les données pour le zoom
    const zoomData = getZoneDataForZoom(reserve);
    
    if (zoomData) {
      // Construire l'URL avec toutes les données nécessaires
      const params = new URLSearchParams({
        highlight: reserveId,
        lat: zoomData.center[0].toFixed(6),
        lng: zoomData.center[1].toFixed(6),
        zoom: zoomData.zoom.toString()
      });
      
      // Ajouter les bounds si disponibles
      if (zoomData.bounds) {
        params.append('minLat', zoomData.bounds[0][0].toFixed(6));
        params.append('minLng', zoomData.bounds[0][1].toFixed(6));
        params.append('maxLat', zoomData.bounds[1][0].toFixed(6));
        params.append('maxLng', zoomData.bounds[1][1].toFixed(6));
      }
      
      navigate(`/visite?${params.toString()}`);
      
      toast({
        title: 'Zoom sur la zone',
        description: `Zoom sur "${reserveNom}"`,
        status: 'success',
        duration: 2000,
      });
    } else {
      // Pas de données de zone, rediriger simplement
      navigate(`/visite?highlight=${reserveId}`);
      
      toast({
        title: 'Affichage sur la carte',
        description: `Affichage de "${reserveNom}"`,
        status: 'info',
        duration: 2000,
      });
    }
  };



  const handleExport = (format) => {
    let exportData;
    let filename;

    switch (format) {
      case 'csv':
        exportData = convertToCSV(filteredReserves);
        filename = `reserves_${Date.now()}.csv`;
        break;
      case 'geojson':
        exportData = convertToGeoJSON(filteredReserves);
        filename = `reserves_${Date.now()}.geojson`;
        break;
      case 'json':
      default:
        exportData = JSON.stringify(filteredReserves, null, 2);
        filename = `reserves_${Date.now()}.json`;
    }

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '💾 Export réussi',
      description: `Fichier ${filename} téléchargé`,
      status: 'success',
      duration: 3000
    });
  };

  const convertToCSV = (data) => {
    const headers = ['ID', 'Nom', 'Localisation', 'Superficie', 'Type', 'Statut', 'Latitude', 'Longitude'];
    const rows = data.map(r => [
      r.id,
      r.nom,
      r.localisation,
      r.superficie,
      r.type,
      r.statut,
      r.latitude,
      r.longitude
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const convertToGeoJSON = (data) => {
    const features = data.filter(r => r.zone).map(r => {
      try {
        const zoneData = JSON.parse(r.zone);
        return {
          ...zoneData,
          properties: {
            ...zoneData.properties,
            id: r.id,
            nom: r.nom,
            type: r.type,
            statut: r.statut,
            superficie: r.superficie,
            localisation: r.localisation
          }
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return JSON.stringify({
      type: "FeatureCollection",
      features: features
    }, null, 2);
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      ACTIF: { color: 'green', text: 'Actif' },
      INACTIF: { color: 'red', text: 'Inactif' },
      EN_MAINTENANCE: { color: 'orange', text: 'En maintenance' },
      EN_PROJET: { color: 'blue', text: 'En projet' },
    };
    const config = statusConfig[statut] || { color: 'gray', text: statut };
    return <Badge colorScheme={config.color}>{config.text}</Badge>;
  };

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* En-tête avec statistiques */}
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="gray.700" mb={2}>
              🗺️ Gestion du domaine de l'État (SIG Avancé)
            </Heading>
            <Text color="gray.500">
              Système d'Information Géographique pour la gestion du domaine de l'État
            </Text>
          </Box>
          

        </Flex>

        {/* Statistiques */}
        {stats ? <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Réserves</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>Enregistrées</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Superficie Totale</StatLabel>
                  <StatNumber>{stats.totalSuperficie.toFixed(0)} m²</StatNumber>
                  <StatHelpText>{(stats.totalSuperficie / 1000000).toFixed(2)} km²</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Réserves Actives</StatLabel>
                  <StatNumber>{stats.byStatut.ACTIF || 0}</StatNumber>
                  <StatHelpText>{stats.total > 0 ? ((stats.byStatut.ACTIF / stats.total) * 100).toFixed(0) : 0}%</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Types</StatLabel>
                  <StatNumber>{Object.keys(stats.byType).length}</StatNumber>
                  <StatHelpText>Catégories</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid> : null}

        {/* Barre de recherche et filtres */}
        <HStack spacing={4} flexWrap="wrap">
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher une réserve..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Menu>
            <MenuButton as={Button} leftIcon={<FiFilter />} variant="outline">
              Filtres
            </MenuButton>
            <MenuList>
              <Select 
                placeholder="Tous les types" 
                size="sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                mb={2}
                mx={2}
                width="auto"
              >
                <option value="NATUREL">Naturelle</option>
                <option value="ADMINISTRATIF">Administrative</option>
                <option value="PROTEGE">Protégée</option>
                <option value="COMMUNAUTAIRE">Communautaire</option>
                <option value="PRIVE">Privée</option>
              </Select>
              
              <Select 
                placeholder="Tous les statuts" 
                size="sm"
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                mx={2}
                width="auto"
              >
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
                <option value="EN_MAINTENANCE">En maintenance</option>
                <option value="EN_PROJET">En projet</option>
              </Select>
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton as={Button} leftIcon={<FiDownload />} variant="outline" colorScheme="purple">
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => handleExport('csv')}>📄 CSV</MenuItem>
              <MenuItem onClick={() => handleExport('geojson')}>🌍 GeoJSON</MenuItem>
              <MenuItem onClick={() => handleExport('json')}>📋 JSON</MenuItem>
            </MenuList>
          </Menu>

          {(filterType || filterStatut || searchTerm) ? <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterStatut('');
              }}
            >
              Réinitialiser
            </Button> : null}
        </HStack>

        {/* Tableau */}
        <Card shadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement des réserves...</Text>
              </Box>
            ) : filteredReserves.length === 0 ? (
              <Box textAlign="center" py={8}>
                <FiMap size={48} color="gray" style={{ margin: '0 auto 16px' }} />
                <Text color="gray.500">Aucune réserve trouvée</Text>
                {(searchTerm || filterType || filterStatut) ? <Button 
                    size="sm" 
                    mt={4}
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('');
                      setFilterStatut('');
                    }}
                  >
                    Voir toutes les réserves
                  </Button> : null}
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Nom</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Localisation</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Superficie</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Type</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Dossier</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Statut</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Zone</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredReserves.map((reserve, index) => (
                      <Tr 
                        key={reserve.id} 
                        bg={index % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'blue.50', transition: 'all 0.2s' }}
                      >
                        <Td px={4} py={3} fontWeight="medium">
                          <VStack align="start" spacing={0}>
                            <Text>{reserve.nom}</Text>
                            {reserve.zone ? <Badge colorScheme="purple" fontSize="xs">
                                <FiMap style={{ display: 'inline', marginRight: '4px' }} />
                                Zone définie
                              </Badge> : <Badge colorScheme="gray" fontSize="xs">
                                Sans zone
                              </Badge>}
                          </VStack>
                        </Td>
                        <Td px={4} py={3}>
                          <Text fontSize="sm">{reserve.localisation}</Text>
                        </Td>
                        <Td px={4} py={3}>
                          <Text fontWeight="semibold">{reserve.superficie} m²</Text>
                          <Text fontSize="xs" color="gray.500">
                            {(parseFloat(reserve.superficie) / 1000000).toFixed(2)} km²
                          </Text>
                        </Td>
                        <Td px={4} py={3}>
                          <VStack align="start" spacing={1}>
                            <Badge colorScheme={reserve.type === 'SPECIALE' ? 'orange' : 'blue'} variant="subtle">
                              {reserve.type}
                            </Badge>
                            {reserve.type === 'SPECIALE' ? (
                              <Text fontSize="xs" color="orange.600" fontWeight="bold">CESSION</Text>
                            ) : (
                              <Text fontSize="xs" color="blue.600" fontWeight="bold">ATTRIBUTION</Text>
                            )}
                          </VStack>
                        </Td>
                        <Td px={4} py={3}>
                          {reservesStats[reserve.id] ? (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs">📄 {reservesStats[reserve.id].nbDocuments} doc(s)</Text>
                              <Text fontSize="xs">⚖️ {reservesStats[reserve.id].nbLitiges} litige(s)</Text>
                              <Text fontSize="xs">🏠 {reservesStats[reserve.id].nbOccupations} occup.</Text>
                            </VStack>
                          ) : (
                            <Spinner size="xs" />
                          )}
                        </Td>
                        <Td px={4} py={3}>{getStatusBadge(reserve.statut)}</Td>
                        <Td px={4} py={3}>
                          <VStack align="start" spacing={0}>
                            {reserve.latitude && reserve.longitude ? (
                              <>
                                <Text fontSize="xs" color="gray.600">
                                  Lat: {reserve.latitude?.toFixed(4)}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  Lng: {reserve.longitude?.toFixed(4)}
                                </Text>
                              </>
                            ) : (
                              <Text fontSize="xs" color="gray.400">Pas de coordonnées</Text>
                            )}
                          </VStack>
                        </Td>
                        <Td px={4} py={3}>
                          <HStack spacing={2}>
                            {/* BOUTON: VOIR SUR LA CARTE AVEC ZOOM */}
                            {reserve.zone ? (
                              <Tooltip label="Zoomer sur cette zone">
                                <IconButton
                                  icon={<FiMap />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  onClick={() => handleViewOnMap(reserve.id, reserve.nom)}
                                  aria-label="Zoomer sur la zone"
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip label="Pas de zone définie">
                                <IconButton
                                  icon={<FiMap />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="gray"
                                  isDisabled
                                  aria-label="Pas de zone définie"
                                />
                              </Tooltip>
                            )}
                            
                            <Tooltip label="Voir les détails">
                              <IconButton
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => {
                                  setSelectedReserve(reserve);
                                  onViewOpen();
                                }}
                                aria-label="Voir les détails"
                              />
                            </Tooltip>
                            

                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Résumé des résultats */}
        {filteredReserves.length > 0 && (
          <HStack justify="space-between" px={4}>
            <Text fontSize="sm" color="gray.600">
              Affichage de {filteredReserves.length} réserve{filteredReserves.length > 1 ? 's' : ''} 
              {reserves.length !== filteredReserves.length && ` sur ${reserves.length} au total`}
            </Text>
            {(searchTerm || filterType || filterStatut) ? <Badge colorScheme="blue">
                Filtres actifs
              </Badge> : null}
          </HStack>
        )}
      </VStack>



      {/* Modal de visualisation */}
      <ReserveForm
        isOpen={isViewOpen}
        onClose={onViewClose}
        reserve={selectedReserve}
        onSuccess={fetchReserves}
        isReadOnly={true}
      />


    </Box>
  );
};

export default Reserves;
