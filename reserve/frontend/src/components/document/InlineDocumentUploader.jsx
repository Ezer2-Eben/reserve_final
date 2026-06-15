// src/components/document/InlineDocumentUploader.jsx
// Composant réutilisable pour joindre des documents lors de la création d'éléments
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { FiFile, FiPaperclip, FiUpload, FiX } from 'react-icons/fi';

const DOCUMENT_CATEGORIES = [
  { value: 'TITRE_FONCIER', label: 'Titre foncier' },
  { value: 'ACTE_NOTARIE', label: 'Acte notarié' },
  { value: 'DECISION_ADMINISTRATIVE', label: 'Décision administrative' },
  { value: 'PLAN_PARCELLAIRE', label: 'Plan parcellaire' },
  { value: 'RAPPORT_EXPERTISE', label: "Rapport d'expertise" },
  { value: 'CORRESPONDANCE', label: 'Correspondance' },
  { value: 'RAPPORT_INSPECTION', label: 'Rapport d\'inspection' },
  { value: 'ACTE_DONATION', label: 'Acte de donation' },
  { value: 'PHOTO', label: 'Photo / Image' },
  { value: 'AUTRE', label: 'Autre' },
];

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * InlineDocumentUploader
 *
 * Props :
 * - reserveId (number) : ID de la réserve à associer — requis
 * - entityLabel (string) : Libellé de l'entité (ex: "ce litige", "cette alerte")
 * - onFilesChange (function) : callback appelé avec la liste { file, categorie }[] à chaque changement
 *
 * Usage : intégrer dans n'importe quel formulaire. Les fichiers ne sont PAS uploadés ici.
 * C'est le composant parent qui appelle uploadPendingFiles() après la création de l'entité.
 */
const InlineDocumentUploader = ({ reserveId: _reserveId, entityLabel = 'cet élément', onFilesChange }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newEntries = files.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      categorie: 'AUTRE',
    }));
    const updated = [...pendingFiles, ...newEntries];
    setPendingFiles(updated);
    onFilesChange && onFilesChange(updated);
    // Reset input so same file can be re-added if needed
    e.target.value = '';
  };

  const handleCategorieChange = (id, categorie) => {
    const updated = pendingFiles.map((pf) => (pf.id === id ? { ...pf, categorie } : pf));
    setPendingFiles(updated);
    onFilesChange && onFilesChange(updated);
  };

  const handleRemove = (id) => {
    const updated = pendingFiles.filter((pf) => pf.id !== id);
    setPendingFiles(updated);
    onFilesChange && onFilesChange(updated);
  };

  return (
    <Box
      border="1px dashed"
      borderColor="brand.200"
      borderRadius="lg"
      p={4}
      bg="brand.50"
      _dark={{ bg: 'gray.700', borderColor: 'brand.600' }}
    >
      <HStack mb={3} justify="space-between">
        <HStack spacing={2}>
          <Icon as={FiPaperclip} color="brand.500" />
          <Text fontWeight="semibold" fontSize="sm" color="gray.700">
            Documents joints
          </Text>
          {pendingFiles.length > 0 && (
            <Badge colorScheme="brand" borderRadius="full">
              {pendingFiles.length}
            </Badge>
          )}
        </HStack>
        <Button
          size="xs"
          leftIcon={<FiUpload />}
          colorScheme="brand"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Ajouter un fichier
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip"
          display="none"
          onChange={handleFileSelect}
        />
      </HStack>

      {pendingFiles.length === 0 ? (
        <Text fontSize="xs" color="gray.400" textAlign="center" py={2}>
          Aucun document joint pour {entityLabel}. Cliquez sur "Ajouter un fichier" pour en joindre.
        </Text>
      ) : (
        <VStack spacing={2} align="stretch">
          {pendingFiles.map((pf) => (
            <Flex
              key={pf.id}
              align="center"
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderRadius="md"
              p={2}
              shadow="sm"
              gap={2}
              flexWrap="wrap"
            >
              <Icon as={FiFile} color="gray.400" flexShrink={0} />
              <Box flex="1" minW="120px">
                <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                  {pf.file.name}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {formatBytes(pf.file.size)}
                </Text>
              </Box>
              <Select
                size="xs"
                value={pf.categorie}
                onChange={(e) => handleCategorieChange(pf.id, e.target.value)}
                w="160px"
                flexShrink={0}
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <IconButton
                size="xs"
                icon={<FiX />}
                variant="ghost"
                colorScheme="red"
                aria-label="Retirer"
                onClick={() => handleRemove(pf.id)}
                flexShrink={0}
              />
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};

/**
 * Fonction utilitaire pour uploader les fichiers en attente après la création d'une entité.
 * À appeler dans le parent après avoir créé l'entité et obtenu son reserveId.
 *
 * @param {Array} pendingFiles - Liste { file, categorie }[]
 * @param {number} reserveId - ID de la réserve à associer
 * @param {Function} uploadFileFn - documentService.uploadFile
 * @param {number|null} projetId - (optionnel) ID du projet à associer
 * @param {Function} onProgress - (optionnel) Callback pour la progression globale
 * @returns {Promise<void>}
 */
export const uploadPendingDocuments = async (pendingFiles, reserveId, uploadFileFn, projetId = null, onProgress = null) => {
  if (!pendingFiles || pendingFiles.length === 0) {
    if (onProgress) onProgress(100);
    return;
  }
  
  const totalFiles = pendingFiles.length;
  let completedFiles = 0;

  for (const pf of pendingFiles) {
    const formData = new FormData();
    formData.append('file', pf.file);
    formData.append('reserveId', reserveId);
    formData.append('categorie', pf.categorie);
    if (projetId) {
      formData.append('projetId', projetId);
    }
    
    try {
      // Simulation de progression par fichier (si on veut être très précis, 
      // il faudrait hooker axios.onUploadProgress, mais ici on simule par palier ou on attend)
      if (onProgress) {
         let currentFileProgress = 0;
         const interval = setInterval(() => {
            currentFileProgress += 10;
            if (currentFileProgress > 90) currentFileProgress = 90;
            const overallProgress = ((completedFiles * 100) + currentFileProgress) / totalFiles;
            onProgress(Math.round(overallProgress));
         }, 200);
         
         await uploadFileFn(formData);
         
         clearInterval(interval);
      } else {
         await uploadFileFn(formData);
      }
      
      completedFiles++;
      if (onProgress) {
        onProgress(Math.round((completedFiles * 100) / totalFiles));
      }
    } catch (err) {
      console.error('Erreur upload document:', err);
      // Même en cas d'erreur, on avance le compteur pour ne pas bloquer la barre
      completedFiles++;
      if (onProgress) onProgress(Math.round((completedFiles * 100) / totalFiles));
    }
  }
};

export default InlineDocumentUploader;
