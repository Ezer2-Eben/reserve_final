// src/main/java/com/reserve/admin/service/CommuneService.java
package com.reserve.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reserve.admin.model.Commune;
import com.reserve.admin.repository.CommuneRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class CommuneService {
    
    private final CommuneRepository communeRepository;
    private final ObjectMapper objectMapper;
    private static final Logger log = LoggerFactory.getLogger(CommuneService.class);
    
    public CommuneService(CommuneRepository communeRepository, ObjectMapper objectMapper) {
        this.communeRepository = communeRepository;
        this.objectMapper = objectMapper;
    }
    
    @PostConstruct
    @Transactional
    public void initCommunes() {
        try {
            long existingCount = communeRepository.count();
            log.info("🔍 Vérification des communes dans la base : {} trouvées", existingCount);
            
            if (existingCount == 0) {
                log.info("🚀 Chargement initial des données géographiques...");
                loadCommunesFromGeoJSON();
            } else {
                log.info("✅ Données géographiques déjà présentes");
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'initialisation des communes : {}", e.getMessage(), e);
        }
    }
    
    private void loadCommunesFromGeoJSON() {
        try {
            ClassPathResource resource = new ClassPathResource("data/données_commune.geojson");
            
            if (!resource.exists()) {
                log.error("❌ Fichier GeoJSON introuvable : {}", resource.getPath());
                return;
            }
            
            log.info("📂 Lecture du fichier GeoJSON...");
            
            try (InputStream inputStream = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(inputStream);
                JsonNode features = root.get("features");
                
                if (features == null || !features.isArray()) {
                    log.error("❌ Format GeoJSON invalide");
                    return;
                }
                
                int totalFeatures = features.size();
                log.info("📊 {} features trouvées dans le GeoJSON", totalFeatures);
                
                List<Commune> communes = new ArrayList<>();
                int errorCount = 0;
                
                for (JsonNode feature : features) {
                    try {
                        Commune commune = parseFeatureToCommune(feature);
                        if (commune != null) {
                            communes.add(commune);
                        }
                    } catch (Exception e) {
                        errorCount++;
                        log.debug("⚠️ Feature invalide : {}", e.getMessage());
                    }
                }
                
                if (!communes.isEmpty()) {
                    communeRepository.saveAll(communes);
                    log.info("✅ {} communes chargées avec succès ({} erreurs)", communes.size(), errorCount);
                } else {
                    log.error("❌ Aucune commune valide trouvée dans le fichier");
                }
                
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur de chargement du GeoJSON : {}", e.getMessage(), e);
        }
    }
    
    private Commune parseFeatureToCommune(JsonNode feature) {
        try {
            JsonNode properties = feature.get("properties");
            JsonNode geometry = feature.get("geometry");
            
            if (properties == null || geometry == null) {
                return null;
            }
            
            String gid3 = properties.has("GID_3") ? 
                properties.get("GID_3").asText().trim() : null;
            String nom = properties.has("NAME_3") ? 
                properties.get("NAME_3").asText().trim() : "Inconnu";
            String prefecture = properties.has("NAME_2") ? 
                properties.get("NAME_2").asText().trim() : "Inconnu";
            String region = properties.has("NAME_1") ? 
                properties.get("NAME_1").asText().trim() : "Inconnu";
            
            if (gid3 == null || gid3.isEmpty()) {
                return null;
            }
            
            return new Commune(gid3, nom, prefecture, region, geometry.toString());
            
        } catch (Exception e) {
            log.debug("❌ Erreur parsing feature : {}", e.getMessage());
            return null;
        }
    }
    
    public List<Commune> getAllCommunes() {
        return communeRepository.findAll();
    }
    
    public String getAllCommunesAsGeoJSON() {
        List<Commune> communes = getAllCommunes();
        
        if (communes.isEmpty()) {
            return "{\"type\":\"FeatureCollection\",\"features\":[]}";
        }
        
        StringBuilder geoJson = new StringBuilder();
        geoJson.append("{\"type\":\"FeatureCollection\",\"features\":[");
        
        for (int i = 0; i < communes.size(); i++) {
            Commune commune = communes.get(i);
            geoJson.append(buildFeatureGeoJSON(commune));
            
            if (i < communes.size() - 1) {
                geoJson.append(",");
            }
        }
        
        geoJson.append("]}");
        
        return geoJson.toString();
    }
    
    private String buildFeatureGeoJSON(Commune commune) {
        return String.format(
            "{\"type\":\"Feature\",\"properties\":{" +
            "\"id\":\"%s\"," +
            "\"nom\":\"%s\"," +
            "\"prefecture\":\"%s\"," +
            "\"region\":\"%s\"" +
            "},\"geometry\":%s}",
            escapeJson(commune.getGid3()),
            escapeJson(commune.getNom()),
            escapeJson(commune.getPrefecture()),
            escapeJson(commune.getRegion()),
            commune.getGeometrie()
        );
    }
    
    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}