// src/pages/dashboard/alerte.jsx
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
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
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiEdit,
    FiEye,
    FiPlus,
    FiSearch,
    FiTrash2
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { alerteService, reserveService } from '../../services/apiService';

const AlerteForm = ({ isOpen, onClose, alerte = null, onSuccess, isReadOnly = false }) => {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    niveau: 'MOYEN',
    reserveId: '',
  });
  const [reserves, setReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Charger les réserves pour le select
  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const data = await reserveService.getAll();
        setReserves(data);
      } catch (error) {
        console.error('Erreur lors du chargement des réserves:', error);
      }
    };
    fetchReserves();
  }, []);

  useEffect(() => {
    console.log('Alerte reçue dans le formulaire:', alerte);
    if (alerte) {
      console.log('ID de l\'alerte:', alerte.id);
      console.log('Réserve de l\'alerte:', alerte.reserve);
      setFormData({
        type: alerte.type || '',
        description: alerte.description || '',
        niveau: alerte.niveau || 'MOYEN',
        reserveId: alerte.reserve?.id || '',
      });
    } else {
      setFormData({
        type: '',
        description: '',
        niveau: 'MOYEN',
        reserveId: '',
      });
    }
  }, [alerte, isOpen]);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation des données (identique aux autres onglets)
      if (!formData.reserveId) {
        throw new Error('Veuillez sélectionner une réserve');
      }

      // Structure de données identique aux autres onglets (projets, documents)
      const submitData = {
        ...formData,
        reserve: { id: parseInt(formData.reserveId) }
      };

      if (alerte) {
        await alerteService.update(alerte.id, submitData);
        toast({
          title: 'Alerte mise à jour',
          description: 'L\'alerte a été mise à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await alerteService.create(submitData);
        toast({
          title: 'Alerte créée',
          description: 'L\'alerte a été créée avec succès',
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader>
          {isReadOnly 
            ? `Détails de l'alerte: ${alerte?.type}` 
            : alerte 
              ? 'Modifier l\'alerte' 
              : 'Créer une nouvelle alerte'
          }
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Type d'alerte</FormLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="Sélectionner un type"
                  isDisabled={isReadOnly}
                >
                  <option value="SECURITE">Sécurité</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ENVIRONNEMENT">Environnement</option>
                  <option value="ACCES">Accès</option>
                  <option value="POLLUTION">Pollution</option>
                  <option value="BRAVAGE">Bravage</option>
                  <option value="AUTRE">Autre</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description détaillée de l'alerte"
                  rows={4}
                  isReadOnly={isReadOnly}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Niveau d'alerte</FormLabel>
                  <Select
                    name="niveau"
                    value={formData.niveau}
                    onChange={handleChange}
                    isDisabled={isReadOnly}
                  >
                    <option value="FAIBLE">Faible</option>
                    <option value="MOYEN">Moyen</option>
                    <option value="ELEVE">Élevé</option>
                    <option value="CRITIQUE">Critique</option>
                  </Select>
                </FormControl>

                <FormControl isRequired isInvalid={!formData.reserveId}>
                  <FormLabel>Réserve concernée</FormLabel>
                  <Select
                    name="reserveId"
                    value={formData.reserveId}
                    onChange={handleChange}
                    placeholder="Sélectionner une réserve"
                    isDisabled={isReadOnly}
                  >
                    {reserves.map((reserve) => (
                      <option key={reserve.id} value={reserve.id}>
                        {reserve.nom} - {reserve.localisation}
                      </option>
                    ))}
                  </Select>
                  {!formData.reserveId && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      Veuillez sélectionner une réserve
                    </Text>
                  )}
                </FormControl>
              </HStack>
            </VStack>
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
                {alerte ? 'Mettre à jour' : 'Créer'}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const Alertes = () => {
  const [alertes, setAlertes] = useState([]);
  const [filteredAlertes, setFilteredAlertes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerte, setSelectedAlerte] = useState(null);

  // Correction des hooks useDisclosure
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchAlertes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await alerteService.getAll();
      setAlertes(data);
      setFilteredAlertes(data);
    } catch (err) {
      console.error('Erreur lors du chargement des alertes:', err);
      setError('Erreur lors du chargement des alertes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertes();
  }, []);

  useEffect(() => {
    const filtered = alertes.filter(alerte =>
      alerte.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerte.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerte.reserve?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAlertes(filtered);
  }, [searchTerm, alertes]);

  const handleDelete = async () => {
    try {
      await alerteService.delete(selectedAlerte.id);
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte a été supprimée avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAlertes();
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getNiveauBadge = (niveau) => {
    const niveauConfig = {
      FAIBLE: { color: 'green', text: 'Faible' },
      MOYEN: { color: 'yellow', text: 'Moyen' },
      ELEVE: { color: 'orange', text: 'Élevé' },
      CRITIQUE: { color: 'red', text: 'Critique' },
    };
    const config = niveauConfig[niveau] || { color: 'gray', text: niveau };
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
        {/* En-tête */}
        <Flex justify="space-between" align="center">
              <Box>
            <Heading size="lg" color="gray.700" mb={2}>
                  Gestion des Alertes
            </Heading>
            <Text color="gray.500">
              Gérez les alertes et notifications du système
                </Text>
              </Box>
          {isAdmin() && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              onClick={() => {
                setSelectedAlerte(null);
                onFormOpen();
              }}
            >
              Nouvelle alerte
            </Button>
          )}
        </Flex>

        {/* Recherche */}
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
            </HStack>

        {/* Tableau des alertes */}
        <Card shadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement des alertes...</Text>
              </Box>
            ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Type</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Description</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Niveau</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Réserve</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                    {filteredAlertes.map((alerte, index) => (
                      <Tr 
                        key={alerte.id}
                        bg={index % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'gray.100' }}
                        transition="background-color 0.2s"
                      >
                        <Td px={4} py={3} fontWeight="medium">{alerte.type}</Td>
                      <Td px={4} py={3}>
                          <Text noOfLines={2} maxW="300px">
                          {alerte.description}
                        </Text>
                      </Td>
                        <Td px={4} py={3}>{getNiveauBadge(alerte.niveau)}</Td>
                        <Td px={4} py={3}>{alerte.reserve?.nom || 'N/A'}</Td>
                      <Td px={4} py={3}>
                        <HStack spacing={2}>
                            {/* Bouton de visualisation pour tous les utilisateurs */}
                          <Tooltip label="Voir les détails">
                            <IconButton
                                icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                                onClick={() => {
                                  setSelectedAlerte(alerte);
                                  onViewOpen();
                                }}
                                aria-label="Voir les détails"
                            />
                          </Tooltip>
                            
                            {/* Boutons CRUD seulement pour les admins */}
                            {isAdmin() && (
                              <>
                                                      <Tooltip label="Modifier">
                            <IconButton
                                    icon={<FiEdit />}
                              size="sm"
                              variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => {
                                      console.log('Alerte sélectionnée pour modification:', alerte);
                                      console.log('ID de l\'alerte:', alerte.id);
                                      if (!alerte.id) {
                                        toast({
                                          title: 'Erreur',
                                          description: 'Impossible de modifier cette alerte : ID manquant',
                                          status: 'error',
                                          duration: 5000,
                                          isClosable: true,
                                        });
                                        return;
                                      }
                                      setSelectedAlerte(alerte);
                                      onFormOpen();
                                    }}
                              aria-label="Modifier"
                            />
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <IconButton
                                    icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                                    onClick={() => {
                                      setSelectedAlerte(alerte);
                                      onDeleteOpen();
                                    }}
                              aria-label="Supprimer"
                            />
                          </Tooltip>
                              </>
                            )}
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
                </VStack>

      {/* Modal de formulaire (admin seulement) */}
      <AlerteForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        alerte={selectedAlerte}
        onSuccess={fetchAlertes}
        isReadOnly={false}
      />

      {/* Modal de visualisation (tous les utilisateurs) */}
      <AlerteForm
        isOpen={isViewOpen}
        onClose={onViewClose}
        alerte={selectedAlerte}
        onSuccess={fetchAlertes}
        isReadOnly={true}
      />

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent>
            <ModalHeader>Confirmer la suppression</ModalHeader>
            <ModalBody>
              <Text>
              Êtes-vous sûr de vouloir supprimer l'alerte "{selectedAlerte?.type}" ?
                Cette action est irréversible.
              </Text>
            </ModalBody>
            <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                Annuler
              </Button>
            <Button colorScheme="red" onClick={handleDelete}>
                Supprimer
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </Box>
  );
};

export default Alertes;








