package com.reserve.admin.controller;
import com.reserve.admin.model.Role;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.service.UtilisateurService;
import com.reserve.admin.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // Token generation handled by JwtUtils



    // ✅ Inscription - Désormais restreinte à l'ADMIN
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
            // 🔒 Validation
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

            // 🔍 Vérification d'existence
            if (utilisateurService.rechercherParNom(utilisateur.getUsername()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "status", "error",
                        "message", "Ce nom d'utilisateur est déjà pris."
                ));
            }

            // 🎯 Rôle par défaut si non spécifié
            if (utilisateur.getRole() == null) {
                utilisateur.setRole(Role.USER);
            }

            // 💾 Enregistrement
            Utilisateur savedUser = utilisateurService.enregistrer(utilisateur);

            // 🪪 Création du token facultative ici car l'admin crée pour quelqu'un d'autre
            // Mais on garde la structure de réponse pour la compatibilité
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


    // ✅ ADMIN uniquement
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.listerUtilisateurs());
    }
}
