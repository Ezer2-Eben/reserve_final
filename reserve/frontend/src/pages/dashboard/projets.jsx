// src/pages/dashboard/projets.jsx
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Divider,
    Flex,
    SimpleGrid,
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
    Th,
    Thead,
    Tr,
    useDisclosure,
    useToast,
    VStack,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Textarea,
    Progress
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiEdit,
    FiPlus,
    FiSearch,
    FiTrash2,
    FiEye,
    FiDownload
} from 'react-icons/fi';

import InlineDocumentUploader, { uploadPendingDocuments } from '../../components/document/InlineDocumentUploader';
import { useAuth } from '../../context/AuthContext';
import { projetService, reserveService, documentService } from '../../services/apiService';

const ProjetForm = ({ isOpen, onClose, projet = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    nomProjet: '',
    maitreOuvrage: '',
    financement: '',
    statut: 'EN_COURS',
    dateDebut: '',
    dateFin: '',
    reserveId: '',
  });
  const [reserves, setReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (projet) {
      setFormData({
        nomProjet: projet.nomProjet || '',
        maitreOuvrage: projet.maitreOuvrage || '',
        financement: projet.financement || '',
        statut: projet.statut || 'EN_COURS',
        dateDebut: projet.dateDebut ? projet.dateDebut.split('T')[0] : '',
        dateFin: projet.dateFin ? projet.dateFin.split('T')[0] : '',
        reserveId: projet.reserve?.id || '',
      });
    } else {
      setFormData({
        nomProjet: '',
        maitreOuvrage: '',
        financement: '',
        statut: 'EN_COURS',
        dateDebut: '',
        dateFin: '',
        reserveId: '',
      });
    }
    setPendingDocs([]);
  }, [projet, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const reserveId = formData.reserveId;
      const submitData = {
        ...formData,
        reserve: { id: parseInt(reserveId) }
      };

      let projetId = null;

      if (projet) {
        await projetService.update(projet.id, submitData);
        projetId = projet.id;
        toast({
          title: 'Projet mis à jour',
          description: 'Le projet a été mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const created = await projetService.create(submitData);
        // Récupérer l'ID du projet nouvellement créé
        projetId = created?.id || created?.data?.id || null;
        toast({
          title: 'Projet créé',
          description: 'Le projet a été créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // Upload des documents joints — liés à la réserve ET au projet
      if (pendingDocs.length > 0 && reserveId) {
        try {
          setUploadProgress(0);
          await uploadPendingDocuments(pendingDocs, reserveId, documentService.uploadFile, projetId, setUploadProgress);
          setUploadProgress(100);
          toast({
            title: `${pendingDocs.length} document(s) joint(s) avec succès`,
            status: 'success',
            duration: 3000,
          });
        } catch {
          toast({ title: 'Avertissement', description: "Certains documents n'ont pas pu être uploadés.", status: 'warning', duration: 4000 });
        }
      }

      onSuccess();
      onClose();
      setUploadProgress(0);
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
          {projet ? 'Modifier le projet' : 'Créer un nouveau projet'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom du projet</FormLabel>
                <Input
                  name="nomProjet"
                  value={formData.nomProjet}
                  onChange={handleChange}
                  placeholder="Nom du projet"
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Maître d'ouvrage</FormLabel>
                  <Input
                    name="maitreOuvrage"
                    value={formData.maitreOuvrage}
                    onChange={handleChange}
                    placeholder="Maître d'ouvrage"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Financement</FormLabel>
                  <Input
                    name="financement"
                    value={formData.financement}
                    onChange={handleChange}
                    placeholder="Source de financement"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Date de début</FormLabel>
                  <Input
                    name="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Date de fin</FormLabel>
                  <Input
                    name="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={handleChange}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                  >
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="ANNULE">Annulé</option>
                    <option value="PLANIFIE">Planifié</option>
                  </Select>
                </FormControl>

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
              </HStack>

              <Divider />

              {/* Upload documents */}
              <InlineDocumentUploader
                reserveId={formData.reserveId}
                entityLabel="ce projet"
                onFilesChange={setPendingDocs}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <FormControl mt={4}>
                  <FormLabel fontSize="sm" color="brand.600">Envoi des documents en cours ({uploadProgress}%)...</FormLabel>
                  <Progress value={uploadProgress} size="sm" colorScheme="brand" hasStripe isAnimated borderRadius="md" />
                </FormControl>
              )}
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
              {projet ? 'Mettre à jour' : 'Créer'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const ProjetDetailsModal = ({ isOpen, onClose, projet }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projet && isOpen) {
      const fetchDocs = async () => {
        setIsLoading(true);
        try {
          const data = await documentService.getByProjet(projet.id);
          setDocuments(data);
        } catch (error) {
          console.error("Erreur lors du chargement des documents:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDocs();
    }
  }, [projet, isOpen]);

  const getStatusColor = (statut) => {
    const statusConfig = {
      EN_COURS: 'blue',
      TERMINE: 'green',
      EN_ATTENTE: 'yellow',
      ANNULE: 'red',
      PLANIFIE: 'purple',
    };
    return statusConfig[statut] || 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent maxW="80vw" maxH="85vh" overflowY="auto">
        <ModalHeader>📋 Dossier Complet du Projet: {projet?.nomProjet}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="brand">
            <TabList>
              <Tab>📝 Informations Générales</Tab>
              <Tab>📂 Documents Liés ({documents.length})</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={6} align="stretch" py={2}>
                  <Box>
                    <Heading size="xs" color="gray.500" textTransform="uppercase" mb={3}>
                      Détails du Projet
                    </Heading>
                    <Card variant="outline" bg="gray.50">
                      <CardBody>
                        <SimpleGrid columns={2} spacing={4}>
                          <Text><strong>Nom du projet :</strong> {projet?.nomProjet}</Text>
                          <Text>
                            <strong>Statut :</strong>{' '}
                            <Badge colorScheme={getStatusColor(projet?.statut)}>
                              {projet?.statut}
                            </Badge>
                          </Text>
                          <Text><strong>Maître d'ouvrage :</strong> {projet?.maitreOuvrage || 'N/A'}</Text>
                          <Text><strong>Source de financement :</strong> {projet?.financement || 'N/A'}</Text>
                          <Text><strong>Date de début :</strong> {formatDate(projet?.dateDebut)}</Text>
                          <Text><strong>Date de fin :</strong> {formatDate(projet?.dateFin)}</Text>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  </Box>

                  <Box>
                    <Heading size="xs" color="gray.500" textTransform="uppercase" mb={3}>
                      Réserve Foncière Associée
                    </Heading>
                    <Card variant="outline">
                      <CardBody>
                        <SimpleGrid columns={2} spacing={4}>
                          <Text><strong>Nom de la réserve :</strong> {projet?.reserve?.nom || 'N/A'}</Text>
                          <Text><strong>Localisation :</strong> {projet?.reserve?.localisation || 'N/A'}</Text>
                          <Text><strong>Superficie :</strong> {projet?.reserve?.superficie ? `${projet.reserve.superficie} m²` : 'N/A'}</Text>
                          <Text><strong>Type de réserve :</strong> {projet?.reserve?.type || 'N/A'}</Text>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel>
                {isLoading ? (
                  <Flex justify="center" align="center" py={8}>
                    <Spinner size="md" color="brand.500" />
                  </Flex>
                ) : documents.length === 0 ? (
                  <Alert status="info" borderRadius="md" mt={2}>
                    <AlertIcon />
                    Aucun document n'est actuellement lié à ce projet.
                  </Alert>
                ) : (
                  <Box overflowX="auto" mt={2}>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>Nom du fichier</Th>
                          <Th>Catégorie</Th>
                          <Th>Format</Th>
                          <Th>Taille</Th>
                          <Th>Date d'ajout</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {documents.map((doc) => (
                          <Tr key={doc.id}>
                            <Td fontWeight="medium">{doc.nomFichierOriginal || doc.nomFichier}</Td>
                            <Td>
                              <Badge colorScheme="purple">{doc.categorie || 'Non classé'}</Badge>
                            </Td>
                            <Td>{doc.typeFichier}</Td>
                            <Td>{doc.tailleFichier ? `${(doc.tailleFichier / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</Td>
                            <Td>{formatDate(doc.dateUpload)}</Td>
                            <Td>
                              <IconButton
                                size="xs"
                                icon={<FiDownload />}
                                colorScheme="brand"
                                variant="ghost"
                                aria-label="Télécharger"
                                onClick={() => {
                                  window.open(`${process.env.REACT_APP_API_URL || 'https://reserve-final.onrender.com/api'}/documents/${doc.id}/download`, '_blank');
                                }}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="brand" onClick={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Projets = () => {
  const [projets, setProjets] = useState([]);
  const [filteredProjets, setFilteredProjets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjet, setSelectedProjet] = useState(null);

  // Correction des hooks useDisclosure
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchProjets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projetService.getAll();
      setProjets(data);
      setFilteredProjets(data);
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setError('Erreur lors du chargement des projets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjets();
  }, []);

  useEffect(() => {
    const filtered = projets.filter(projet =>
      projet.nomProjet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projet.maitreOuvrage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projet.reserve?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjets(filtered);
  }, [searchTerm, projets]);

  const handleDelete = async () => {
    try {
      await projetService.delete(selectedProjet.id);
      toast({
        title: 'Projet supprimé',
        description: 'Le projet a été supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchProjets();
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

  const getStatusBadge = (statut) => {
    const statusConfig = {
      EN_COURS: { color: 'blue', text: 'En cours' },
      TERMINE: { color: 'green', text: 'Terminé' },
      EN_ATTENTE: { color: 'yellow', text: 'En attente' },
      ANNULE: { color: 'red', text: 'Annulé' },
      PLANIFIE: { color: 'purple', text: 'Planifié' },
    };
    const config = statusConfig[statut] || { color: 'gray', text: statut };
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
                  Gestion des Projets
            </Heading>
            <Text color="gray.500">
              Gérez les projets liés aux réserves
                </Text>
              </Box>
          {isAdmin() && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              onClick={() => {
                setSelectedProjet(null);
                onFormOpen();
              }}
            >
              Nouveau projet
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
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
            </HStack>

        {/* Tableau des projets */}
        <Card shadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement des projets...</Text>
              </Box>
            ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Nom du projet</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Maître d'ouvrage</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Statut</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Date début</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Date fin</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Réserve</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Documents</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                    {filteredProjets.map((projet, index) => (
                      <Tr 
                        key={projet.id}
                        bg={index % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'gray.100' }}
                        transition="background-color 0.2s"
                      >
                        <Td px={4} py={3} fontWeight="medium">{projet.nomProjet}</Td>
                        <Td px={4} py={3}>{projet.maitreOuvrage}</Td>
                        <Td px={4} py={3}>{getStatusBadge(projet.statut)}</Td>
                        <Td px={4} py={3}>{formatDate(projet.dateDebut)}</Td>
                        <Td px={4} py={3}>{formatDate(projet.dateFin)}</Td>
                        <Td px={4} py={3}>{projet.reserve?.nom || 'N/A'}</Td>
                        <Td px={4} py={3}>
                          {projet.documents && projet.documents.length > 0 ? (
                            <HStack spacing={1} flexWrap="wrap">
                              {projet.documents.map(doc => (
                                <Badge key={doc.id} colorScheme="teal" variant="subtle" fontSize="xs">
                                  {doc.nomFichier}
                                </Badge>
                              ))}
                            </HStack>
                          ) : (
                            <Text color="gray.400" fontStyle="italic" fontSize="xs">Aucun document</Text>
                           )}
                        </Td>
                        <Td px={4} py={3}>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => {
                              setSelectedProjet(projet);
                              onDetailsOpen();
                            }}
                            aria-label="Voir détails"
                          />
                          {isAdmin() && (
                            <>
                              <IconButton
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => {
                                  setSelectedProjet(projet);
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
                                    setSelectedProjet(projet);
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
      <ProjetForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        projet={selectedProjet}
        onSuccess={fetchProjets}
      />

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent>
            <ModalHeader>Confirmer la suppression</ModalHeader>
            <ModalBody>
              <Text>
              Êtes-vous sûr de vouloir supprimer le projet "{selectedProjet?.nomProjet}" ?
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

      {/* Modal de détails du projet */}
      <ProjetDetailsModal
        isOpen={isDetailsOpen}
        onClose={onDetailsClose}
        projet={selectedProjet}
      />
    </Box>
  );
};

export default Projets;








