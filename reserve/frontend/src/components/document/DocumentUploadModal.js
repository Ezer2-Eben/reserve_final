// src/components/document/DocumentUploadModal.js
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
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
    Text,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiFile, FiUpload } from 'react-icons/fi';

import { documentService } from '../../services/apiService';

const DocumentUploadModal = ({ isOpen, onClose, document, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('local'); // 'local' or 'external'
  const [externalUrl, setExternalUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadType === 'local' && !selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (uploadType === 'external' && !externalUrl) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une URL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      if (uploadType === 'local') {
        // Upload local
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('reserveId', document.reserve?.id || '');
        formData.append('nomFichier', selectedFile.name.replace(/\.[^/.]+$/, ''));

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

        await documentService.uploadFile(formData);
        
        clearInterval(progressInterval);
        setProgress(100);

        toast({
          title: 'Succès',
          description: 'Fichier uploadé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Document externe
        await documentService.createExternalDocument({
          nomFichier: document.nom || 'Document externe',
          typeFichier: 'AUTRE',
          url: externalUrl,
          reserveId: document.reserve?.id || ''
        });

        toast({
          title: 'Succès',
          description: 'Document externe créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: 'Erreur',
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
    setSelectedFile(null);
    setUploadType('local');
    setExternalUrl('');
    setProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiUpload} color="blue.500" />
            <Text>Uploader un fichier</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Informations sur le document */}
            {document ? <Box p={4} bg="blue.50" borderRadius="md">
                <Text fontWeight="semibold" color="blue.800">
                  Document : {document.nom}
                </Text>
                <Text fontSize="sm" color="blue.600">
                  Réserve : {document.reserve?.nom || 'Non assignée'}
                </Text>
              </Box> : null}

            {/* Type d'upload */}
            <Box>
              <Heading size="sm" mb={4}>Type d'upload</Heading>
              <HStack spacing={4}>
                <Button
                  leftIcon={<Icon as={FiFile} />}
                  colorScheme={uploadType === 'local' ? 'blue' : 'gray'}
                  variant={uploadType === 'local' ? 'solid' : 'outline'}
                  onClick={() => setUploadType('local')}
                >
                  Fichier local
                </Button>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  colorScheme={uploadType === 'external' ? 'blue' : 'gray'}
                  variant={uploadType === 'external' ? 'solid' : 'outline'}
                  onClick={() => setUploadType('external')}
                >
                  URL externe
                </Button>
              </HStack>
            </Box>

            {/* Upload local */}
            {uploadType === 'local' && (
              <FormControl isRequired>
                <FormLabel>Sélectionner un fichier</FormLabel>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar"
                />
                {selectedFile ? <Box mt={2} p={3} bg="green.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="semibold" color="green.700">
                      Fichier sélectionné : {selectedFile.name}
                    </Text>
                    <Text fontSize="xs" color="green.600">
                      Taille : {formatFileSize(selectedFile.size)}
                    </Text>
                  </Box> : null}
              </FormControl>
            )}

            {/* URL externe */}
            {uploadType === 'external' && (
              <FormControl isRequired>
                <FormLabel>URL du document</FormLabel>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  type="url"
                />
              </FormControl>
            )}

            {/* Informations */}
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Stockage hybride</AlertTitle>
                <AlertDescription>
                  {uploadType === 'local' 
                    ? 'Le fichier sera stocké localement sur le serveur'
                    : 'Le document sera référencé via une URL externe'
                  }
                </AlertDescription>
              </Box>
            </Alert>

            {/* Barre de progression */}
            {progress > 0 && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Upload en cours...
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
            loadingText="Upload en cours..."
            leftIcon={<Icon as={FiUpload} />}
          >
            Uploader
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentUploadModal; 