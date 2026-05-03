package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reserve")
@JsonIgnoreProperties({"documents","projets","alertes","historiques"})
public class Reserve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "La localisation est obligatoire")
    private String localisation;

    @NotNull(message = "La superficie est obligatoire")
    private Double superficie;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    private Double latitude;
    private Double longitude;

    @NotBlank(message = "Le statut est obligatoire")
    private String statut;

    // NOUVEAUX CHAMPS
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "proprietaire")
    private String proprietaire;

    @Column(name = "reference")
    private String reference;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String zone; // JSON contenant les coordonnées de la zone délimitée

    // Champs de métadonnées
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Pré-persist pour les dates
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 🔗 Relations
    @OneToMany(mappedBy = "reserve", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Document> documents;

    @OneToMany(mappedBy = "reserve", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Projet> projets;

    @OneToMany(mappedBy = "reserve", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Alerte> alertes;

    @OneToMany(mappedBy = "reserve", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoriqueJuridique> historiques;

    // Constructeurs
    public Reserve() {
    }

    public Reserve(String nom, String localisation, Double superficie, String type, 
                   Double latitude, Double longitude, String statut, String description, 
                   String proprietaire, String reference, String zone) {
        this.nom = nom;
        this.localisation = localisation;
        this.superficie = superficie;
        this.type = type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.statut = statut;
        this.description = description;
        this.proprietaire = proprietaire;
        this.reference = reference;
        this.zone = zone;
    }

    // 📦 Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public Double getSuperficie() {
        return superficie;
    }

    public void setSuperficie(Double superficie) {
        this.superficie = superficie;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProprietaire() {
        return proprietaire;
    }

    public void setProprietaire(String proprietaire) {
        this.proprietaire = proprietaire;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Getters pour les relations (inchangés)
    public List<Document> getDocuments() {
        return documents;
    }

    public void setDocuments(List<Document> documents) {
        this.documents = documents;
    }

    public List<Projet> getProjets() {
        return projets;
    }

    public void setProjets(List<Projet> projets) {
        this.projets = projets;
    }

    public List<Alerte> getAlertes() {
        return alertes;
    }

    public void setAlertes(List<Alerte> alertes) {
        this.alertes = alertes;
    }

    public List<HistoriqueJuridique> getHistoriques() {
        return historiques;
    }

    public void setHistoriques(List<HistoriqueJuridique> historiques) {
        this.historiques = historiques;
    }
}