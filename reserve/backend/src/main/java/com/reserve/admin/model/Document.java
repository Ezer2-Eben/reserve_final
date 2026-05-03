package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomFichier;
    
    @Column(name = "nom_fichier_original")
    private String nomFichierOriginal;
    
    private String typeFichier;
    
    @Column(name = "taille_fichier")
    private Long tailleFichier;
    
    @Column(name = "hash_fichier")
    private String hashFichier;
    
    private String url; // Gardé pour compatibilité, mais optionnel maintenant
    
    @Column(name = "chemin_fichier")
    private String cheminFichier;
    
    @Column(name = "date_upload")
    private LocalDateTime dateUpload;

    @ManyToOne(fetch = FetchType.EAGER)           // ← charger la réserve immédiatement
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents","projets","alertes","historiques"}) // évite récursions
    private Reserve reserve;

    public Document() {
        this.dateUpload = LocalDateTime.now();
    }

    public Document(String nomFichier, String nomFichierOriginal, String typeFichier, 
                   Long tailleFichier, String hashFichier, String url, String cheminFichier, Reserve reserve) {
        this.nomFichier = nomFichier;
        this.nomFichierOriginal = nomFichierOriginal;
        this.typeFichier = typeFichier;
        this.tailleFichier = tailleFichier;
        this.hashFichier = hashFichier;
        this.url = url;
        this.cheminFichier = cheminFichier;
        this.reserve = reserve;
        this.dateUpload = LocalDateTime.now();
    }

    // Constructeur pour compatibilité avec l'ancien système
    public Document(String nomFichier, String typeFichier, String url, Reserve reserve) {
        this.nomFichier = nomFichier;
        this.typeFichier = typeFichier;
        this.url = url;
        this.reserve = reserve;
        this.dateUpload = LocalDateTime.now();
    }

    // Getters et setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomFichier() {
        return nomFichier;
    }

    public void setNomFichier(String nomFichier) {
        this.nomFichier = nomFichier;
    }

    public String getNomFichierOriginal() {
        return nomFichierOriginal;
    }

    public void setNomFichierOriginal(String nomFichierOriginal) {
        this.nomFichierOriginal = nomFichierOriginal;
    }

    public String getTypeFichier() {
        return typeFichier;
    }

    public void setTypeFichier(String typeFichier) {
        this.typeFichier = typeFichier;
    }

    public Long getTailleFichier() {
        return tailleFichier;
    }

    public void setTailleFichier(Long tailleFichier) {
        this.tailleFichier = tailleFichier;
    }

    public String getHashFichier() {
        return hashFichier;
    }

    public void setHashFichier(String hashFichier) {
        this.hashFichier = hashFichier;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getCheminFichier() {
        return cheminFichier;
    }

    public void setCheminFichier(String cheminFichier) {
        this.cheminFichier = cheminFichier;
    }

    public LocalDateTime getDateUpload() {
        return dateUpload;
    }

    public void setDateUpload(LocalDateTime dateUpload) {
        this.dateUpload = dateUpload;
    }

    public Reserve getReserve() {
        return reserve;
    }

    public void setReserve(Reserve reserve) {
        this.reserve = reserve;
    }

    // Méthodes utilitaires
    public String getTailleFichierFormatee() {
        if (tailleFichier == null) return "N/A";
        
        long bytes = tailleFichier;
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    public boolean isFichierLocal() {
        return cheminFichier != null && !cheminFichier.isEmpty();
    }

    public boolean isFichierExterne() {
        return url != null && !url.isEmpty();
    }

    @Override
    public String toString() {
        return "Document{" +
                "id=" + id +
                ", nomFichier='" + nomFichier + '\'' +
                ", nomFichierOriginal='" + nomFichierOriginal + '\'' +
                ", typeFichier='" + typeFichier + '\'' +
                ", tailleFichier=" + tailleFichier +
                ", dateUpload=" + dateUpload +
                ", reserve=" + (reserve != null ? reserve.getNom() : "null") +
                '}';
    }
}
