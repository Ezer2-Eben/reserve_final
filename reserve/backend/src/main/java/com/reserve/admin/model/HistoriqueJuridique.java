package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "historique_juridique")
public class HistoriqueJuridique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String natureActe;
    private String numeroReference;
    private LocalDate dateActe;
    private String commentaire;

    @ManyToOne(fetch = FetchType.EAGER)           // ← charger la réserve immédiatement
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents","projets","alertes","historiques"}) // évite récursions
    private Reserve reserve;

    public HistoriqueJuridique() {}

    public HistoriqueJuridique(String natureActe, String numeroReference, LocalDate dateActe, String commentaire, Reserve reserve) {
        this.natureActe = natureActe;
        this.numeroReference = numeroReference;
        this.dateActe = dateActe;
        this.commentaire = commentaire;
        this.reserve = reserve;
    }

    // Getters & Setters...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNatureActe() {
        return natureActe;
    }

    public void setNatureActe(String natureActe) {
        this.natureActe = natureActe;
    }

    public String getNumeroReference() {
        return numeroReference;
    }

    public void setNumeroReference(String numeroReference) {
        this.numeroReference = numeroReference;
    }

    public LocalDate getDateActe() {
        return dateActe;
    }

    public void setDateActe(LocalDate dateActe) {
        this.dateActe = dateActe;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    public Reserve getReserve() {
        return reserve;
    }

    public void setReserve(Reserve reserve) {
        this.reserve = reserve;
    }
}
