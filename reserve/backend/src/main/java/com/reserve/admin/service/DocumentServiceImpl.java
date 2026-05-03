package com.reserve.admin.service;

import com.reserve.admin.model.Document;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.DocumentRepository;
import com.reserve.admin.repository.ReserveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ReserveRepository reserveRepository;

    @Autowired
    private FileUploadService fileUploadService;

    @Value("${app.upload.path:uploads}")
    private String uploadPath;

    @Override
    public Document saveDocument(Document document) {
        return documentRepository.save(document);
    }

    @Override
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    @Override
    public Optional<Document> getDocumentById(Long id) {
        return documentRepository.findById(id);
    }

    @Override
    public Document updateDocument(Long id, Document document) {
        return documentRepository.findById(id).map(existing -> {
            // Si c'est un fichier local, supprimer l'ancien fichier
            if (existing.isFichierLocal()) {
                try {
                    fileUploadService.deleteFile(existing);
                } catch (IOException e) {
                    // Log l'erreur mais continuer
                    System.err.println("Erreur lors de la suppression de l'ancien fichier: " + e.getMessage());
                }
            }

            // Mettre à jour les champs
            existing.setNomFichier(document.getNomFichier());
            existing.setNomFichierOriginal(document.getNomFichierOriginal());
            existing.setTypeFichier(document.getTypeFichier());
            existing.setTailleFichier(document.getTailleFichier());
            existing.setHashFichier(document.getHashFichier());
            existing.setUrl(document.getUrl());
            existing.setCheminFichier(document.getCheminFichier());
            existing.setReserve(document.getReserve());
            
            return documentRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Document non trouvé avec l'id " + id));
    }

    @Override
    public void deleteDocument(Long id) {
        documentRepository.findById(id).ifPresent(document -> {
            // Si c'est un fichier local, le supprimer du système de fichiers
            if (document.isFichierLocal()) {
                try {
                    fileUploadService.deleteFile(document);
                } catch (IOException e) {
                    // Log l'erreur mais continuer
                    System.err.println("Erreur lors de la suppression du fichier: " + e.getMessage());
                }
            }
            documentRepository.deleteById(id);
        });
    }

    /**
     * Upload un fichier et créer un document
     */
    public Document uploadFile(MultipartFile file, Long reserveId, String nomFichier) throws IOException {
        // Récupérer la réserve
        Reserve reserve = reserveRepository.findById(reserveId)
            .orElseThrow(() -> new RuntimeException("Réserve non trouvée avec l'id " + reserveId));

        // Upload le fichier et créer le document
        Document document = fileUploadService.uploadFile(file, reserve, nomFichier);
        
        // Sauvegarder en base de données
        return documentRepository.save(document);
    }

    /**
     * Upload un fichier avec nom automatique basé sur le nom original
     */
    public Document uploadFile(MultipartFile file, Long reserveId) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String nomFichier = originalFilename != null ? 
            originalFilename.substring(0, originalFilename.lastIndexOf('.')) : "Document";
        
        return uploadFile(file, reserveId, nomFichier);
    }

    /**
     * Télécharger un fichier
     */
    public byte[] downloadFile(Long documentId) throws IOException {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document non trouvé avec l'id " + documentId));

        if (document.isFichierLocal()) {
            java.nio.file.Path filePath = fileUploadService.getFilePath(document);
            if (filePath != null && java.nio.file.Files.exists(filePath)) {
                return java.nio.file.Files.readAllBytes(filePath);
            } else {
                throw new IOException("Fichier non trouvé sur le serveur");
            }
        } else if (document.isFichierExterne()) {
            // Pour les fichiers externes, retourner une erreur ou rediriger
            throw new IOException("Fichier externe - téléchargement non supporté");
        } else {
            throw new IOException("Aucun fichier associé à ce document");
        }
    }

    /**
     * Vérifier si un fichier existe
     */
    public boolean fileExists(Long documentId) {
        Optional<Document> document = documentRepository.findById(documentId);
        return document.map(fileUploadService::fileExists).orElse(false);
    }

    /**
     * Obtenir les informations sur les types de fichiers autorisés
     */
    public FileUploadInfo getUploadInfo() {
        return new FileUploadInfo(
            fileUploadService.getAllowedTypes(),
            fileUploadService.getMaxFileSize()
        );
    }

    /**
     * Importer des documents depuis un dossier local
     */
    public List<Document> importFromFolder(String folderPath, Long reserveId, boolean recursive) throws IOException {
        // Récupérer la réserve
        Reserve reserve = reserveRepository.findById(reserveId)
            .orElseThrow(() -> new RuntimeException("Réserve non trouvée avec l'id " + reserveId));

        // Vérifier que le dossier existe
        java.nio.file.Path folder = java.nio.file.Paths.get(folderPath);
        if (!java.nio.file.Files.exists(folder)) {
            throw new IllegalArgumentException("Le dossier n'existe pas: " + folderPath);
        }
        if (!java.nio.file.Files.isDirectory(folder)) {
            throw new IllegalArgumentException("Le chemin ne correspond pas à un dossier: " + folderPath);
        }

        List<Document> importedDocuments = new ArrayList<>();
        
        // Parcourir les fichiers du dossier
        try (var stream = java.nio.file.Files.walk(folder, recursive ? Integer.MAX_VALUE : 1)) {
            stream.filter(java.nio.file.Files::isRegularFile)
                .forEach(filePath -> {
                    try {
                        // Vérifier si c'est un type de fichier autorisé
                        String fileName = filePath.getFileName().toString();
                        String extension = getFileExtension(fileName);
                        
                        if (isAllowedFileType(extension)) {
                            // Créer le document
                            Document document = createDocumentFromFile(filePath, reserve);
                            Document savedDocument = documentRepository.save(document);
                            importedDocuments.add(savedDocument);
                        }
                    } catch (IOException e) {
                        System.err.println("Erreur lors de l'import du fichier " + filePath + ": " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("Erreur inattendue lors de l'import du fichier " + filePath + ": " + e.getMessage());
                    }
                });
        } catch (IOException e) {
            throw new IOException("Erreur lors du parcours du dossier: " + e.getMessage(), e);
        }

        return importedDocuments;
    }

    /**
     * Obtenir la liste des dossiers disponibles pour l'import
     */
    public List<String> getAvailableFolders() {
        List<String> folders = new ArrayList<>();
        
        // Ajouter des dossiers par défaut selon le système d'exploitation
        String userHome = System.getProperty("user.home");
        String os = System.getProperty("os.name").toLowerCase();
        
        if (os.contains("win")) {
            // Windows
            folders.add(userHome + "\\Documents");
            folders.add(userHome + "\\Desktop");
            folders.add(userHome + "\\Downloads");
            folders.add("C:\\Users\\Public\\Documents");
        } else {
            // Linux/Mac
            folders.add(userHome + "/Documents");
            folders.add(userHome + "/Desktop");
            folders.add(userHome + "/Downloads");
            folders.add("/tmp");
        }
        
        // Ajouter le dossier d'upload de l'application
        folders.add(uploadPath);
        
        return folders;
    }

    /**
     * Créer un document à partir d'un fichier existant
     */
    private Document createDocumentFromFile(java.nio.file.Path filePath, Reserve reserve) throws IOException {
        String fileName = filePath.getFileName().toString();
        String extension = getFileExtension(fileName);
        String nomFichier = fileName.substring(0, fileName.lastIndexOf('.'));
        
        // Copier le fichier vers le dossier d'upload
        String uniqueFilename = generateUniqueFilename(extension);
        String relativePath = createStoragePath(reserve, uniqueFilename);
        java.nio.file.Path targetPath = java.nio.file.Paths.get(uploadPath, relativePath);
        
        // Créer les dossiers si nécessaire
        java.nio.file.Files.createDirectories(targetPath.getParent());
        
        // Copier le fichier
        java.nio.file.Files.copy(filePath, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        
        // Calculer le hash
        String fileHash = calculateFileHash(targetPath);
        
        // Créer le document
        Document document = new Document();
        document.setNomFichier(nomFichier);
        document.setNomFichierOriginal(fileName);
        document.setTypeFichier(getFileType(extension));
        document.setTailleFichier(java.nio.file.Files.size(filePath));
        document.setHashFichier(fileHash);
        document.setCheminFichier(relativePath);
        document.setReserve(reserve);
        document.setDateUpload(LocalDateTime.now());
        
        return document;
    }

    /**
     * Vérifier si un type de fichier est autorisé
     */
    private boolean isAllowedFileType(String extension) {
        List<String> allowedExtensions = Arrays.asList(
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".jpg", ".jpeg", ".png", ".gif",
            ".mp4", ".avi", ".mov",
            ".mp3", ".wav",
            ".zip", ".rar"
        );
        return allowedExtensions.contains(extension.toLowerCase());
    }

    /**
     * Obtenir l'extension d'un fichier
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
    }

    /**
     * Déterminer le type de fichier basé sur l'extension
     */
    private String getFileType(String extension) {
        String ext = extension.toLowerCase();
        
        if (ext.equals(".pdf")) return "PDF";
        if (ext.equals(".doc") || ext.equals(".docx")) return "DOC";
        if (ext.equals(".xls") || ext.equals(".xlsx")) return "XLS";
        if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".gif")) return "IMG";
        if (ext.equals(".mp4") || ext.equals(".avi") || ext.equals(".mov")) return "VIDEO";
        if (ext.equals(".mp3") || ext.equals(".wav")) return "AUDIO";
        if (ext.equals(".zip") || ext.equals(".rar")) return "ZIP";
        
        return "AUTRE";
    }

    /**
     * Générer un nom de fichier unique
     */
    private String generateUniqueFilename(String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + extension;
    }

    /**
     * Créer le chemin de stockage
     */
    private String createStoragePath(Reserve reserve, String filename) {
        LocalDateTime now = LocalDateTime.now();
        String year = String.valueOf(now.getYear());
        String month = String.format("%02d", now.getMonthValue());
        
        if (reserve != null) {
            return String.format("documents/%s/%s/reserves/%d/%s", 
                year, month, reserve.getId(), filename);
        } else {
            return String.format("documents/%s/%s/%s", year, month, filename);
        }
    }

    /**
     * Calculer le hash SHA-256 d'un fichier
     */
    private String calculateFileHash(java.nio.file.Path filePath) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(java.nio.file.Files.readAllBytes(filePath));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur lors du calcul du hash", e);
        }
    }

    /**
     * Classe pour les informations d'upload
     */
    public static class FileUploadInfo {
        private final List<String> allowedTypes;
        private final long maxFileSize;

        public FileUploadInfo(List<String> allowedTypes, long maxFileSize) {
            this.allowedTypes = allowedTypes;
            this.maxFileSize = maxFileSize;
        }

        public List<String> getAllowedTypes() {
            return allowedTypes;
        }

        public long getMaxFileSize() {
            return maxFileSize;
        }

        public String getMaxFileSizeFormatted() {
            return formatFileSize(maxFileSize);
        }

        private String formatFileSize(long bytes) {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
            if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
            return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
        }
    }
}
