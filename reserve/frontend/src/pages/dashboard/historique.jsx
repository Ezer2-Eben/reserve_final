// src/pages/dashboard/historique.jsx
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
    Tr,
    useDisclosure,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiEdit,
    FiPlus,
    FiSearch,
    FiTrash2
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { historiqueService, reserveService } from '../../services/apiService';

const HistoriqueForm = ({ isOpen, onClose, historique = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    natureActe: '',
    numeroReference: '',
    dateActe: '',
    commentaire: '',
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
    if (historique) {
      setFormData({
        natureActe: historique.natureActe || '',
        numeroReference: historique.numeroReference || '',
        dateActe: historique.dateActe ? historique.dateActe.split('T')[0] : '',
        commentaire: historique.commentaire || '',
        reserveId: historique.reserve?.id || '',
      });
    } else {
      setFormData({
        natureActe: '',
        numeroReference: '',
        dateActe: '',
        commentaire: '',
        reserveId: '',
      });
    }
  }, [historique, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        reserve: { id: parseInt(formData.reserveId) }
      };

      if (historique) {
        await historiqueService.update(historique.id, submitData);
        toast({
          title: 'Historique mis à jour',
          description: 'L\'historique a été mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await historiqueService.create(submitData);
        toast({
          title: 'Historique créé',
          description: 'L\'historique a été créé avec succès',
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
          {historique ? 'Modifier l\'historique' : 'Ajouter un nouvel historique'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nature de l'acte</FormLabel>
                <Select
                  name="natureActe"
                  value={formData.natureActe}
                  onChange={handleChange}
                  placeholder="Sélectionner la nature de l'acte"
                >
                  <option value="DECRET">Décret</option>
                  <option value="ARRETE">Arrêté</option>
                  <option value="LOI">Loi</option>
                  <option value="REGLEMENT">Règlement</option>
                  <option value="DECISION">Décision</option>
                  <option value="CONVENTION">Convention</option>
                  <option value="ACCORD">Accord</option>
                  <option value="AUTRE">Autre</option>
                </Select>
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Numéro de référence</FormLabel>
                  <Input
                    name="numeroReference"
                    value={formData.numeroReference}
                    onChange={handleChange}
                    placeholder="Numéro de référence"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date de l'acte</FormLabel>
                  <Input
                    name="dateActe"
                    type="date"
                    value={formData.dateActe}
                    onChange={handleChange}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Réserve concernée</FormLabel>
                <Select
                  name="reserveId"
                  value={formData.reserveId}
                  onChange={handleChange}
                  placeholder="Sélectionner une réserve"
                >
                  {reserves.map((reserve) => (
                    <option key={reserve.id} value={reserve.id}>
                      {reserve.nom} - {reserve.localisation}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Commentaire</FormLabel>
                <Textarea
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleChange}
                  placeholder="Commentaire ou description supplémentaire"
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Enregistrement..."
            >
              {historique ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const Historique = () => {
  const [historiques, setHistoriques] = useState([]);
  const [filteredHistoriques, setFilteredHistoriques] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistorique, setSelectedHistorique] = useState(null);

  // Correction des hooks useDisclosure
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchHistoriques = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await historiqueService.getAll();
      setHistoriques(data);
      setFilteredHistoriques(data);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoriques();
  }, []);

  useEffect(() => {
    const filtered = historiques.filter(historique =>
      historique.natureActe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historique.numeroReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      historique.reserve?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHistoriques(filtered);
  }, [searchTerm, historiques]);

  const handleDelete = async () => {
    try {
      await historiqueService.delete(selectedHistorique.id);
      toast({
        title: 'Historique supprimé',
        description: 'L\'historique a été supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchHistoriques();
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

  const getNatureBadge = (natureActe) => {
    const natureConfig = {
      DECRET: { color: 'red', text: 'Décret' },
      ARRETE: { color: 'blue', text: 'Arrêté' },
      LOI: { color: 'purple', text: 'Loi' },
      REGLEMENT: { color: 'green', text: 'Règlement' },
      DECISION: { color: 'orange', text: 'Décision' },
      CONVENTION: { color: 'teal', text: 'Convention' },
      ACCORD: { color: 'cyan', text: 'Accord' },
      AUTRE: { color: 'gray', text: 'Autre' },
    };
    const config = natureConfig[natureActe] || { color: 'gray', text: natureActe };
    return <Badge colorScheme={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
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
              Historique Juridique
            </Heading>
            <Text color="gray.500">
              Gérez l'historique juridique et administratif des réserves
                </Text>
              </Box>
          {isAdmin() && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              onClick={() => {
                setSelectedHistorique(null);
                onFormOpen();
              }}
            >
              Nouvel historique
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
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
            </HStack>

        {/* Tableau de l'historique */}
        <Card shadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement de l'historique...</Text>
              </Box>
            ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Nature de l'acte</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Numéro de référence</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Date de l'acte</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Réserve</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Commentaire</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                    {filteredHistoriques.map((historique, index) => (
                      <Tr 
                        key={historique.id}
                        bg={index % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'gray.100' }}
                        transition="background-color 0.2s"
                      >
                        <Td px={4} py={3}>{getNatureBadge(historique.natureActe)}</Td>
                        <Td px={4} py={3} fontWeight="medium">{historique.numeroReference}</Td>
                        <Td px={4} py={3}>{formatDate(historique.dateActe)}</Td>
                        <Td px={4} py={3}>{historique.reserve?.nom || 'N/A'}</Td>
                        <Td px={4} py={3}>
                          <Text noOfLines={2} maxW="200px">
                            {historique.commentaire || 'Aucun commentaire'}
                          </Text>
                        </Td>
                        <Td px={4} py={3}>
                          <HStack spacing={2}>
                            {isAdmin() && (
                              <>
                              <IconButton
                                  icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                  onClick={() => {
                                    setSelectedHistorique(historique);
                                    onFormOpen();
                                  }}
                                aria-label="Modifier"
                              />
                              <IconButton
                                  icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                  onClick={() => {
                                    setSelectedHistorique(historique);
                                    onDeleteOpen();
                                  }}
                                aria-label="Supprimer"
                              />
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

      {/* Modal de formulaire */}
      <HistoriqueForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        historique={selectedHistorique}
        onSuccess={fetchHistoriques}
      />

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent>
            <ModalHeader>Confirmer la suppression</ModalHeader>
            <ModalBody>
              <Text>
              Êtes-vous sûr de vouloir supprimer l'historique "{selectedHistorique?.natureActe} - {selectedHistorique?.numeroReference}" ?
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

export default Historique;








