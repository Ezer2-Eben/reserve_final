package com.reserve.admin.dto;

import java.util.List;

/**
 * DTO pour recevoir les données de réserve envoyées par l'application Flutter
 * mobile.
 * Le modèle Flutter utilise des points GPS, on le convertit vers le modèle
 * Reserve Spring Boot.
 */
public class MobileReserveRequest {

    /** Nom de la réserve (ex: "Réserve forêt nord") */
    private String name;

    /** Liste des points GPS délimitant la réserve */
    private List<GpsPoint> points;

    /** Superficie calculée par l'app mobile (en m²) */
    private Double area;

    /** Périmètre calculé par l'app mobile (en mètres) */
    private Double perimeter;

    /** Vrai si le polygone est fermé */
    private Boolean isClosed;

    /** Identifiant unique généré par Flutter (UUID) */
    private String mobileId;

    /** Date de création ISO 8601 envoyée par le mobile */
    private String createdAt;

    // ─── Constructeurs ────────────────────────────────────────────────────────

    public MobileReserveRequest() {
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<GpsPoint> getPoints() {
        return points;
    }

    public void setPoints(List<GpsPoint> points) {
        this.points = points;
    }

    public Double getArea() {
        return area;
    }

    public void setArea(Double area) {
        this.area = area;
    }

    public Double getPerimeter() {
        return perimeter;
    }

    public void setPerimeter(Double perimeter) {
        this.perimeter = perimeter;
    }

    public Boolean getIsClosed() {
        return isClosed;
    }

    public void setIsClosed(Boolean isClosed) {
        this.isClosed = isClosed;
    }

    public String getMobileId() {
        return mobileId;
    }

    public void setMobileId(String mobileId) {
        this.mobileId = mobileId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Classe interne représentant un point GPS.
     * Correspond aux ReservePoint de Flutter.
     */
    public static class GpsPoint {
        private String id;
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private Integer order;
        private String timestamp;

        public GpsPoint() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
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

        public Double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(Double accuracy) {
            this.accuracy = accuracy;
        }

        public Integer getOrder() {
            return order;
        }

        public void setOrder(Integer order) {
            this.order = order;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}
