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
            Utilisateur utilisateur = utilisateurOptional.get();
            if (passwordEncoder.matches(password, utilisateur.getPassword())) {
                return utilisateur;
            } else {
                return null;
            }
        } else {
            if ("admin".equalsIgnoreCase(username)) {
                return null;
            }
            Utilisateur nouvelUtilisateur = new Utilisateur(username, username, passwordEncoder.encode(password), Role.USER);
            return utilisateurRepository.save(nouvelUtilisateur);
        }
    }

    @Override
    public Utilisateur enregistrer(Utilisateur utilisateur) {
        utilisateur.setPassword(passwordEncoder.encode(utilisateur.getPassword()));
        if (utilisateur.getEmail() == null || utilisateur.getEmail().isEmpty()) {
            utilisateur.setEmail(utilisateur.getUsername() + "@reserve.local");
        }
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

    @Override
    public Optional<Utilisateur> getById(Long id) {
        return utilisateurRepository.findById(id);
    }

    @Override
    public Utilisateur updateUtilisateur(Long id, Utilisateur data) {
        return utilisateurRepository.findById(id).map(existing -> {
            if (data.getUsername() != null && !data.getUsername().isEmpty()) {
                existing.setUsername(data.getUsername());
            }
            if (data.getEmail() != null && !data.getEmail().isEmpty()) {
                existing.setEmail(data.getEmail());
            }
            if (data.getRole() != null) {
                existing.setRole(data.getRole());
            }
            existing.setActif(data.isActif());
            return utilisateurRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));
    }

    @Override
    public void deleteUtilisateur(Long id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé avec l'id: " + id);
        }
        utilisateurRepository.deleteById(id);
    }

    @Override
    public void resetPassword(Long id, String newPassword) {
        utilisateurRepository.findById(id).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(user);
        }, () -> {
            throw new RuntimeException("Utilisateur non trouvé avec l'id: " + id);
        });
    }

    @Override
    public Utilisateur toggleActif(Long id) {
        return utilisateurRepository.findById(id).map(user -> {
            user.setActif(!user.isActif());
            return utilisateurRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + id));
    }
}