package com.reserve.admin.service;

import com.reserve.admin.model.Role;
import com.reserve.admin.model.Utilisateur;
import com.reserve.admin.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Utilisateur connecterOuCreerUtilisateur(String username, String password) {
        Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByUsernameIgnoreCase(username);

        if (utilisateurOptional.isPresent()) {
            // L'utilisateur existe, vérifier le mot de passe
            Utilisateur utilisateur = utilisateurOptional.get();
            if (passwordEncoder.matches(password, utilisateur.getPassword())) {
                return utilisateur; // Connexion réussie
            } else {
                return null; // Mot de passe incorrect
            }
        } else {
            // L'utilisateur n'existe pas, le créer si ce n'est pas "admin"
            if ("admin".equalsIgnoreCase(username)) {
                return null; // Interdit la création d'admin via cette méthode
            }
            Utilisateur nouvelUtilisateur = new Utilisateur(username, username, passwordEncoder.encode(password), Role.USER);
            return utilisateurRepository.save(nouvelUtilisateur);
        }
    }

    @Override
    public Utilisateur enregistrer(Utilisateur utilisateur) {
        // ✅ Encoder le mot de passe UNE SEULE FOIS ici
        utilisateur.setPassword(passwordEncoder.encode(utilisateur.getPassword()));
        return utilisateurRepository.save(utilisateur);
    }

    @Override
    public Optional<Utilisateur> rechercherParNom(String username) {
        return utilisateurRepository.findByUsernameIgnoreCase(username);
    }

    @Override
    public Utilisateur getByUsername(String username) {
        return rechercherParNom(username).orElse(null);
    }

    @Override
    public List<Utilisateur> listerUtilisateurs() {
        return utilisateurRepository.findAll();
    }
}