// src/main/java/com/reserve/admin/controller/CommuneController.java
package com.reserve.admin.controller;

import com.reserve.admin.model.Commune;
import com.reserve.admin.service.CommuneService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communes")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class CommuneController {
    
    private final CommuneService communeService;
    
    public CommuneController(CommuneService communeService) {
        this.communeService = communeService;
    }
    
    @GetMapping
    public ResponseEntity<List<Commune>> getAllCommunes() {
        return ResponseEntity.ok(communeService.getAllCommunes());
    }
    
    @GetMapping("/geojson")
    public ResponseEntity<String> getCommunesGeoJSON() {
        try {
            String geoJson = communeService.getAllCommunesAsGeoJSON();
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(geoJson);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"Erreur lors de la génération du GeoJSON\"}");
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("API Communes fonctionnelle !");
    }
}