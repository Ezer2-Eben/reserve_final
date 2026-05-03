// src/components/document/DocumentForm.js
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    FormControl,
    FormLabel,
    Icon,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiFile, FiUpload, FiX } from 'react-icons/fi';

import { documentService, reserveService } from '../../services/apiService';

const DocumentForm = ({ isOpen, onClose, document = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    nomFichier: '',
    reserveId: '',
  });
  const [externalFormData, setExternalFormData] = useState({
    nomFichier: '',
    typeFichier: '',
    reserveId: '',
    selectedFile: null,
  });
  const [reserves, setReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // Charger les réserves et les infos d'upload
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservesData, uploadInfoData] = await Promise.all([
          reserveService.getAll(),
          documentService.getUploadInfo()
        ]);
        setReserves(reservesData);
        setUploadInfo(uploadInfoData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    fetchData();
  }, []);

  // Configuration du dropzone
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      toast({
        title: 'Fichier rejeté',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        nomFichier: file.name.replace(/\.[^/.]+$/, '') // Nom sans extension
      }));
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov'],
      'audio/*': ['.mp3', '.wav'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: uploadInfo?.maxFileSize || 10485760, // 10MB par défaut
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === 0) {
        // Upload local
        if (!selectedFile) {
          toast({
            title: 'Erreur',
            description: 'Veuillez sélectionner un fichier',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        formDataToSend.append('reserveId', formData.reserveId);
        formDataToSend.append('nomFichier', formData.nomFichier);

        await documentService.uploadFile(formDataToSend);
        
        toast({
          title: 'Succès',
          description: 'Document uploadé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Document local
        if (!externalFormData.selectedFile || !externalFormData.nomFichier || !externalFormData.reserveId) {
          toast({
            title: 'Erreur',
            description: 'Veuillez sélectionner un fichier et remplir tous les champs',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Pour les fichiers locaux, on utilise l'upload normal
        const formDataToSend = new FormData();
        formDataToSend.append('file', externalFormData.selectedFile);
        formDataToSend.append('reserveId', externalFormData.reserveId);
        formDataToSend.append('nomFichier', externalFormData.nomFichier);

        await documentService.uploadFile(formDataToSend);

        toast({
          title: 'Succès',
          description: 'Document local uploadé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.error || 'Une erreur est survenue',
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

  const handleExternalChange = (e) => {
    const { name, value } = e.target;
    setExternalFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      nomFichier: '',
      reserveId: '',
    });
    setExternalFormData({
      nomFichier: '',
      typeFichier: '',
      reserveId: '',
      selectedFile: null,
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setActiveTab(0);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      nomFichier: ''
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎥';
      case 'mp3':
      case 'wav': return '🎵';
      case 'zip':
      case 'rar': return '📦';
      default: return '📄';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ajouter un document</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>
                <Icon as={FiFile} mr={2} />
                Upload Local
              </Tab>
                             <Tab>
                 <Icon as={FiFile} mr={2} />
                 Fichier Local
               </Tab>
            </TabList>

            <TabPanels>
              {/* Onglet Upload Local */}
              <TabPanel>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Réserve</FormLabel>
                    <Select
                      name="reserveId"
                      value={formData.reserveId}
                      onChange={handleChange}
                      placeholder="Sélectionner une réserve"
                    >
                      {reserves.map((reserve) => (
                        <option key={reserve.id} value={reserve.id}>
                          {reserve.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Nom du document</FormLabel>
                    <Input
                      name="nomFichier"
                      value={formData.nomFichier}
                      onChange={handleChange}
                      placeholder="Nom du document"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Fichier</FormLabel>
                    <Box
                      {...getRootProps()}
                      border="2px dashed"
                      borderColor={isDragActive ? "blue.400" : "gray.300"}
                      borderRadius="md"
                      p={6}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ borderColor: "blue.400" }}
                    >
                      <input {...getInputProps()} />
                      {selectedFile ? (
                        <VStack spacing={3}>
                          <Text fontSize="2xl">{getFileIcon(selectedFile.type)}</Text>
                          <Text fontWeight="bold">{selectedFile.name}</Text>
                          <Text color="gray.600">{formatFileSize(selectedFile.size)}</Text>
                          <Button size="sm" colorScheme="red" onClick={removeFile}>
                            <Icon as={FiX} mr={2} />
                            Supprimer
                          </Button>
                        </VStack>
                      ) : (
                        <VStack spacing={3}>
                          <Icon as={FiUpload} boxSize={8} color="gray.400" />
                          <Text>
                            Glissez-déposez un fichier ici, ou cliquez pour sélectionner
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Types autorisés: PDF, DOC, XLS, Images, Vidéos, Audio, ZIP
                          </Text>
                          {uploadInfo ? <Text fontSize="xs" color="gray.400">
                              Taille max: {uploadInfo.maxFileSizeFormatted}
                            </Text> : null}
                        </VStack>
                      )}
                    </Box>
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Onglet URL Externe */}
              <TabPanel>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Réserve</FormLabel>
                    <Select
                      name="reserveId"
                      value={externalFormData.reserveId}
                      onChange={handleExternalChange}
                      placeholder="Sélectionner une réserve"
                    >
                      {reserves.map((reserve) => (
                        <option key={reserve.id} value={reserve.id}>
                          {reserve.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Nom du document</FormLabel>
                    <Input
                      name="nomFichier"
                      value={externalFormData.nomFichier}
                      onChange={handleExternalChange}
                      placeholder="Nom du document"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type de fichier</FormLabel>
                    <Select
                      name="typeFichier"
                      value={externalFormData.typeFichier}
                      onChange={handleExternalChange}
                      placeholder="Sélectionner le type"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOC">Document Word</option>
                      <option value="XLS">Document Excel</option>
                      <option value="IMG">Image</option>
                      <option value="VIDEO">Vidéo</option>
                      <option value="AUDIO">Audio</option>
                      <option value="ZIP">Archive</option>
                      <option value="AUTRE">Autre</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Fichier local</FormLabel>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Mettre à jour le nom du fichier automatiquement
                          const fileName = file.name.replace(/\.[^/.]+$/, '');
                          setExternalFormData(prev => ({
                            ...prev,
                            nomFichier: fileName,
                            selectedFile: file
                          }));
                        }
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar"
                    />
                    {externalFormData.selectedFile ? <Box mt={2} p={3} bg="green.50" borderRadius="md">
                        <Text fontSize="sm" fontWeight="semibold" color="green.700">
                          Fichier sélectionné : {externalFormData.selectedFile.name}
                        </Text>
                        <Text fontSize="xs" color="green.600">
                          Taille : {formatFileSize(externalFormData.selectedFile.size)}
                        </Text>
                      </Box> : null}
                  </FormControl>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Document local</AlertTitle>
                      <AlertDescription>
                        Cette option permet de sélectionner un fichier depuis votre ordinateur 
                        et de le référencer dans la base de données sans l'uploader.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText="Enregistrement..."
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentForm;
