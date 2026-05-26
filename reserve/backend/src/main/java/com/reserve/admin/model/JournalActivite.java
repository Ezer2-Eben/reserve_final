package com.reserve.admin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "journal_activite")
public class JournalActivite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String action; // CREATE, UPDATE, DELETE, LOGIN, UPLOAD

    @Column(nullable = false, length = 50)
    private String module; // RESERVE, PROJET, ALERTE, DOCUMENT, UTILISATEUR, AUTH

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 100)
    private String utilisateur; // username qui a effectué l'action

    @Column(length = 100)
    private String commune; // commune de l'utilisateur qui a effectué l'action

    @Column(nullable = false)
    private LocalDateTime dateAction;

    @PrePersist
    protected void onCreate() {
        if (this.dateAction == null) {
            this.dateAction = LocalDateTime.now();
        }
    }

    // Constructeurs
    public JournalActivite() {}

    public JournalActivite(String action, String module, String description, String utilisateur, String commune) {
        this.action = action;
        this.module = module;
        this.description = description;
        this.utilisateur = utilisateur;
        this.commune = commune;
        this.dateAction = LocalDateTime.now();
    }

    public JournalActivite(String action, String module, String description, String utilisateur) {
        this.action = action;
        this.module = module;
        this.description = description;
        this.utilisateur = utilisateur;
        this.dateAction = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUtilisateur() { return utilisateur; }
    public void setUtilisateur(String utilisateur) { this.utilisateur = utilisateur; }

    public String getCommune() { return commune; }
    public void setCommune(String commune) { this.commune = commune; }

    public LocalDateTime getDateAction() { return dateAction; }
    public void setDateAction(LocalDateTime dateAction) { this.dateAction = dateAction; }
}
