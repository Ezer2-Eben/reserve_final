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
import { Calendar, Edit, Eye, MapPin, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { deleteProjet, getAllProjets } from '../../api/projet';

const ProjetList = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProjet, setSelectedProjet] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllProjets();
        // Gérer différents formats de réponse
        let projetsData = [];
        if (Array.isArray(data)) {
          projetsData = data;
        } else if (data && Array.isArray(data.projets)) {
          projetsData = data.projets;
        } else if (data && data.content && Array.isArray(data.content)) {
          projetsData = data.content;
        } else {
          console.warn('Format de données inattendu:', data);
          projetsData = [];
        }
        setProjets(projetsData);
      } catch (error) {
        console.error('Erreur lors du chargement des projets :', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          // Mode démonstration avec des données fictives
          setProjets([
            {
              id: 1,
              nom: 'Conservation de la biodiversité',
              description: 'Projet de protection des espèces menacées dans la réserve',
              dateDebut: '2024-01-15',
              dateFin: '2024-12-31',
              statut: 'En cours',
              budget: 50000,
              responsable: 'Dr. Kossi Adama',
              localisation: 'Parc National de la Pendjari'
            },
            {
              id: 2,
              nom: 'Écotourisme durable',
              description: 'Développement d\'activités touristiques respectueuses de l\'environnement',
              dateDebut: '2024-03-01',
              dateFin: '2025-02-28',
              statut: 'Planifié',
              budget: 75000,
              responsable: 'Mme. Fatou Diallo',
              localisation: 'Réserve de la Biosphère'
            },
            {
              id: 3,
              nom: 'Sensibilisation communautaire',
              description: 'Programme d\'éducation environnementale pour les populations locales',
              dateDebut: '2024-02-01',
              dateFin: '2024-08-31',
              statut: 'Terminé',
              budget: 25000,
              responsable: 'M. Jean-Pierre Koffi',
              localisation: 'Forêt Classée de la Lama'
            }
          ]);
          setError('Mode démonstration - Données fictives affichées (serveur backend non disponible)');
        } else {
          setError('Impossible de charger les projets. Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'en cours':
        return 'blue';
      case 'terminé':
        return 'green';
      case 'planifié':
        return 'yellow';
      case 'suspendu':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatBudget = (budget) => {
    if (!budget) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(budget);
  };

  const handleViewProjet = (projet) => {
    setSelectedProjet(projet);
    setIsViewModalOpen(true);
  };

  const handleDeleteProjet = (projet) => {
    setSelectedProjet(projet);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProjet) return;

    try {
      await deleteProjet(selectedProjet.id);
      toast({
        title: 'Projet supprimé',
        description: 'Le projet a été supprimé avec succès.',
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
        description: 'Impossible de supprimer le projet.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedProjet(null);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Chargement des projets...</Text>
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
                Gestion des Projets
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Suivez et gérez les projets de conservation et de développement
              </Text>
            </Box>
            <HStack spacing={3}>
              <Badge colorScheme="purple" variant="subtle" px={3} py={1}>
                Système de gestion
              </Badge>
              <Button
                leftIcon={<Icon as={Plus} />}
                colorScheme="purple"
                size="md"
              >
                Nouveau projet
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
              <StatNumber color="blue.600">{projets.length}</StatNumber>
              <StatLabel>Total des projets</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="blue.600">
                {projets.filter(p => p.statut?.toLowerCase() === 'en cours').length}
              </StatNumber>
              <StatLabel>En cours</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="green.600">
                {projets.filter(p => p.statut?.toLowerCase() === 'terminé').length}
              </StatNumber>
              <StatLabel>Terminés</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="yellow.600">
                {projets.filter(p => p.statut?.toLowerCase() === 'planifié').length}
              </StatNumber>
              <StatLabel>Planifiés</StatLabel>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Alerte mode démonstration */}
      {error && error.includes('Mode démonstration') ? <Alert status="info" borderRadius="md">
          <AlertIcon /> {error}
        </Alert> : null}

      {/* Tableau des projets */}
      <Card shadow="sm" bg="white">
        <CardHeader bg="purple.50" borderBottom="1px" borderColor="purple.200">
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={Calendar} color="purple.500" />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="purple.800">
                  Liste des Projets
                </Text>
                <Text fontSize="sm" color="purple.600">
                  Tous les projets enregistrés dans la base de données
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
                  <Th px={4} py={3}>Nom du projet</Th>
                  <Th px={4} py={3}>Description</Th>
                  <Th px={4} py={3}>Période</Th>
                  <Th px={4} py={3}>Budget</Th>
                  <Th px={4} py={3}>Responsable</Th>
                  <Th px={4} py={3}>Localisation</Th>
                  <Th px={4} py={3}>Statut</Th>
                  <Th px={4} py={3}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {projets.map((projet) => (
                  <Tr key={projet.id} _hover={{ bg: 'gray.50' }}>
                    <Td px={4} py={3} fontWeight="semibold">
                      #{projet.id}
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontWeight="semibold" color="gray.800">
                        {projet.nom}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {projet.description}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500">
                          Début: {formatDate(projet.dateDebut)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Fin: {formatDate(projet.dateFin)}
                        </Text>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontWeight="semibold">
                        {formatBudget(projet.budget)}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {projet.responsable}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <HStack spacing={1}>
                        <Icon as={MapPin} w={3} h={3} color="gray.400" />
                        <Text fontSize="sm" color="gray.600">
                          {projet.localisation}
                        </Text>
                      </HStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getStatusColor(projet.statut)} variant="solid">
                        {projet.statut}
                      </Badge>
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
                            onClick={() => handleViewProjet(projet)}
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
                            onClick={() => handleDeleteProjet(projet)}
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
          <ModalHeader>Détails du projet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProjet ? <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="gray.700">Nom du projet:</Text>
                  <Text>{selectedProjet.nom}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Description:</Text>
                  <Text>{selectedProjet.description}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Période:</Text>
                  <Text>Début: {formatDate(selectedProjet.dateDebut)}</Text>
                  <Text>Fin: {formatDate(selectedProjet.dateFin)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Budget:</Text>
                  <Text>{formatBudget(selectedProjet.budget)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Responsable:</Text>
                  <Text>{selectedProjet.responsable}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Localisation:</Text>
                  <Text>{selectedProjet.localisation}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Statut:</Text>
                  <Badge colorScheme={getStatusColor(selectedProjet.statut)}>
                    {selectedProjet.statut}
                  </Badge>
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
              Êtes-vous sûr de vouloir supprimer le projet "{selectedProjet?.nom}" ?
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

export default ProjetList;
