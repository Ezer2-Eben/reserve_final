// src/components/document/DocumentImportModal.js
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Icon,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Progress,
    Select,
    Text,
    useToast,
    VStack
} from '@chakra-ui/react';
import { FiFile, FiFolder, FiUpload } from 'react-icons/fi';

import { getAvailableFolders, importFromFolder } from '../../api/document';
import { reserveService } from '../../services/apiService';

const DocumentImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [customFolderPath, setCustomFolderPath] = useState('');
  const [reserveId, setReserveId] = useState('');
  const [recursive, setRecursive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [importMode, setImportMode] = useState('preset'); // 'preset' or 'custom'
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foldersData, reservesData] = await Promise.all([
          getAvailableFolders(),
          reserveService.getAll()
        ]);
        setAvailableFolders(foldersData.folders || []);
        setReserves(reservesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les dossiers disponibles',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchData();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reserveId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une réserve',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const folderPath = importMode === 'preset' ? selectedFolder : customFolderPath;
    if (!folderPath) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner ou saisir un chemin de dossier',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await importFromFolder(folderPath, reserveId, recursive);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: 'Import réussi',
        description: `${result.count} documents importés avec succès`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: 'Erreur lors de l\'import',
        description: error.response?.data?.error || 'Une erreur est survenue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedFolder('');
    setCustomFolderPath('');
    setReserveId('');
    setRecursive(false);
    setImportMode('preset');
    setProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiFolder} color="blue.500" />
            <Text>Importer depuis l'explorateur</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Mode d'import */}
            <Box>
              <Heading size="md" mb={4}>Mode d'import</Heading>
              <HStack spacing={4}>
                <Button
                  leftIcon={<Icon as={FiFile} />}
                  colorScheme={importMode === 'preset' ? 'blue' : 'gray'}
                  variant={importMode === 'preset' ? 'solid' : 'outline'}
                  onClick={() => setImportMode('preset')}
                >
                  Dossiers prédéfinis
                </Button>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  colorScheme={importMode === 'custom' ? 'blue' : 'gray'}
                  variant={importMode === 'custom' ? 'solid' : 'outline'}
                  onClick={() => setImportMode('custom')}
                >
                  Chemin personnalisé
                </Button>
              </HStack>
            </Box>

            {/* Sélection de la réserve */}
            <FormControl isRequired>
              <FormLabel>Réserve</FormLabel>
              <Select
                value={reserveId}
                onChange={(e) => setReserveId(e.target.value)}
                placeholder="Sélectionner une réserve"
              >
                {reserves.map((reserve) => (
                  <option key={reserve.id} value={reserve.id}>
                    {reserve.nom}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Sélection du dossier */}
            {importMode === 'preset' ? (
              <FormControl isRequired>
                <FormLabel>Dossier source</FormLabel>
                <Select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  placeholder="Sélectionner un dossier"
                >
                  {availableFolders.map((folder, index) => (
                    <option key={index} value={folder}>
                      {folder}
                    </option>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl isRequired>
                <FormLabel>Chemin du dossier</FormLabel>
                <Input
                  value={customFolderPath}
                  onChange={(e) => setCustomFolderPath(e.target.value)}
                  placeholder="C:\Documents\MesDocuments ou /home/user/documents"
                />
              </FormControl>
            )}

            {/* Options */}
            <FormControl>
              <FormLabel>Options</FormLabel>
              <Checkbox
                isChecked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
              >
                Importer récursivement (sous-dossiers inclus)
              </Checkbox>
            </FormControl>

            {/* Informations */}
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Import depuis l'explorateur</AlertTitle>
                <AlertDescription>
                  Cette fonctionnalité permet d'importer tous les documents d'un dossier 
                  vers la base de données. Seuls les types de fichiers autorisés seront importés.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Types de fichiers supportés */}
            <Box>
              <Text fontWeight="semibold" mb={2}>Types de fichiers supportés :</Text>
              <Text fontSize="sm" color="gray.600">
                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, MP4, AVI, MOV, MP3, WAV, ZIP, RAR
              </Text>
            </Box>

            {/* Barre de progression */}
            {progress > 0 && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Import en cours...
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {progress}%
                  </Text>
                </HStack>
                <Progress value={progress} colorScheme="blue" size="sm" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Annuler
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Import en cours..."
            leftIcon={<Icon as={FiUpload} />}
          >
            Importer les documents
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentImportModal; 