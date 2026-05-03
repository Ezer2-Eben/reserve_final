import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
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
import { Calendar, Edit, Eye, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { deleteHistorique, getAllHistoriques } from '../../api/historique';

const HistoriqueList = () => {
  const [historiques, setHistoriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllHistoriques();
        // Gérer différents formats de réponse
        let historiquesData = [];
        if (Array.isArray(data)) {
          historiquesData = data;
        } else if (data && Array.isArray(data.historiques)) {
          historiquesData = data.historiques;
        } else if (data && data.content && Array.isArray(data.content)) {
          historiquesData = data.content;
        } else {
          console.warn('Format de données inattendu:', data);
          historiquesData = [];
        }
        setHistoriques(historiquesData);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique :', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          // Mode démonstration avec des données fictives
          setHistoriques([
            {
              id: 1,
              titre: 'Création de la réserve',
              description: 'Décret de création de la réserve naturelle',
              dateEvenement: '1990-05-15',
              typeEvenement: 'Création',
              impact: 'Positif',
              statut: 'Terminé',
              responsable: 'Gouvernement du Bénin',
              documentsAssocies: 'Décret n°90-123'
            },
            {
              id: 2,
              titre: 'Extension de la zone protégée',
              description: 'Extension de la superficie de la réserve',
              dateEvenement: '2005-08-20',
              typeEvenement: 'Modification',
              impact: 'Positif',
              statut: 'Terminé',
              responsable: 'Ministère de l\'Environnement',
              documentsAssocies: 'Arrêté n°2005-456'
            },
            {
              id: 3,
              titre: 'Plan de gestion 2020',
              description: 'Mise à jour du plan de gestion de la réserve',
              dateEvenement: '2020-03-10',
              typeEvenement: 'Planification',
              impact: 'Positif',
              statut: 'En cours',
              responsable: 'Direction de la réserve',
              documentsAssocies: 'Plan de gestion 2020-2025'
            },
            {
              id: 4,
              titre: 'Conflit foncier',
              description: 'Litige avec les populations locales',
              dateEvenement: '2023-11-05',
              typeEvenement: 'Conflit',
              impact: 'Négatif',
              statut: 'En cours',
              responsable: 'Tribunal local',
              documentsAssocies: 'Procès-verbal n°2023-789'
            }
          ]);
          setError('Mode démonstration - Données fictives affichées (serveur backend non disponible)');
        } else {
          setError('Impossible de charger l\'historique. Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'positif':
        return 'green';
      case 'négatif':
        return 'red';
      case 'neutre':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'terminé':
        return 'green';
      case 'en cours':
        return 'blue';
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
      case 'création':
        return 'blue';
      case 'modification':
        return 'orange';
      case 'planification':
        return 'purple';
      case 'conflit':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleViewHistorique = (historique) => {
    setSelectedHistorique(historique);
    setIsViewModalOpen(true);
  };

  const handleDeleteHistorique = (historique) => {
    setSelectedHistorique(historique);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedHistorique) return;

    try {
      await deleteHistorique(selectedHistorique.id);
      toast({
        title: 'Événement supprimé',
        description: 'L\'événement a été supprimé de l\'historique.',
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
        description: 'Impossible de supprimer l\'événement.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedHistorique(null);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Chargement de l'historique...</Text>
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
                Historique Juridique
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Suivez l'évolution juridique et administrative de la réserve
              </Text>
            </Box>
            <HStack spacing={3}>
              <Badge colorScheme="orange" variant="subtle" px={3} py={1}>
                Système de gestion
              </Badge>
              <Button
                leftIcon={<Icon as={Plus} />}
                colorScheme="orange"
                size="md"
              >
                Ajouter un événement
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
              <StatNumber color="blue.600">{historiques.length}</StatNumber>
              <StatLabel>Total des événements</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="green.600">
                {historiques.filter(h => h.impact?.toLowerCase() === 'positif').length}
              </StatNumber>
              <StatLabel>Impacts positifs</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="red.600">
                {historiques.filter(h => h.impact?.toLowerCase() === 'négatif').length}
              </StatNumber>
              <StatLabel>Impacts négatifs</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="blue.600">
                {historiques.filter(h => h.statut?.toLowerCase() === 'en cours').length}
              </StatNumber>
              <StatLabel>En cours</StatLabel>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Alerte mode démonstration */}
      {error && error.includes('Mode démonstration') ? <Alert status="info" borderRadius="md">
          <AlertIcon /> {error}
        </Alert> : null}

      {/* Tableau de l'historique */}
      <Card shadow="sm" bg="white">
        <CardHeader bg="orange.50" borderBottom="1px" borderColor="orange.200">
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={Calendar} color="orange.500" />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="orange.800">
                  Chronologie des Événements
                </Text>
                <Text fontSize="sm" color="orange.600">
                  Tous les événements juridiques et administratifs
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
                  <Th px={4} py={3}>ID</Th>
                  <Th px={4} py={3}>Événement</Th>
                  <Th px={4} py={3}>Type</Th>
                  <Th px={4} py={3}>Date</Th>
                  <Th px={4} py={3}>Impact</Th>
                  <Th px={4} py={3}>Statut</Th>
                  <Th px={4} py={3}>Responsable</Th>
                  <Th px={4} py={3}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {historiques.map((historique) => (
                  <Tr key={historique.id} _hover={{ bg: 'gray.50' }}>
                    <Td px={4} py={3} fontWeight="semibold">
                      #{historique.id}
                    </Td>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color="gray.800">
                          {historique.titre}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={2}>
                          {historique.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getTypeColor(historique.typeEvenement)} variant="subtle">
                        {historique.typeEvenement}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {formatDate(historique.dateEvenement)}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getImpactColor(historique.impact)} variant="solid">
                        {historique.impact}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getStatusColor(historique.statut)} variant="solid">
                        {historique.statut}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      <HStack spacing={1}>
                        <Icon as={Users} w={3} h={3} color="gray.400" />
                        <Text fontSize="sm" color="gray.600">
                          {historique.responsable}
                        </Text>
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
                            onClick={() => handleViewHistorique(historique)}
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
                            onClick={() => handleDeleteHistorique(historique)}
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

      {/* Modal de visualisation */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails de l'événement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedHistorique ? <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="gray.700">Titre de l'événement:</Text>
                  <Text>{selectedHistorique.titre}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Description:</Text>
                  <Text>{selectedHistorique.description}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Type d'événement:</Text>
                  <Badge colorScheme={getTypeColor(selectedHistorique.typeEvenement)}>
                    {selectedHistorique.typeEvenement}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Date:</Text>
                  <Text>{formatDate(selectedHistorique.dateEvenement)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Impact:</Text>
                  <Badge colorScheme={getImpactColor(selectedHistorique.impact)}>
                    {selectedHistorique.impact}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Statut:</Text>
                  <Badge colorScheme={getStatusColor(selectedHistorique.statut)}>
                    {selectedHistorique.statut}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Responsable:</Text>
                  <Text>{selectedHistorique.responsable}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Documents associés:</Text>
                  <Text>{selectedHistorique.documentsAssocies}</Text>
                </Box>
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
              Êtes-vous sûr de vouloir supprimer l'événement "{selectedHistorique?.titre}" ?
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

export default HistoriqueList;
