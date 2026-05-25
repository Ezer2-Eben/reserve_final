package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "litige")
public class Litige {

    public enum StatutLitige { OUVERT, EN_COURS, RESOLU, FERME }
    public enum TypeLitige { OCCUPATION_ILLEGALE, DOUBLE_AFFECTATION, VIOLATION_URBANISME, LITIGE_FONCIER, AUTRE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private StatutLitige statut = StatutLitige.OUVERT;

    @Enumerated(EnumType.STRING)
    private TypeLitige type;

    @Column(columnDefinition = "TEXT")
    private String partiesImpliquees;

    @Column(columnDefinition = "TEXT")
    private String procedureJuridique;

    private LocalDate dateOuverture;
    private LocalDate dateResolution;
    private LocalDate dateEcheance;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateOuverture == null) dateOuverture = LocalDate.now();
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents", "projets", "alertes", "historiques"})
    private Reserve reserve;

    public Litige() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public StatutLitige getStatut() { return statut; }
    public void setStatut(StatutLitige statut) { this.statut = statut; }

    public TypeLitige getType() { return type; }
    public void setType(TypeLitige type) { this.type = type; }

    public String getPartiesImpliquees() { return partiesImpliquees; }
    public void setPartiesImpliquees(String partiesImpliquees) { this.partiesImpliquees = partiesImpliquees; }

    public String getProcedureJuridique() { return procedureJuridique; }
    public void setProcedureJuridique(String procedureJuridique) { this.procedureJuridique = procedureJuridique; }

    public LocalDate getDateOuverture() { return dateOuverture; }
    public void setDateOuverture(LocalDate dateOuverture) { this.dateOuverture = dateOuverture; }

    public LocalDate getDateResolution() { return dateResolution; }
    public void setDateResolution(LocalDate dateResolution) { this.dateResolution = dateResolution; }

    public LocalDate getDateEcheance() { return dateEcheance; }
    public void setDateEcheance(LocalDate dateEcheance) { this.dateEcheance = dateEcheance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Reserve getReserve() { return reserve; }
    public void setReserve(Reserve reserve) { this.reserve = reserve; }
}
