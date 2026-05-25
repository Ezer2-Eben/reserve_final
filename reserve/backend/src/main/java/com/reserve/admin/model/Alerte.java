package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerte")
public class Alerte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String description;
    private String niveau;

    // Nouveaux champs — cycle de vie de l'alerte
    @Column(name = "statut_alerte")
    private String statutAlerte = "ACTIVE"; // ACTIVE, EN_COURS, RESOLUE

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "date_resolution")
    private LocalDateTime dateResolution;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents", "projets", "alertes", "historiques"})
    private Reserve reserve;

    // Constructeurs
    public Alerte() {}

    public Alerte(Long id, String type, String description, String niveau, Reserve reserve) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.niveau = niveau;
        this.reserve = reserve;
    }

    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNiveau() { return niveau; }
    public void setNiveau(String niveau) { this.niveau = niveau; }

    public String getStatutAlerte() { return statutAlerte; }
    public void setStatutAlerte(String statutAlerte) { this.statutAlerte = statutAlerte; }

    public LocalDate getDateLimite() { return dateLimite; }
    public void setDateLimite(LocalDate dateLimite) { this.dateLimite = dateLimite; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public LocalDateTime getDateResolution() { return dateResolution; }
    public void setDateResolution(LocalDateTime dateResolution) { this.dateResolution = dateResolution; }

    public Reserve getReserve() { return reserve; }
    public void setReserve(Reserve reserve) { this.reserve = reserve; }
}
