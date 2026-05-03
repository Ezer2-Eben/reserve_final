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
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
    FiDownload,
    FiEdit,
    FiPlus,
    FiSearch,
    FiTrash2
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { documentService, reserveService } from '../../services/apiService';

const DocumentForm = ({ isOpen, onClose, document = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    nomFichier: '',
    typeFichier: '',
    url: '',
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
    if (document) {
      setFormData({
        nomFichier: document.nomFichier || '',
        typeFichier: document.typeFichier || '',
        url: document.url || '',
        reserveId: document.reserve?.id || '',
      });
    } else {
      setFormData({
        nomFichier: '',
        typeFichier: '',
        url: '',
        reserveId: '',
      });
    }
  }, [document, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        reserve: { id: parseInt(formData.reserveId) }
      };

      if (document) {
        await documentService.update(document.id, submitData);
        toast({
          title: 'Document mis à jour',
          description: 'Le document a été mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await documentService.create(submitData);
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
              </HStack>

              <FormControl isRequired>
                <FormLabel>URL du fichier</FormLabel>
                <Input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com/document.pdf"
                  type="url"
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

  // Correction des hooks useDisclosure
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
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
      document.reserve?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <HStack spacing={2}>
                            {document.url ? <IconButton
                                icon={<FiDownload />}
                              size="sm"
                              variant="ghost"
                              colorScheme="green"
                                onClick={() => window.open(document.url, '_blank')}
                              aria-label="Télécharger"
                            /> : null}
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
    </Box>
  );
};

export default Documents;








