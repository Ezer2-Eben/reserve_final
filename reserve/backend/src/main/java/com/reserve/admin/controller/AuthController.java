package com.reserve.admin.controller;

import com.reserve.admin.config.JwtUtils;
import com.reserve.admin.dto.LoginRequest;
import com.reserve.admin.dto.LoginResponse;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}) // Adapte selon ton frontend
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println(">>> DEBUG: Tentative de login pour: " + loginRequest.getUsername());
        System.out.println(">>> DEBUG: Password reçue: [" + loginRequest.getPassword() + "]");
        
        try {
            // 🔐 Authentification
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // ✅ Authentification réussie → contexte utilisateur défini
            SecurityContextHolder.getContext().setAuthentication(authentication);

                // 🔍 Recherche de l'utilisateur pour extraire son rôle (insensible à la casse, username ou email)
                Utilisateur utilisateur = utilisateurRepository.findByUsernameIgnoreCase(loginRequest.getUsername())
                    .or(() -> utilisateurRepository.findByEmailIgnoreCase(loginRequest.getUsername()))
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // 🎯 Génération du token
            String token = jwtUtils.generateToken(utilisateur.getUsername(), utilisateur.getRole().name());

            // 📦 Réponse au frontend
            LoginResponse response = new LoginResponse(token, utilisateur.getUsername(), utilisateur.getRole().name());
            logger.debug("Authentification réussie pour {} - rôle: {}", utilisateur.getUsername(), utilisateur.getRole().name());
            System.out.println(">>> DEBUG: Authentification réussie !");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println(">>> DEBUG: Erreur Auth: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            logger.debug("Erreur lors de l'authentification pour {}: {}", loginRequest.getUsername(), e.getMessage());
            // Renvoyer une réponse JSON structurée pour faciliter les traitements côté frontend
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Nom d'utilisateur ou mot de passe incorrect."));
        }
    }
}
