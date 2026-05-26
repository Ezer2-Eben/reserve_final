package com.reserve.admin.controller;

import com.reserve.admin.model.Alerte;
import com.reserve.admin.model.Occupation;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.AlerteRepository;
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
@RequestMapping("/api/occupations")
@CrossOrigin(origins = "*")
public class OccupationController {

    @Autowired
    private OccupationRepository occupationRepository;

    @Autowired
    private ReserveRepository reserveRepository;

    @Autowired
    private AlerteRepository alerteRepository;

    @Autowired
    private JournalActiviteService journalService;

    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "système";
    }

    @GetMapping
    public ResponseEntity<List<Occupation>> getAll() {
        return ResponseEntity.ok(occupationRepository.findAll());
    }

    @GetMapping("/reserve/{reserveId}")
    public ResponseEntity<List<Occupation>> getByReserve(@PathVariable Long reserveId) {
        return ResponseEntity.ok(occupationRepository.findByReserveId(reserveId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Occupation occupation) {
        try {
            if (occupation.getReserve() == null || occupation.getReserve().getId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "La réserve est obligatoire."));
            }
            Reserve reserve = reserveRepository.findById(occupation.getReserve().getId()).orElse(null);
            if (reserve == null) return ResponseEntity.badRequest().body(Map.of("message", "Réserve introuvable."));
            occupation.setReserve(reserve);
            if (occupation.getDateDebut() == null) occupation.setDateDebut(LocalDate.now());

            Occupation saved = occupationRepository.save(occupation);

            // Créer automatiquement une alerte CRITIQUE si l'occupation est ILLEGALE
            if (Occupation.TypeOccupation.ILLEGALE.equals(saved.getTypeOccupation())) {
                Alerte alerte = new Alerte();
                alerte.setType("OCCUPATION_ILLEGALE");
                alerte.setDescription("Occupation illégale détectée sur la réserve '" + reserve.getNom()
                        + "' par '" + (saved.getOccupant() != null ? saved.getOccupant() : "inconnu") + "'");
                alerte.setNiveau("CRITIQUE");
                alerte.setStatutAlerte("ACTIVE");
                alerte.setDateLimite(LocalDate.now().plusDays(7));
                alerte.setReserve(reserve);
                alerteRepository.save(alerte);
                journalService.logAction("CREATE", "ALERTE",
                        "Alerte CRITIQUE auto-générée — occupation illégale sur '" + reserve.getNom() + "'",
                        "système");
            }

            journalService.logAction("CREATE", "OCCUPATION",
                    "Enregistrement d'une occupation (" + saved.getTypeOccupation() + ") sur '" + reserve.getNom() + "'",
                    currentUser());
            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Occupation data) {
        return occupationRepository.findById(id).map(occ -> {
            if (data.getTypeOccupation() != null) occ.setTypeOccupation(data.getTypeOccupation());
            if (data.getStatut() != null) occ.setStatut(data.getStatut());
            if (data.getOccupant() != null) occ.setOccupant(data.getOccupant());
            if (data.getSuperficie() != null) occ.setSuperficie(data.getSuperficie());
            if (data.getDescription() != null) occ.setDescription(data.getDescription());
            if (data.getDateFin() != null) occ.setDateFin(data.getDateFin());
            Occupation saved = occupationRepository.save(occ);
            journalService.logAction("UPDATE", "OCCUPATION",
                    "Mise à jour occupation '" + saved.getOccupant() + "' — statut: " + saved.getStatut(),
                    currentUser());
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return occupationRepository.findById(id).map(occ -> {
            journalService.logAction("DELETE", "OCCUPATION",
                    "Suppression occupation '" + occ.getOccupant() + "' (" + occ.getTypeOccupation() + ")",
                    currentUser());
            occupationRepository.delete(occ);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
