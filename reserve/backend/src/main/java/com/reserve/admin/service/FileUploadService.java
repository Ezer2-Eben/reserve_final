package com.reserve.admin.service;

import com.reserve.admin.model.Document;
import com.reserve.admin.model.Reserve;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${app.upload.path:uploads}")
    private String uploadPath;

    @Value("${app.upload.max-size:10485760}") // 10MB par défaut
    private long maxFileSize;

    // Types de fichiers autorisés
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "PDF", "DOC", "DOCX", "XLS", "XLSX", 
        "JPG", "JPEG", "PNG", "GIF", 
        "MP4", "AVI", "MOV", 
        "MP3", "WAV", 
        "ZIP", "RAR"
    );

    // Extensions autorisées
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".jpg", ".jpeg", ".png", ".gif",
        ".mp4", ".avi", ".mov",
        ".mp3", ".wav",
        ".zip", ".rar"
    );

    /**
     * Upload un fichier et créer un document
     */
    public Document uploadFile(MultipartFile file, Reserve reserve, String nomFichier) throws IOException {
        // Validation du fichier
        validateFile(file);

        // Générer un nom unique pour le fichier
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = generateUniqueFilename(fileExtension);

        // Créer le chemin de stockage
        String relativePath = createStoragePath(reserve, uniqueFilename);
        Path fullPath = Paths.get(uploadPath, relativePath);

        // Créer les dossiers si nécessaire
        Files.createDirectories(fullPath.getParent());

        // Copier le fichier
        Files.copy(file.getInputStream(), fullPath, StandardCopyOption.REPLACE_EXISTING);

        // Calculer le hash du fichier
        String fileHash = calculateFileHash(fullPath);

        // Créer le document
        Document document = new Document();
        document.setNomFichier(nomFichier);
        document.setNomFichierOriginal(originalFilename);
        document.setTypeFichier(getFileType(fileExtension));
        document.setTailleFichier(file.getSize());
        document.setHashFichier(fileHash);
        document.setCheminFichier(relativePath);
        document.setReserve(reserve);
        document.setDateUpload(LocalDateTime.now());

        return document;
    }

    /**
     * Valider un fichier uploadé
     */
    public void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("Le fichier est trop volumineux. Taille max: " + formatFileSize(maxFileSize));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Nom de fichier invalide");
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Type de fichier non autorisé: " + extension);
        }

        // Vérifier le type MIME
        String contentType = file.getContentType();
        if (contentType == null || !isValidContentType(contentType)) {
            throw new IllegalArgumentException("Type de contenu non autorisé: " + contentType);
        }
    }

    /**
     * Supprimer un fichier du système
     */
    public void deleteFile(Document document) throws IOException {
        if (document.getCheminFichier() != null) {
            Path filePath = Paths.get(uploadPath, document.getCheminFichier());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }
    }

    /**
     * Obtenir le chemin complet d'un fichier
     */
    public Path getFilePath(Document document) {
        if (document.getCheminFichier() != null) {
            return Paths.get(uploadPath, document.getCheminFichier());
        }
        return null;
    }

    /**
     * Vérifier si un fichier existe
     */
    public boolean fileExists(Document document) {
        Path filePath = getFilePath(document);
        return filePath != null && Files.exists(filePath);
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
     * Calculer le hash SHA-256 d'un fichier
     */
    private String calculateFileHash(Path filePath) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(Files.readAllBytes(filePath));
            
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
     * Vérifier si le type de contenu est valide
     */
    private boolean isValidContentType(String contentType) {
        return contentType != null && (
            contentType.startsWith("application/") ||
            contentType.startsWith("image/") ||
            contentType.startsWith("video/") ||
            contentType.startsWith("audio/") ||
            contentType.equals("application/zip") ||
            contentType.equals("application/x-rar-compressed")
        );
    }

    /**
     * Formater la taille d'un fichier
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    /**
     * Obtenir les types de fichiers autorisés
     */
    public List<String> getAllowedTypes() {
        return ALLOWED_TYPES;
    }

    /**
     * Obtenir la taille maximale autorisée
     */
    public long getMaxFileSize() {
        return maxFileSize;
    }
} 