// src/main/java/com/reserve/admin/model/Commune.java
package com.reserve.admin.model;

import jakarta.persistence.*;

@Entity
@Table(name = "communes")
public class Commune {
    
    @Id
    @Column(name = "gid_3", length = 50)
    private String gid3;
    
    @Column(name = "nom", length = 100, nullable = false)
    private String nom;
    
    @Column(name = "prefecture", length = 100, nullable = false)
    private String prefecture;
    
    @Column(name = "region", length = 100, nullable = false)
    private String region;
    
    @Lob
    @Column(name = "geometrie", columnDefinition = "TEXT", nullable = false)
    private String geometrie;
    
    // Constructeurs
    public Commune() {}
    
    public Commune(String gid3, String nom, String prefecture, String region, String geometrie) {
        this.gid3 = gid3;
        this.nom = nom;
        this.prefecture = prefecture;
        this.region = region;
        this.geometrie = geometrie;
    }
    
    // Getters
    public String getGid3() { return gid3; }
    public String getNom() { return nom; }
    public String getPrefecture() { return prefecture; }
    public String getRegion() { return region; }
    public String getGeometrie() { return geometrie; }
    
    // Setters
    public void setGid3(String gid3) { this.gid3 = gid3; }
    public void setNom(String nom) { this.nom = nom; }
    public void setPrefecture(String prefecture) { this.prefecture = prefecture; }
    public void setRegion(String region) { this.region = region; }
    public void setGeometrie(String geometrie) { this.geometrie = geometrie; }
}