package com.reserve.admin.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "alerte")
public class Alerte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;

    private String description;

    private String niveau;
    @ManyToOne(fetch = FetchType.EAGER)           // ← charger la réserve immédiatement
    @JoinColumn(name = "reserve_id", nullable = false)
    @JsonIgnoreProperties({"documents","projets","alertes","historiques"}) // évite récursions
    private Reserve reserve;

    // Constructeurs

    public Alerte() {
    }

    public Alerte(Long id, String type, String description, String niveau, Reserve reserve) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.niveau = niveau;
        this.reserve = reserve;
    }

    // Getters et setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getNiveau() {
        return niveau;
    }

    public void setNiveau(String niveau) {
        this.niveau = niveau;
    }

    public Reserve getReserve() {
        return reserve;
    }

    public void setReserve(Reserve reserve) {
        this.reserve = reserve;
    }
}
