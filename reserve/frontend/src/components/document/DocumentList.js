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
import { Download, Edit, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FiLink, FiUpload } from 'react-icons/fi';
import { deleteDocument, getAllDocuments, migrateToExternal } from '../../api/document';


import DocumentImportModal from './DocumentImportModal';
import DocumentUploadModal from './DocumentUploadModal';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocumentForUpload, setSelectedDocumentForUpload] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllDocuments();
        // Gérer différents formats de réponse
        let documentsData = [];
        if (Array.isArray(data)) {
          documentsData = data;
        } else if (data && Array.isArray(data.documents)) {
          documentsData = data.documents;
        } else if (data && data.content && Array.isArray(data.content)) {
          documentsData = data.content;
        } else {
          console.warn('Format de données inattendu:', data);
          documentsData = [];
        }
        setDocuments(documentsData);
      } catch (error) {
        console.error('Erreur lors du chargement des documents :', error);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          // Mode démonstration avec des données fictives
          setDocuments([
            {
              id: 1,
              nom: 'Plan de gestion 2024',
              type: 'Plan de gestion',
              taille: '2.5 MB',
              dateCreation: '2024-01-15',
              auteur: 'Dr. Kossi Adama',
              statut: 'Approuvé',
              description: 'Plan de gestion annuel de la réserve'
            },
            {
              id: 2,
              nom: 'Rapport d\'inventaire faunique',
              type: 'Rapport scientifique',
              taille: '1.8 MB',
              dateCreation: '2024-02-20',
              auteur: 'Mme. Fatou Diallo',
              statut: 'En révision',
              description: 'Inventaire complet de la faune sauvage'
            },
            {
              id: 3,
              nom: 'Étude d\'impact environnemental',
              type: 'Étude',
              taille: '5.2 MB',
              dateCreation: '2024-03-10',
              auteur: 'M. Jean-Pierre Koffi',
              statut: 'Brouillon',
              description: 'Évaluation des impacts du projet écotouristique'
            },
            {
              id: 4,
              nom: 'Règlement intérieur',
              type: 'Document administratif',
              taille: '0.8 MB',
              dateCreation: '2024-01-05',
              auteur: 'Direction générale',
              statut: 'Approuvé',
              description: 'Règlement intérieur de la réserve'
            }
          ]);
          setError('Mode démonstration - Données fictives affichées (serveur backend non disponible)');
        } else {
          setError('Impossible de charger les documents. Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'approuvé':
      case 'approved':
        return 'green';
      case 'en révision':
      case 'en cours':
      case 'pending':
        return 'yellow';
      case 'rejeté':
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'red';
      case 'doc':
      case 'docx':
        return 'blue';
      case 'xls':
      case 'xlsx':
        return 'green';
      case 'img':
      case 'image':
        return 'purple';
      case 'video':
        return 'orange';
      case 'audio':
        return 'pink';
      case 'zip':
      case 'rar':
        return 'teal';
      default:
        return 'gray';
    }
  };

  const getStorageTypeBadge = (document) => {
    if (document.cheminFichier) {
      return <Badge colorScheme="blue" size="sm">Local</Badge>;
    } else if (document.url) {
      return <Badge colorScheme="green" size="sm">Externe</Badge>;
    } else {
      return <Badge colorScheme="gray" size="sm">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setIsViewModalOpen(true);
  };

  const handleDeleteDocument = (document) => {
    setSelectedDocument(document);
    setIsDeleteModalOpen(true);
  };

  const handleDownload = (document) => {
    // Vérifier si c'est un fichier local ou externe
    if (document.cheminFichier) {
      // Fichier local - télécharger via l'API
      window.open(`http://localhost:9190/api/documents/${document.id}/download`, '_blank');
    } else if (document.url) {
      // Fichier externe - ouvrir l'URL
      window.open(document.url, '_blank');
    } else {
      toast({
        title: 'Erreur',
        description: 'Aucun fichier associé à ce document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMigrateToExternal = async (document) => {
    const url = prompt('Entrez l\'URL du document externe:');
    if (!url) return;

    try {
      await migrateToExternal(document.id, url);
      toast({
        title: 'Succès',
        description: 'Document migré vers externe avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
            fetchData();();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Erreur lors de la migration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUploadFile = (document) => {
    setSelectedDocumentForUpload(document);
    setIsUploadModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      await deleteDocument(selectedDocument.id);
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès.',
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
        description: 'Impossible de supprimer le document.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Chargement des documents...</Text>
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
                Gestion des Documents
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Gérez et organisez tous les documents de la réserve
              </Text>
            </Box>
            <HStack spacing={3}>
              <Badge colorScheme="teal" variant="subtle" px={3} py={1}>
                Système de gestion
              </Badge>
              <Button
                leftIcon={<Icon as={Upload} />}
                colorScheme="teal"
                size="md"
                onClick={() => setIsImportModalOpen(true)}
              >
                Importer depuis l'explorateur
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
              <StatNumber color="blue.600">{documents.length}</StatNumber>
              <StatLabel>Total des documents</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="green.600">
                {documents.filter(d => d.statut?.toLowerCase() === 'approuvé').length}
              </StatNumber>
              <StatLabel>Approuvés</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="yellow.600">
                {documents.filter(d => d.statut?.toLowerCase() === 'en révision').length}
              </StatNumber>
              <StatLabel>En révision</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody>
            <Stat>
              <StatNumber color="purple.600">
                {documents.filter(d => d.type?.toLowerCase() === 'rapport scientifique').length}
              </StatNumber>
              <StatLabel>Rapports scientifiques</StatLabel>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Alerte mode démonstration */}
      {error && error.includes('Mode démonstration') ? <Alert status="info" borderRadius="md">
          <AlertIcon /> {error}
        </Alert> : null}

      {/* Tableau des documents */}
      <Card shadow="sm" bg="white">
        <CardHeader bg="teal.50" borderBottom="1px" borderColor="teal.200">
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FileText} color="teal.500" />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="teal.800">
                  Liste des Documents
                </Text>
                <Text fontSize="sm" color="teal.600">
                  Tous les documents enregistrés dans la base de données
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
                    <Th px={4} py={3}>Nom du document</Th>
                    <Th px={4} py={3}>Type</Th>
                    <Th px={4} py={3}>Stockage</Th>
                    <Th px={4} py={3}>Taille</Th>
                    <Th px={4} py={3}>Date de création</Th>
                    <Th px={4} py={3}>Auteur</Th>
                    <Th px={4} py={3}>Statut</Th>
                    <Th px={4} py={3}>Actions</Th>
                  </Tr>
              </Thead>
              <Tbody>
                {documents.map((document) => (
                  <Tr key={document.id} _hover={{ bg: 'gray.50' }}>
                    <Td px={4} py={3} fontWeight="semibold">
                      #{document.id}
                    </Td>
                    <Td px={4} py={3}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color="gray.800">
                          {document.nom}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {document.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getTypeColor(document.type)} variant="subtle">
                        {document.type}
                      </Badge>
                    </Td>
                    <Td px={4} py={3}>
                      {getStorageTypeBadge(document)}
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {document.taille}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {formatDate(document.dateCreation)}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {document.auteur}
                      </Text>
                    </Td>
                    <Td px={4} py={3}>
                      <Badge colorScheme={getStatusColor(document.statut)} variant="solid">
                        {document.statut}
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
                            onClick={() => handleViewDocument(document)}
                          />
                        </Tooltip>
                        <Tooltip label="Télécharger">
                          <IconButton
                            icon={<Icon as={Download} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            aria-label="Télécharger"
                            onClick={() => handleDownload(document)}
                          />
                        </Tooltip>
                        <Tooltip label="Uploader un fichier">
                          <IconButton
                            icon={<Icon as={FiUpload} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="Uploader un fichier"
                            onClick={() => handleUploadFile(document)}
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
                        {document.cheminFichier ? <Tooltip label="Migrer vers externe">
                            <IconButton
                              icon={<Icon as={FiLink} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="purple"
                              aria-label="Migrer vers externe"
                              onClick={() => handleMigrateToExternal(document)}
                            />
                          </Tooltip> : null}
                        <Tooltip label="Supprimer">
                          <IconButton
                            icon={<Icon as={Trash2} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Supprimer"
                            onClick={() => handleDeleteDocument(document)}
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
          <ModalHeader>Détails du document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDocument ? <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color="gray.700">Nom du document:</Text>
                  <Text>{selectedDocument.nom}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Description:</Text>
                  <Text>{selectedDocument.description}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Type:</Text>
                  <Badge colorScheme={getTypeColor(selectedDocument.type)}>
                    {selectedDocument.type}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Taille:</Text>
                  <Text>{selectedDocument.taille}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Date de création:</Text>
                  <Text>{formatDate(selectedDocument.dateCreation)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Auteur:</Text>
                  <Text>{selectedDocument.auteur}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" color="gray.700">Statut:</Text>
                  <Badge colorScheme={getStatusColor(selectedDocument.statut)}>
                    {selectedDocument.statut}
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
              Êtes-vous sûr de vouloir supprimer le document "{selectedDocument?.nom}" ?
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

      {/* Modal d'import */}
      <DocumentImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={      fetchData();}
      />

      {/* Modal d'upload */}
      <DocumentUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        document={selectedDocumentForUpload}
        onSuccess={      fetchData();}
      />
    </VStack>
  );
};

export default DocumentList;
