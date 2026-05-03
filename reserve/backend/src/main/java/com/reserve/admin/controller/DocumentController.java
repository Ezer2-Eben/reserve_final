package com.reserve.admin.controller;

import com.reserve.admin.model.Document;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.ReserveRepository;
import com.reserve.admin.service.DocumentService;
import com.reserve.admin.service.DocumentServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private ReserveRepository reserveRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Document createDocument(@RequestBody Document document) {
        return documentService.saveDocument(document);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<Document> getAllDocuments() {
        return documentService.getAllDocuments();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public Document getDocumentById(@PathVariable Long id) {
        return documentService.getDocumentById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé avec l'id " + id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Document updateDocument(@PathVariable Long id, @RequestBody Document document) {
        return documentService.updateDocument(id, document);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
    }

    /**
     * Upload un fichier
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("reserveId") Long reserveId,
            @RequestParam(value = "nomFichier", required = false) String nomFichier) {

        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;

            Document document;
            if (nomFichier != null && !nomFichier.trim().isEmpty()) {
                document = documentServiceImpl.uploadFile(file, reserveId, nomFichier);
            } else {
                document = documentServiceImpl.uploadFile(file, reserveId);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Fichier uploadé avec succès");
            response.put("document", document);
            response.put("tailleFormatee", document.getTailleFichierFormatee());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur inattendue: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Télécharger un fichier
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            byte[] fileContent = documentServiceImpl.downloadFile(id);

            Document document = documentService.getDocumentById(id)
                    .orElseThrow(() -> new RuntimeException("Document non trouvé"));

            String filename = document.getNomFichierOriginal() != null ?
                    document.getNomFichierOriginal() : document.getNomFichier();

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(fileContent.length)
                    .body(resource);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors du téléchargement: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtenir les informations sur les uploads
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'USER')")
    @GetMapping("/upload-info")
    public ResponseEntity<?> getUploadInfo() {
        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            DocumentServiceImpl.FileUploadInfo info = documentServiceImpl.getUploadInfo();

            Map<String, Object> response = new HashMap<>();
            response.put("allowedTypes", info.getAllowedTypes());
            response.put("maxFileSize", info.getMaxFileSize());
            response.put("maxFileSizeFormatted", info.getMaxFileSizeFormatted());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la récupération des informations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Vérifier si un fichier existe
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'USER')")
    @GetMapping("/{id}/exists")
    public ResponseEntity<?> fileExists(@PathVariable Long id) {
        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            boolean exists = documentServiceImpl.fileExists(id);

            Map<String, Object> response = new HashMap<>();
            response.put("exists", exists);
            response.put("documentId", id);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la vérification: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Créer un document avec URL externe
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/external")
    public ResponseEntity<?> createExternalDocument(@RequestBody Map<String, Object> request) {
        try {
            String nomFichier = (String) request.get("nomFichier");
            String typeFichier = (String) request.get("typeFichier");
            String url = (String) request.get("url");
            Long reserveId = Long.valueOf(request.get("reserveId").toString());

            if (nomFichier == null || typeFichier == null || url == null || reserveId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tous les champs sont requis"));
            }

            Reserve reserve = reserveRepository.findById(reserveId)
                    .orElseThrow(() -> new RuntimeException("Réserve non trouvée avec l'id " + reserveId));

            Document document = new Document();
            document.setNomFichier(nomFichier);
            document.setTypeFichier(typeFichier);
            document.setUrl(url);
            document.setReserve(reserve);
            document.setDateUpload(LocalDateTime.now());

            Document savedDocument = documentService.saveDocument(document);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document externe créé avec succès");
            response.put("document", savedDocument);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la création: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Migrer un document local vers externe
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/migrate-to-external")
    public ResponseEntity<?> migrateToExternal(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String url = request.get("url");
            if (url == null || url.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL requise"));
            }

            Document document = documentService.getDocumentById(id)
                    .orElseThrow(() -> new RuntimeException("Document non trouvé"));

            if (!document.isFichierLocal()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Document n'est pas un fichier local"));
            }

            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            try {
                documentServiceImpl.deleteDocument(id);
            } catch (Exception e) {
                System.err.println("Erreur lors de la suppression du fichier local: " + e.getMessage());
            }

            Document externalDocument = new Document();
            externalDocument.setNomFichier(document.getNomFichier());
            externalDocument.setNomFichierOriginal(document.getNomFichierOriginal());
            externalDocument.setTypeFichier(document.getTypeFichier());
            externalDocument.setTailleFichier(document.getTailleFichier());
            externalDocument.setUrl(url);
            externalDocument.setReserve(document.getReserve());
            externalDocument.setDateUpload(LocalDateTime.now());

            Document savedDocument = documentService.saveDocument(externalDocument);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document migré vers externe avec succès");
            response.put("document", savedDocument);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la migration: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Importer des documents depuis un dossier local
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/import-from-folder")
    public ResponseEntity<?> importFromFolder(
            @RequestParam("folderPath") String folderPath,
            @RequestParam("reserveId") Long reserveId,
            @RequestParam(value = "recursive", defaultValue = "false") boolean recursive) {

        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            List<Document> importedDocuments = documentServiceImpl.importFromFolder(folderPath, reserveId, recursive);

            Map<String, Object> response = new HashMap<>();
            response.put("message", importedDocuments.size() + " documents importés avec succès");
            response.put("importedDocuments", importedDocuments);
            response.put("count", importedDocuments.size());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur inattendue: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtenir la liste des dossiers disponibles pour l'import
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/available-folders")
    public ResponseEntity<?> getAvailableFolders() {
        try {
            DocumentServiceImpl documentServiceImpl = (DocumentServiceImpl) documentService;
            List<String> folders = documentServiceImpl.getAvailableFolders();

            Map<String, Object> response = new HashMap<>();
            response.put("folders", folders);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la récupération des dossiers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
