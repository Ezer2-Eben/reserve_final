// src/pages/dashboard/documents.jsx
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
    Th,
    Thead,
    Tr,
    useDisclosure,
    useToast,
    VStack,
    SimpleGrid
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiDownload,
    FiEdit,
    FiPlus,
    FiSearch,
    FiTrash2,
    FiEye,
    FiExternalLink
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { documentService, reserveService, projetService } from '../../services/apiService';

// --- Composant de prévisualisation ---
const API_BASE = process.env.REACT_APP_API_URL || 'https://reserve-final.onrender.com/api';

const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  if (!document) return null;

  const token = localStorage.getItem('token');

  // Si le document a un chemin local, on utilise l'endpoint /preview du backend
  const isLocalFile = document.cheminFichier != null;
  const previewUrl = isLocalFile
    ? `${API_BASE}/documents/${document.id}/preview?token=${encodeURIComponent(token || '')}`
    : document.url;

  const renderPreview = () => {
    if (!previewUrl) return <Text p={4} color="gray.500">Aucun fichier associé à ce document.</Text>;

    const type = document.typeFichier?.toUpperCase();

    if (type === 'IMG') {
      return <img src={previewUrl} alt={document.nomFichier} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', margin: 'auto', padding: '16px' }} />;
    }

    if (type === 'PDF') {
      return <iframe src={previewUrl} title={document.nomFichier} width="100%" height="650px" style={{ border: 'none' }} />;
    }

    if (type === 'VIDEO') {
      // eslint-disable-next-line jsx-a11y/media-has-caption
      return <video src={previewUrl} controls style={{ width: '100%', maxHeight: '70vh' }} />;
    }

    if (type === 'AUDIO') {
      // eslint-disable-next-line jsx-a11y/media-has-caption
      return <audio src={previewUrl} controls style={{ width: '100%', marginTop: '20px', padding: '24px' }} />;
    }

    return (
      <VStack spacing={4} py={8}>
        <Text color="gray.500">Aperçu non disponible pour ce type de fichier ({document.typeFichier}).</Text>
        <Button as="a" href={previewUrl} target="_blank" leftIcon={<FiExternalLink />} colorScheme="brand">
          Ouvrir dans un nouvel onglet
        </Button>
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent overflow="hidden">
        <ModalHeader bg="gray.50" borderBottom="1px" borderColor="gray.200">
          Prévisualisation : {document.nomFichier}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>
          {(document.reserve || document.projet) ? (
            <Box px={4} py={3} bg="white" borderBottom="1px" borderColor="gray.200">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} fontSize="sm">
                {document.reserve ? (
                  <>
                    <Text><strong>Réserve :</strong> {document.reserve.nom}</Text>
                    <Text><strong>Localisation :</strong> {document.reserve.localisation || 'N/A'}</Text>
                    <Text><strong>Superficie réserve :</strong> {document.reserve.superficie ? `${document.reserve.superficie} m²` : 'N/A'}</Text>
                  </>
                ) : null}
                {document.projet ? (
                  <Text><strong>Projet :</strong> {document.projet.nomProjet}</Text>
                ) : null}
              </SimpleGrid>
            </Box>
          ) : null}
          <Box bg="gray.100" display="flex" justifyContent="center" alignItems="center" minH="300px">
            {renderPreview()}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// --- Formulaire de document ---
const DocumentForm = ({ isOpen, onClose, document = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    nomFichier: '',
    typeFichier: '',
    categorie: '',
    url: '',
    reserveId: '',
    projetId: '',
  });
  const [reserves, setReserves] = useState([]);
  const [projets, setProjets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadType, setUploadType] = useState('local'); // 'local' or 'external'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  // Charger les réserves et projets pour le select
  useEffect(() => {
    const fetchReservesAndProjets = async () => {
      try {
        const [reservesData, projetsData] = await Promise.all([
          reserveService.getAll(),
          projetService.getAll()
        ]);
        setReserves(reservesData);
        setProjets(projetsData);
      } catch (error) {
        console.error('Erreur lors du chargement des réserves et projets:', error);
      }
    };
    fetchReservesAndProjets();
  }, []);

  useEffect(() => {
    if (document) {
      setFormData({
        nomFichier: document.nomFichier || '',
        typeFichier: document.typeFichier || '',
        categorie: document.categorie || '',
        url: document.url || '',
        reserveId: document.reserve?.id || '',
        projetId: document.projet?.id || '',
      });
    } else {
      setFormData({
        nomFichier: '',
        typeFichier: '',
        categorie: '',
        url: '',
        reserveId: '',
        projetId: '',
      });
      setSelectedFile(null);
      setUploadType('local');
    }
  }, [document, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (document) {
        // Mode modification: on met juste à jour les métadonnées
        const submitData = {
          ...formData,
          reserve: { id: parseInt(formData.reserveId) },
          projet: formData.projetId ? { id: parseInt(formData.projetId) } : null
        };
        await documentService.update(document.id, submitData);
        toast({
          title: 'Document mis à jour',
          description: 'Le document a été mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Mode création
        if (uploadType === 'local') {
          if (!selectedFile) {
            toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier', status: 'error' });
            setIsLoading(false);
            return;
          }
          const formDataPayload = new FormData();
          formDataPayload.append('file', selectedFile);
          formDataPayload.append('reserveId', formData.reserveId);
          if (formData.projetId) formDataPayload.append('projetId', formData.projetId);
          formDataPayload.append('nomFichier', formData.nomFichier);
          formDataPayload.append('typeFichier', formData.typeFichier || 'AUTRE');
          if (formData.categorie) formDataPayload.append('categorie', formData.categorie);
          
          await documentService.uploadFile(formDataPayload);
        } else {
          const submitData = {
            ...formData,
            reserve: { id: parseInt(formData.reserveId) },
            projet: formData.projetId ? { id: parseInt(formData.projetId) } : null
          };
          await documentService.create(submitData);
        }
        toast({
          title: 'Document créé',
          description: 'Le document a été créé avec succès',
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!formData.nomFichier) {
        setFormData(prev => ({ ...prev, nomFichier: files[0].name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.nomFichier) {
        setFormData(prev => ({ ...prev, nomFichier: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader>
          {document ? 'Modifier le document' : 'Ajouter un nouveau document'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom du fichier</FormLabel>
                <Input
                  name="nomFichier"
                  value={formData.nomFichier}
                  onChange={handleChange}
                  placeholder="Nom du fichier"
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Type de fichier</FormLabel>
                  <Select
                    name="typeFichier"
                    value={formData.typeFichier}
                    onChange={handleChange}
                    placeholder="Sélectionner un type"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOC">Document Word</option>
                    <option value="XLS">Feuille de calcul</option>
                    <option value="IMG">Image</option>
                    <option value="VIDEO">Vidéo</option>
                    <option value="AUDIO">Audio</option>
                    <option value="ZIP">Archive</option>
                    <option value="AUTRE">Autre</option>
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

                <FormControl>
                  <FormLabel>Catégorie / Indexation</FormLabel>
                  <Select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    placeholder="Sélectionner une catégorie"
                  >
                    <option value="TITRE_FONCIER">Titre Foncier</option>
                    <option value="PLAN_CADASTRAL">Plan Cadastral</option>
                    <option value="ARRETE_AFFECTATION">Arrêté d'affectation</option>
                    <option value="DECISION_JUSTICE">Décision de justice</option>
                    <option value="RAPPORT_INSPECTION">Rapport d'inspection</option>
                    <option value="AUTRE">Autre</option>
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Projet associé (Optionnel)</FormLabel>
                  <Select
                    name="projetId"
                    value={formData.projetId}
                    onChange={handleChange}
                    placeholder="Aucun projet"
                  >
                    {projets.map((projet) => (
                      <option key={projet.id} value={projet.id}>
                        {projet.nomProjet} ({projet.statut})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              {!document && (
                <FormControl mb={2}>
                  <FormLabel>Type d'ajout</FormLabel>
                  <HStack spacing={4}>
                    <Button 
                      size="sm" 
                      colorScheme={uploadType === 'local' ? 'brand' : 'gray'} 
                      variant={uploadType === 'local' ? 'solid' : 'outline'}
                      onClick={() => setUploadType('local')}
                    >
                      Fichier local
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme={uploadType === 'external' ? 'brand' : 'gray'} 
                      variant={uploadType === 'external' ? 'solid' : 'outline'}
                      onClick={() => setUploadType('external')}
                    >
                      URL externe
                    </Button>
                  </HStack>
                </FormControl>
              )}

              {(!document && uploadType === 'local') ? (
                <FormControl isRequired>
                  <FormLabel>Fichier (Glisser-déposer ou cliquer)</FormLabel>
                  <Box
                    p={6}
                    border="2px dashed"
                    borderColor={isDragging ? 'brand.500' : 'gray.300'}
                    bg={isDragging ? 'brand.50' : 'gray.50'}
                    borderRadius="md"
                    textAlign="center"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    cursor="pointer"
                    onClick={() => window.document.getElementById('file-upload').click()}
                    transition="all 0.2s"
                    _hover={{ borderColor: 'brand.500', bg: 'brand.50' }}
                  >
                    <Input
                      id="file-upload"
                      type="file"
                      display="none"
                      onChange={handleFileSelect}
                    />
                    <Text color={isDragging ? 'brand.600' : 'gray.500'} fontWeight="medium">
                      {selectedFile ? `Fichier sélectionné: ${selectedFile.name}` : "Glissez-déposez un fichier ici ou cliquez pour parcourir"}
                    </Text>
                  </Box>
                </FormControl>
              ) : (
                <FormControl isRequired={!document}>
                  <FormLabel>URL du fichier</FormLabel>
                  <Input
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com/document.pdf"
                    type="url"
                  />
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
              {document ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentService.getAll();
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const filtered = documents.filter(document =>
      document.nomFichier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.typeFichier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.reserve?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.projet?.nomProjet?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);

  const handleDelete = async () => {
    try {
      await documentService.delete(selectedDocument.id);
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchDocuments();
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

  const getTypeBadge = (typeFichier) => {
    const typeConfig = {
      PDF: { color: 'red', text: 'PDF' },
      DOC: { color: 'blue', text: 'Word' },
      XLS: { color: 'green', text: 'Excel' },
      IMG: { color: 'purple', text: 'Image' },
      VIDEO: { color: 'orange', text: 'Vidéo' },
      AUDIO: { color: 'teal', text: 'Audio' },
      ZIP: { color: 'gray', text: 'Archive' },
      AUTRE: { color: 'gray', text: 'Autre' },
    };
    const config = typeConfig[typeFichier] || { color: 'gray', text: typeFichier };
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
                  Gestion des Documents
            </Heading>
            <Text color="gray.500">
              Gérez les documents liés aux réserves
                </Text>
              </Box>
          {isAdmin() && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="brand"
              onClick={() => {
                setSelectedDocument(null);
                onFormOpen();
              }}
            >
              Nouveau document
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
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
            </HStack>

        {/* Tableau des documents */}
        <Card shadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color="gray.500">Chargement des documents...</Text>
              </Box>
            ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Nom du fichier</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Type</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Réserve</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Projet associé</Th>
                      <Th px={4} py={3} fontWeight="semibold" color="gray.700">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                    {filteredDocuments.map((document, index) => (
                      <Tr 
                        key={document.id}
                        bg={index % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'gray.100' }}
                        transition="background-color 0.2s"
                      >
                        <Td px={4} py={3} fontWeight="medium">{document.nomFichier}</Td>
                        <Td px={4} py={3}>{getTypeBadge(document.typeFichier)}</Td>
                        <Td px={4} py={3}>{document.reserve?.nom || 'N/A'}</Td>
                        <Td px={4} py={3}>
                          {document.projet ? (
                            <Badge colorScheme="teal" variant="outline">
                              {document.projet.nomProjet}
                            </Badge>
                          ) : (
                            <Text color="gray.400" fontStyle="italic" fontSize="sm">Aucun</Text>
                          )}
                        </Td>
                      <Td px={4} py={3}>
                        <HStack spacing={2}>
                            {document.url ? (
                              <>
                                <IconButton
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="teal"
                                  onClick={() => {
                                    setSelectedDocument(document);
                                    onPreviewOpen();
                                  }}
                                  aria-label="Prévisualiser"
                                />
                                <IconButton
                                  icon={<FiDownload />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  onClick={() => window.open(document.url, '_blank')}
                                  aria-label="Télécharger"
                                />
                              </>
                            ) : null}
                            {isAdmin() && (
                              <>
                            <IconButton
                                  icon={<FiEdit />}
                              size="sm"
                              variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => {
                                    setSelectedDocument(document);
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
                                    setSelectedDocument(document);
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
      <DocumentForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        document={selectedDocument}
        onSuccess={fetchDocuments}
      />

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
          <ModalContent>
            <ModalHeader>Confirmer la suppression</ModalHeader>
            <ModalBody>
              <Text>
              Êtes-vous sûr de vouloir supprimer le document "{selectedDocument?.nomFichier}" ?
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

      {/* Modal de prévisualisation */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        document={selectedDocument}
      />
    </Box>
  );
};

export default Documents;








