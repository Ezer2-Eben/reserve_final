package com.reserve.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reserve.admin.dto.MobileReserveRequest;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.service.ReserveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller dédié à l'application mobile Flutter.
 * Endpoints accessibles SANS authentification JWT.
 * Mappe automatiquement les données Flutter → modèle Reserve Spring Boot.
 */
@RestController
@RequestMapping("/api/mobile")
@CrossOrigin(origins = "*")
public class MobileReserveController {

    private final ReserveService reserveService;
    private final ObjectMapper objectMapper;

    @Autowired
    public MobileReserveController(ReserveService reserveService, ObjectMapper objectMapper) {
        this.reserveService = reserveService;
        this.objectMapper = objectMapper;
    }

    /**
     * Créer une réserve depuis le mobile Flutter.
     * POST /api/mobile/reserves
     */
    @PostMapping("/reserves")
    public ResponseEntity<?> createReserveFromMobile(@RequestBody MobileReserveRequest request) {
        try {
            // Validation minimale
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le nom de la réserve est obligatoire"));
            }
            if (request.getPoints() == null || request.getPoints().size() < 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Au moins 3 points GPS sont requis"));
            }

            Reserve reserve = mapToReserve(request);
            Reserve saved = reserveService.createReserveFromMobile(reserve);

            // Retourner la réserve créée avec son ID
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("nom", saved.getNom());
            response.put("localisation", saved.getLocalisation());
            response.put("superficie", saved.getSuperficie());
            response.put("statut", saved.getStatut());
            response.put("latitude", saved.getLatitude());
            response.put("longitude", saved.getLongitude());
            response.put("zone", saved.getZone());
            response.put("createdAt", saved.getCreatedAt());
            response.put("mobileId", request.getMobileId()); // Retourner l'ID Flutter pour la correspondance

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur lors de la sauvegarde: " + e.getMessage()));
        }
    }

    /**
     * Récupérer toutes les réserves (pour synchronisation mobile).
     * GET /api/mobile/reserves
     */
    @GetMapping("/reserves")
    public ResponseEntity<List<Map<String, Object>>> getAllReservesForMobile() {
        List<Reserve> reserves = reserveService.getAllReserves();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Reserve r : reserves) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("nom", r.getNom());
            item.put("localisation", r.getLocalisation());
            item.put("superficie", r.getSuperficie());
            item.put("type", r.getType());
            item.put("statut", r.getStatut());
            item.put("latitude", r.getLatitude());
            item.put("longitude", r.getLongitude());
            item.put("description", r.getDescription());
            item.put("zone", r.getZone());
            item.put("createdAt", r.getCreatedAt());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Vérifier la connectivité avec le backend.
     * GET /api/mobile/ping
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "message", "Backend réserves administratives connecté",
                "version", "1.0.0"));
    }

    // ─── Mapping Flutter → Spring Boot ────────────────────────────────────────

    private Reserve mapToReserve(MobileReserveRequest req) {
        Reserve reserve = new Reserve();

        // Nom de la réserve
        reserve.setNom(req.getName());

        // Type par défaut pour les réserves créées depuis le mobile
        reserve.setType("Mobile");

        // Statut par défaut
        reserve.setStatut("Active");

        // Superficie (convertie de m² en ha si > 10000m²)
        if (req.getArea() != null) {
            reserve.setSuperficie(req.getArea()); // en m²
        } else {
            reserve.setSuperficie(0.0);
        }

        // Calculer le centroïde (centre géographique) à partir des points
        if (req.getPoints() != null && !req.getPoints().isEmpty()) {
            double sumLat = 0, sumLng = 0;
            for (MobileReserveRequest.GpsPoint point : req.getPoints()) {
                if (point.getLatitude() != null)
                    sumLat += point.getLatitude();
                if (point.getLongitude() != null)
                    sumLng += point.getLongitude();
            }
            int count = req.getPoints().size();
            double centerLat = sumLat / count;
            double centerLng = sumLng / count;

            reserve.setLatitude(centerLat);
            reserve.setLongitude(centerLng);

            // Localisation automatique basée sur les coordonnées
            reserve.setLocalisation(String.format("Lat: %.6f, Lng: %.6f", centerLat, centerLng));

            // Construire le GeoJSON pour le champ zone
            reserve.setZone(buildGeoJson(req));
        } else {
            reserve.setLocalisation("Non spécifiée");
            reserve.setZone("{}");
        }

        // Description avec infos du mobile
        StringBuilder desc = new StringBuilder();
        desc.append("Créée depuis l'application mobile. ");
        if (req.getPerimeter() != null) {
            desc.append(String.format("Périmètre: %.2f m. ", req.getPerimeter()));
        }
        if (req.getIsClosed() != null && req.getIsClosed()) {
            desc.append("Polygone fermé.");
        }
        reserve.setDescription(desc.toString());

        // Référence mobile
        if (req.getMobileId() != null) {
            reserve.setReference("MOBILE-" + req.getMobileId());
        }

        return reserve;
    }

    /**
     * Construit un GeoJSON Polygon à partir des points GPS Flutter.
     */
    private String buildGeoJson(MobileReserveRequest req) {
        try {
            List<MobileReserveRequest.GpsPoint> points = req.getPoints();
            StringBuilder coordinates = new StringBuilder("[");

            for (int i = 0; i < points.size(); i++) {
                MobileReserveRequest.GpsPoint p = points.get(i);
                if (i > 0)
                    coordinates.append(",");
                coordinates.append(String.format("[%s,%s]",
                        p.getLongitude() != null ? p.getLongitude() : 0,
                        p.getLatitude() != null ? p.getLatitude() : 0));
            }

            // Fermer le polygone (répéter le premier point)
            if (!points.isEmpty()) {
                MobileReserveRequest.GpsPoint first = points.get(0);
                coordinates.append(String.format(",[%s,%s]",
                        first.getLongitude() != null ? first.getLongitude() : 0,
                        first.getLatitude() != null ? first.getLatitude() : 0));
            }
            coordinates.append("]");

            return String.format(
                    "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[%s]}," +
                            "\"properties\":{\"name\":\"%s\",\"area\":%s,\"perimeter\":%s,\"source\":\"mobile\"}}",
                    coordinates,
                    req.getName() != null ? req.getName().replace("\"", "'") : "",
                    req.getArea() != null ? req.getArea() : 0,
                    req.getPerimeter() != null ? req.getPerimeter() : 0);
        } catch (Exception e) {
            return "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[0,0]}}";
        }
    }
}
