package com.reserve.admin.controller;

import com.reserve.admin.model.Role;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.service.JournalActiviteService;
import com.reserve.admin.service.UtilisateurService;
import com.reserve.admin.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "*")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private JournalActiviteService journalService;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "système";
    }

    // ✅ Inscription - restreinte à l'ADMIN
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/inscription")
    public ResponseEntity<Map<String, Object>> inscription(@RequestBody Utilisateur utilisateur) {
        return createUtilisateur(utilisateur);
    }

    // ✅ Création d'utilisateur - ADMIN uniquement
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createUtilisateur(@RequestBody Utilisateur utilisateur) {
        try {
            if (utilisateur.getUsername() == null || utilisateur.getUsername().isEmpty() ||
                    utilisateur.getPassword() == null || utilisateur.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Le nom d'utilisateur et le mot de passe sont requis."
                ));
            }
            if (utilisateur.getPassword().length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Le mot de passe doit contenir au moins 8 caractères."
                ));
            }
            if (utilisateurService.rechercherParNom(utilisateur.getUsername()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "status", "error",
                        "message", "Ce nom d'utilisateur est déjà pris."
                ));
            }
            if (utilisateur.getRole() == null) {
                utilisateur.setRole(Role.USER);
            }

            Utilisateur savedUser = utilisateurService.enregistrer(utilisateur);
            journalService.logAction("CREATE", "UTILISATEUR",
                    "Création de l'utilisateur '" + savedUser.getUsername() + "' avec le rôle " + savedUser.getRole(),
                    getCurrentUsername());

            String token = jwtUtils.generateToken(savedUser.getUsername(), savedUser.getRole().toString());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Utilisateur créé avec succès !");
            response.put("token", token);
            response.put("username", savedUser.getUsername());
            response.put("role", savedUser.getRole().toString());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de la création de l'utilisateur : " + e.getMessage()
            ));
        }
    }

    // ✅ Liste tous les utilisateurs
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.listerUtilisateurs());
    }

    // ✅ Get utilisateur by ID
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getUtilisateurById(@PathVariable Long id) {
        return utilisateurService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Modifier un utilisateur (role, email, actif)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUtilisateur(@PathVariable Long id, @RequestBody Utilisateur data) {
        try {
            Utilisateur updated = utilisateurService.updateUtilisateur(id, data);
            journalService.logAction("UPDATE", "UTILISATEUR",
                    "Modification de l'utilisateur '" + updated.getUsername() + "' — rôle: " + updated.getRole(),
                    getCurrentUsername());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Supprimer un utilisateur
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUtilisateur(@PathVariable Long id) {
        try {
            utilisateurService.getById(id).ifPresent(u ->
                journalService.logAction("DELETE", "UTILISATEUR",
                    "Suppression de l'utilisateur '" + u.getUsername() + "'",
                    getCurrentUsername())
            );
            utilisateurService.deleteUtilisateur(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Réinitialiser le mot de passe
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Le nouveau mot de passe doit contenir au moins 8 caractères."
            ));
        }
        try {
            utilisateurService.resetPassword(id, newPassword);
            utilisateurService.getById(id).ifPresent(u ->
                journalService.logAction("UPDATE", "UTILISATEUR",
                    "Réinitialisation du mot de passe de '" + u.getUsername() + "'",
                    getCurrentUsername())
            );
            return ResponseEntity.ok(Map.of("status", "success", "message", "Mot de passe réinitialisé."));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Activer / Désactiver un utilisateur
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-actif")
    public ResponseEntity<?> toggleActif(@PathVariable Long id) {
        try {
            Utilisateur updated = utilisateurService.toggleActif(id);
            journalService.logAction("UPDATE", "UTILISATEUR",
                    "Compte '" + updated.getUsername() + "' " + (updated.isActif() ? "activé" : "désactivé"),
                    getCurrentUsername());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
