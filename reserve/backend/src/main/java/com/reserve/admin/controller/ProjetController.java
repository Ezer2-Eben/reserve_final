package com.reserve.admin.controller;

import com.reserve.admin.model.Projet;
import com.reserve.admin.service.ProjetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@CrossOrigin(origins = "*")
public class ProjetController {

    @Autowired
    private ProjetService projetService;
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Projet createProjet(@RequestBody Projet projet) {
        return projetService.saveProjet(projet);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<Projet> getAllProjets() {
        return projetService.getAllProjets();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public Projet getProjetById(@PathVariable Long id) {
        return projetService.getProjetById(id).orElse(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Projet> updateProjet(@PathVariable Long id, @RequestBody Projet projet) {
        Projet updated = projetService.updateProjet(id, projet);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteProjet(@PathVariable Long id) {
        projetService.deleteProjet(id);
    }
}
