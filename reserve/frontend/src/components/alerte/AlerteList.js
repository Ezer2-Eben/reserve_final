import {
    Alert,
    AlertIcon,
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Flex,
    Grid,
    Heading,
    HStack,
    Icon,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Stat,
    StatLabel,
    StatNumber,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useToast,
    VStack
} from '@chakra-ui/react';
import { AlertTriangle, Bell, Clock, Edit, Eye, MapPin, Plus, Trash2 } from 'lucide-react';


import { deleteAlerte, getAllAlertes } from '../../api/alerte';

const AlerteList = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlerte, setSelectedAlerte] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllAlertes();
        // Gérer différents formats de réponse
        let alertesData = [];
        if (Array.isArray(data)) {
          alertesData = data;
        } else if (data && Array.isArray(data.alertes)) {
          alertesData = data.alertes;
        } else if (data && data.content && Array.isArray(data.content)) {
          alertesData = data.content;
        } else {
          console.warn('Format de données inattendu:', data);
          alertesData = [];
        }
        setAlertes(alertesData);
      } catch (error) {
        console.error('Erreur lors du chargement des alertes :', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          // Mode démonstration avec des données fictives
          setAlertes([
            {
              id: 1,
              titre: 'Incursion de braconniers',
              description: 'Activité suspecte détectée dans la zone nord de la réserve. Mouvements suspects observés près du poste de garde.',
              niveauUrgence: 'Élevé',
              statut: 'En cours',
              dateCreation: '2024-03-15',
              localisation: 'Zone nord de la réserve',
              responsable: 'Garde forestier Kossi',
              reserveAssociee: 'Parc National de la Pendjari',
              typeAlerte: 'Sécurité',
              priorite: 'Haute'
            },
            {
              id: 2,
              titre: 'Feu de brousse',
              description: 'Début d\'incendie dans la zone est. Intervention immédiate requise.',
              niveauUrgence: 'Critique',
              statut: 'Résolu',
              dateCreation: '2024-03-10',
              localisation: 'Zone est de la réserve',
              responsable: 'Équipe de lutte',
              reserveAssociee: 'Réserve de la Biosphère de la Pendjari',
              typeAlerte: 'Environnement',
              priorite: 'Critique'
            },
            {
              id: 3,
              titre: 'Espèce menacée observée',
              description: 'Observation d\'une espèce rare dans la zone centrale. Suivi spécial requis.',
              niveauUrgence: 'Moyen',
              statut: 'En cours',
              dateCreation: '2024-03-12',
              localisation: 'Zone centrale',
              responsable: 'Dr. Fatou Diallo',
              reserveAssociee: 'Forêt Classée de la Lama',
              typeAlerte: 'Conservation',
              priorite: 'Moyenne'
            },
            {
              id: 4,
              titre: 'Dégradation de l\'habitat',
              description: 'Dégradation observée dans la zone ouest. Évaluation environnementale nécessaire.',
              niveauUrgence: 'Faible',
              statut: 'Planifié',
              dateCreation: '2024-03-08',
              localisation: 'Zone ouest',
              responsable: 'Équipe de surveillance',
              reserveAssociee: 'Parc National de la Pendjari',
              typeAlerte: 'Environnement',
              priorite: 'Basse'
            },
            {
              id: 5,
              titre: 'Infrastructure endommagée',
              description: 'Pont d\'accès endommagé par les pluies. Réparation urgente nécessaire.',
              niveauUrgence: 'Élevé',
              statut: 'En cours',
              dateCreation: '2024-03-14',
              localisation: 'Point d\'accès principal',
              responsable: 'Service technique',
              reserveAssociee: 'Réserve de la Biosphère de la Pendjari',
              typeAlerte: 'Infrastructure',
              priorite: 'Haute'
            }
          ]);
          setError('Mode démonstration - Données fictives affichées (serveur backend non disponible)');
        } else {
          setError('Impossible de charger les alertes. Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUrgenceColor = (niveau) => {
    switch (niveau?.toLowerCase()) {
      case 'critique':
        return 'red';
      case 'élevé':
        return 'orange';
      case 'moyen':
        return 'yellow';
      case 'faible':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'en cours':
        return 'blue';
      case 'résolu':
        return 'green';
      case 'planifié':
        return 'yellow';
      case 'suspendu':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'sécurité':
        return 'red';
      case 'environnement':
        return 'green';
      case 'conservation':
        return 'blue';
      case 'infrastructure':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Il y a ${diffDays}j`;
  };

  const handleViewAlerte = (alerte) => {
    setSelectedAlerte(alerte);
    setIsViewModalOpen(true);
  };

  const handleDeleteAlerte = (alerte) => {
    setSelectedAlerte(alerte);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAlerte) return;

    try {
      await deleteAlerte(selectedAlerte.id);
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte a été supprimée avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Rafraîchir la liste
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'alerte.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedAlerte(null);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Chargement des alertes...</Text>
      </VStack>
    );
  }

  if (error && !error.includes('Mode démonstration')) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon /> {error}
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card shadow="sm" bg="white">
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Heading size="lg" color="gray.800" mb={2}>
                Gestion des Alertes
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Surveillez et gérez les alertes de sécurité et environnementales
              </Text>
            </Box>
            <HStack spacing={3}>
              <Badge colorScheme="red" variant="subtle" px={3} py={1}>
                Système de surveillance
              </Badge>
              <Button
                leftIcon={<Icon as={Plus} />}
                colorScheme="red"
                size="md"
              >
                Nouvelle alerte
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Statistiques */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="blue.600">{alertes.length}</StatNumber>
              <StatLabel>Total des alertes</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="red.600">
                {alertes.filter(a => a.niveauUrgence?.toLowerCase() === 'critique').length}
              </StatNumber>
              <StatLabel>Alertes critiques</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="blue.600">
                {alertes.filter(a => a.statut?.toLowerCase() === 'en cours').length}
              </StatNumber>
              <StatLabel>En cours</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="green.600">
                {alertes.filter(a => a.statut?.toLowerCase() === 'résolu').length}
              </StatNumber>
              <StatLabel>Résolues</StatLabel>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Alerte mode démonstration */}
      {error && error.includes('Mode démonstration') ? <Alert status="info" borderRadius="md">
          <AlertIcon /> {error}
        </Alert> : null}

      {/* Tableau des alertes amélioré */}
      <Card shadow="sm" bg="white">
        <CardHeader bg="red.50" borderBottom="1px" borderColor="red.200">
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={Bell} color="red.500" />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="red.800">
                  Liste des Alertes
                </Text>
                <Text fontSize="sm" color="red.600">
                  Toutes les alertes enregistrées dans le système
                </Text>
              </Box>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody p={0}>
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead bg="gray.50">
                <Tr>
                  <Th px={4} py={3}>Alerte</Th>
                  <Th px={4} py={3}>Réserve</Th>
                  <Th px={4} py={3}>Type</Th>
                  <Th px={4} py={3}>Urgence</Th>
                  <Th px={4} py={3}>Statut</Th>
                  <Th px={4} py={3}>Responsable</Th>
                  <Th px={4} py={3}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {alertes.map((alerte) => (
                  <Tr key={alerte.id} _hover={{ bg: 'gray.50' }}>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={2}>
                          <Icon 
                            as={AlertTriangle} 
                            w={4} 
                            h={4} 
                            color={getUrgenceColor(alerte.niveauUrgence) + '.500'} 
                          />
                          <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                            {alerte.titre}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500" noOfLines={2}>
                          {alerte.description}
                        </Text>
                        <HStack spacing={2} fontSize="xs" color="gray.400">
                          <HStack spacing={1}>
                            <Icon as={Clock} w={3} h={3} />
                            <Text>{getTimeAgo(alerte.dateCreation)}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={MapPin} w={3} h={3} />
                            <Text>{alerte.localisation}</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium" color="blue.600">
                          {alerte.reserveAssociee || 'Non spécifiée'}
                        </Text>
                        <Badge size="sm" colorScheme="blue" variant="subtle">
                          Réserve
                        </Badge>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getTypeColor(alerte.typeAlerte)} variant="subtle" size="sm">
                        {alerte.typeAlerte || 'Non spécifié'}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={1}>
                        <Badge colorScheme={getUrgenceColor(alerte.niveauUrgence)} variant="solid" size="sm">
                          {alerte.niveauUrgence}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          Priorité: {alerte.priorite || 'Standard'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getStatusColor(alerte.statut)} variant="solid" size="sm">
                        {alerte.statut}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      <HStack spacing={2}>
                        <Avatar size="xs" name={alerte.responsable} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" fontWeight="medium" color="gray.700">
                            {alerte.responsable}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Responsable
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td px={4} py={3}>
                      <HStack spacing={2}>
                        <Tooltip label="Voir les détails">
                          <IconButton
                            icon={<Icon as={Eye} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="Voir"
                            onClick={() => handleViewAlerte(alerte)}
                          />
                        </Tooltip>
                        <Tooltip label="Modifier">
                          <IconButton
                            icon={<Icon as={Edit} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="orange"
                            aria-label="Modifier"
                          />
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <IconButton
                            icon={<Icon as={Trash2} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Supprimer"
                            onClick={() => handleDeleteAlerte(alerte)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Modal de visualisation amélioré */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={AlertTriangle} color={selectedAlerte ? getUrgenceColor(selectedAlerte.niveauUrgence) + '.500' : 'gray.500'} />
              <Text>Détails de l'alerte</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAlerte ? <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="gray.700" fontSize="sm">Titre de l'alerte:</Text>
                  <Text fontSize="lg" fontWeight="semibold">{selectedAlerte.titre}</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" color="gray.700" fontSize="sm">Description:</Text>
                  <Text>{selectedAlerte.description}</Text>
                </Box>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Réserve associée:</Text>
                    <Text color="blue.600" fontWeight="medium">{selectedAlerte.reserveAssociee || 'Non spécifiée'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Type d'alerte:</Text>
                    <Badge colorScheme={getTypeColor(selectedAlerte.typeAlerte)}>
                      {selectedAlerte.typeAlerte || 'Non spécifié'}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Niveau d'urgence:</Text>
                    <Badge colorScheme={getUrgenceColor(selectedAlerte.niveauUrgence)}>
                      {selectedAlerte.niveauUrgence}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Statut:</Text>
                    <Badge colorScheme={getStatusColor(selectedAlerte.statut)}>
                      {selectedAlerte.statut}
                    </Badge>
                  </Box>
                </Grid>
                
                <Divider />
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Date de création:</Text>
                    <Text>{formatDate(selectedAlerte.dateCreation)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Localisation:</Text>
                    <Text>{selectedAlerte.localisation}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Responsable:</Text>
                    <HStack>
                      <Avatar size="sm" name={selectedAlerte.responsable} />
                      <Text>{selectedAlerte.responsable}</Text>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="sm">Priorité:</Text>
                    <Text>{selectedAlerte.priorite || 'Standard'}</Text>
                  </Box>
                </Grid>
              </VStack> : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Êtes-vous sûr de vouloir supprimer l'alerte "{selectedAlerte?.titre}" ?
              Cette action est irréversible.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default AlerteList;

