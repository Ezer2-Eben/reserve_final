// src/components/reserve/ReserveList.js
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
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
    VStack,
    useToast
} from '@chakra-ui/react';
import { Edit, Eye, Info, Trash2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { deleteReserve, fetchReserves } from '../../api/reserve';

const ReserveList = ({ refreshTrigger }) => {
  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchReserves();
        console.log('Données reçues:', data);
        // Gérer différents formats de réponse
        let reservesData = [];
        if (Array.isArray(data)) {
          reservesData = data;
        } else if (data && Array.isArray(data.reserves)) {
          reservesData = data.reserves;
        } else if (data && data.content && Array.isArray(data.content)) {
          reservesData = data.content;
        } else {
          console.warn('Format de données inattendu:', data);
          reservesData = [];
        }
        setReserves(reservesData);
      } catch (err) {
        console.error('Erreur lors du chargement des réserves:', err);
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          // Mode démonstration avec des données fictives
          console.log('Mode démonstration activé - données fictives');
          setReserves([
            {
              id: 1,
              nom: 'Parc National de la Pendjari',
              localisation: 'Atacora, Bénin',
              latitude: 10.5,
              longitude: 1.2,
              superficie: '2755',
              type: 'Parc National',
              statut: 'Active',
              zone: 'POLYGON((1.1 10.4, 1.3 10.4, 1.3 10.6, 1.1 10.6, 1.1 10.4))'
            },
            {
              id: 2,
              nom: 'Réserve de la Biosphère de la Pendjari',
              localisation: 'Atacora, Bénin',
              latitude: 10.7,
              longitude: 1.4,
              superficie: '4800',
              type: 'Réserve Naturelle',
              statut: 'Protégée',
              zone: 'POLYGON((1.3 10.6, 1.5 10.6, 1.5 10.8, 1.3 10.8, 1.3 10.6))'
            },
            {
              id: 3,
              nom: 'Forêt Classée de la Lama',
              localisation: 'Zou, Bénin',
              latitude: 7.2,
              longitude: 2.1,
              superficie: '1600',
              type: 'Forêt Classée',
              statut: 'Active',
              zone: 'POLYGON((2.0 7.1, 2.2 7.1, 2.2 7.3, 2.0 7.3, 2.0 7.1))'
            }
          ]);
          setError('Mode démonstration - Données fictives affichées (serveur backend non disponible)');
        } else {
          setError('Impossible de charger les réserves. Erreur: ' + (err.message || 'Erreur inconnue'));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTrigger]);

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'protégée':
        return 'blue';
      case 'en cours de création':
        return 'yellow';
      case 'proposée':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'parc national':
        return 'purple';
      case 'réserve naturelle':
        return 'teal';
      case 'forêt classée':
        return 'green';
      case 'zone de protection':
        return 'orange';
      case 'réserve de biosphère':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const handleViewReserve = (reserve) => {
    setSelectedReserve(reserve);
    setIsViewModalOpen(true);
  };

  const handleEditReserve = (reserve) => {
    setSelectedReserve(reserve);
    setIsEditModalOpen(true);
  };

  const handleDeleteReserve = (reserve) => {
    setSelectedReserve(reserve);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedReserve) return;

    try {
      await deleteReserve(selectedReserve.id || selectedReserve.idReserve);
      toast({
        title: 'Réserve supprimée',
        description: 'La réserve a été supprimée avec succès.',
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
        description: 'Impossible de supprimer la réserve.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedReserve(null);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Chargement des réserves...</Text>
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

  if (reserves.length === 0) {
    return (
      <VStack spacing={4} py={10}>
        <Icon as={Info} w={8} h={8} color="gray.400" />
        <Text textAlign="center" color="gray.600">
        Aucune réserve trouvée.
      </Text>
        <Text fontSize="sm" color="gray.500">
          Créez votre première réserve en utilisant le bouton "Créer une réserve".
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Statistiques */}
      <HStack spacing={6} justify="center" mb={4}>
        <Stat textAlign="center">
          <StatNumber color="blue.600">{reserves.length}</StatNumber>
          <StatLabel>Total des réserves</StatLabel>
        </Stat>
        <Stat textAlign="center">
          <StatNumber color="green.600">
            {reserves.filter(r => r.statut?.toLowerCase() === 'active').length}
          </StatNumber>
          <StatLabel>Réserves actives</StatLabel>
        </Stat>
        <Stat textAlign="center">
          <StatNumber color="purple.600">
            {reserves.filter(r => r.type?.toLowerCase() === 'parc national').length}
          </StatNumber>
          <StatLabel>Parcs nationaux</StatLabel>
        </Stat>
      </HStack>

      {/* Alerte mode démonstration */}
      {error && error.includes('Mode démonstration') ? <Alert status="info" borderRadius="md">
          <AlertIcon /> {error}
        </Alert> : null}

      {/* Tableau */}
      <Box overflowX="auto" borderRadius="md" border="1px" borderColor="gray.200">
        <Table variant="simple" size="md">
          <Thead bg="gray.50">
            <Tr>
              <Th px={4} py={3}>ID</Th>
              <Th px={4} py={3}>Nom</Th>
              <Th px={4} py={3}>Localisation</Th>
              <Th px={4} py={3}>Coordonnées</Th>
              <Th px={4} py={3}>Superficie</Th>
              <Th px={4} py={3}>Type</Th>
              <Th px={4} py={3}>Statut</Th>
              <Th px={4} py={3}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {reserves.map((r) => (
              <Tr key={r.id || r.idReserve || Math.random()} _hover={{ bg: 'gray.50' }}>
                <Td px={4} py={3} fontWeight="semibold">
                  #{r.id || r.idReserve || '-'}
                </Td>
                <Td px={4} py={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color="gray.800">
                      {r.nom || r.nomReserve || '-'}
                    </Text>
                  </VStack>
                </Td>
                <Td px={4} py={3}>
                  <Text fontSize="sm" color="gray.600">
                    {r.localisation || r.localisationReserve || '-'}
                  </Text>
                </Td>
                <Td px={4} py={3}>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="gray.500">
                      Lat: {r.latitude ?? '-'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Lng: {r.longitude ?? '-'}
                    </Text>
                  </VStack>
                </Td>
                <Td px={4} py={3}>
                  <Text fontWeight="semibold">
                    {r.superficie || r.superficieReserve || '-'} km²
                  </Text>
                </Td>
                <Td px={4} py={3}>
                  <Badge colorScheme={getTypeColor(r.type)} variant="subtle">
                    {r.type || r.typeReserve || '-'}
                  </Badge>
                </Td>
                <Td px={4} py={3}>
                  <Badge colorScheme={getStatusColor(r.statut)} variant="solid">
                    {r.statut || r.statutReserve || '-'}
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
                        onClick={() => handleViewReserve(r)}
                      />
                    </Tooltip>
                    <Tooltip label="Modifier">
                      <IconButton
                        icon={<Icon as={Edit} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="orange"
                        aria-label="Modifier"
                        onClick={() => handleEditReserve(r)}
                      />
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <IconButton
                        icon={<Icon as={Trash2} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Supprimer"
                        onClick={() => handleDeleteReserve(r)}
                      />
                    </Tooltip>
                  </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>

      {/* Informations sur la zone WKT (cachée par défaut) */}
      <Box mt={4}>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Les coordonnées géographiques (WKT) sont stockées pour chaque réserve et peuvent être visualisées sur la carte.
        </Text>
      </Box>

      {/* Modal de visualisation */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails de la réserve</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReserve ? <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="gray.700">Nom:</Text>
                  <Text>{selectedReserve.nom || selectedReserve.nomReserve}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Localisation:</Text>
                  <Text>{selectedReserve.localisation || selectedReserve.localisationReserve}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Coordonnées:</Text>
                  <Text>Latitude: {selectedReserve.latitude}</Text>
                  <Text>Longitude: {selectedReserve.longitude}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Superficie:</Text>
                  <Text>{selectedReserve.superficie || selectedReserve.superficieReserve} km²</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Type:</Text>
                  <Badge colorScheme={getTypeColor(selectedReserve.type)}>
                    {selectedReserve.type || selectedReserve.typeReserve}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Statut:</Text>
                  <Badge colorScheme={getStatusColor(selectedReserve.statut)}>
                    {selectedReserve.statut || selectedReserve.statutReserve}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Zone géographique (WKT):</Text>
                  <Text fontSize="xs" fontFamily="mono" bg="gray.50" p={2} borderRadius="md">
                    {selectedReserve.zone || selectedReserve.zoneReserve}
                  </Text>
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
              Êtes-vous sûr de vouloir supprimer la réserve "{selectedReserve?.nom || selectedReserve?.nomReserve}" ?
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

      {/* Modal d'édition (placeholder pour l'instant) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier la réserve</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="gray.600">
              Fonctionnalité d'édition en cours de développement...
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsEditModalOpen(false)}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ReserveList;
