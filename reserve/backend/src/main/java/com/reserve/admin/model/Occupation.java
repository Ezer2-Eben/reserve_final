package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "occupation")
public class Occupation {

    public enum TypeOccupation { TEMPORAIRE, ILLEGALE, AUTORISEE }
    public enum StatutOccupation { ACTIVE, REGULARISEE, EVACUEE, EN_COURS_EVACUATION }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TypeOccupation typeOccupation;

    @Enumerated(EnumType.STRING)
    private StatutOccupation statut = StatutOccupation.ACTIVE;

    private String occupant;
    private Double superficie;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateDebut == null) dateDebut = LocalDate.now();
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents", "projets", "alertes", "historiques"})
    private Reserve reserve;

    public Occupation() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TypeOccupation getTypeOccupation() { return typeOccupation; }
    public void setTypeOccupation(TypeOccupation typeOccupation) { this.typeOccupation = typeOccupation; }

    public StatutOccupation getStatut() { return statut; }
    public void setStatut(StatutOccupation statut) { this.statut = statut; }

    public String getOccupant() { return occupant; }
    public void setOccupant(String occupant) { this.occupant = occupant; }

    public Double getSuperficie() { return superficie; }
    public void setSuperficie(Double superficie) { this.superficie = superficie; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDate dateDebut) { this.dateDebut = dateDebut; }

    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Reserve getReserve() { return reserve; }
    public void setReserve(Reserve reserve) { this.reserve = reserve; }
}
