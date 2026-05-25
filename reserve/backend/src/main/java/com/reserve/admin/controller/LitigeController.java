package com.reserve.admin.controller;

import com.reserve.admin.model.Alerte;
import com.reserve.admin.model.Litige;
import com.reserve.admin.model.Occupation;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.AlerteRepository;
import com.reserve.admin.repository.LitigeRepository;
import com.reserve.admin.repository.OccupationRepository;
import com.reserve.admin.repository.ReserveRepository;
import com.reserve.admin.service.JournalActiviteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/litiges")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LitigeController {

    @Autowired
    private LitigeRepository litigeRepository;

    @Autowired
    private ReserveRepository reserveRepository;

    @Autowired
    private JournalActiviteService journalService;

    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "système";
    }

    @GetMapping
    public ResponseEntity<List<Litige>> getAll() {
        return ResponseEntity.ok(litigeRepository.findAll());
    }

    @GetMapping("/reserve/{reserveId}")
    public ResponseEntity<List<Litige>> getByReserve(@PathVariable Long reserveId) {
        return ResponseEntity.ok(litigeRepository.findByReserveId(reserveId));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Litige>> getByStatut(@PathVariable String statut) {
        try {
            return ResponseEntity.ok(litigeRepository.findByStatut(Litige.StatutLitige.valueOf(statut.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Litige litige) {
        try {
            if (litige.getReserve() == null || litige.getReserve().getId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "La réserve est obligatoire."));
            }
            Reserve reserve = reserveRepository.findById(litige.getReserve().getId())
                    .orElse(null);
            if (reserve == null) return ResponseEntity.badRequest().body(Map.of("message", "Réserve introuvable."));
            litige.setReserve(reserve);
            if (litige.getDateOuverture() == null) litige.setDateOuverture(LocalDate.now());

            Litige saved = litigeRepository.save(litige);
            journalService.logAction("CREATE", "LITIGE",
                    "Création du litige '" + saved.getTitre() + "' sur la réserve '" + reserve.getNom() + "'",
                    currentUser());
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Litige data) {
        return litigeRepository.findById(id).map(litige -> {
            if (data.getTitre() != null) litige.setTitre(data.getTitre());
            if (data.getDescription() != null) litige.setDescription(data.getDescription());
            if (data.getStatut() != null) litige.setStatut(data.getStatut());
            if (data.getType() != null) litige.setType(data.getType());
            if (data.getPartiesImpliquees() != null) litige.setPartiesImpliquees(data.getPartiesImpliquees());
            if (data.getProcedureJuridique() != null) litige.setProcedureJuridique(data.getProcedureJuridique());
            if (data.getDateEcheance() != null) litige.setDateEcheance(data.getDateEcheance());
            if (data.getDateResolution() != null) litige.setDateResolution(data.getDateResolution());
            Litige saved = litigeRepository.save(litige);
            journalService.logAction("UPDATE", "LITIGE",
                    "Mise à jour du litige '" + saved.getTitre() + "' — statut: " + saved.getStatut(),
                    currentUser());
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return litigeRepository.findById(id).map(litige -> {
            journalService.logAction("DELETE", "LITIGE",
                    "Suppression du litige '" + litige.getTitre() + "'",
                    currentUser());
            litigeRepository.delete(litige);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
