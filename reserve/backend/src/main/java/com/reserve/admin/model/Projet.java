package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "projet")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomProjet;
    private String maitreOuvrage;
    private String financement;
    private String statut;
    private LocalDate dateDebut;
    private LocalDate dateFin;

    @ManyToOne(fetch = FetchType.EAGER)           // ← charger la réserve immédiatement
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents","projets","alertes","historiques"}) // évite récursions
    private Reserve reserve;

    public Projet() {}

    public Projet(String nomProjet, String maitreOuvrage, String financement, String statut, LocalDate dateDebut, LocalDate dateFin, Reserve reserve) {
        this.nomProjet = nomProjet;
        this.maitreOuvrage = maitreOuvrage;
        this.financement = financement;
        this.statut = statut;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.reserve = reserve;
    }

    // Getters & Setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomProjet() {
        return nomProjet;
    }

    public void setNomProjet(String nomProjet) {
        this.nomProjet = nomProjet;
    }

    public String getMaitreOuvrage() {
        return maitreOuvrage;
    }

    public void setMaitreOuvrage(String maitreOuvrage) {
        this.maitreOuvrage = maitreOuvrage;
    }

    public String getFinancement() {
        return financement;
    }

    public void setFinancement(String financement) {
        this.financement = financement;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
    }

    public Reserve getReserve() {
        return reserve;
    }

    public void setReserve(Reserve reserve) {
        this.reserve = reserve;
    }
}
