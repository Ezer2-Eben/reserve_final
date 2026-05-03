package com.reserve.admin.repository;
import com.reserve.admin.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur,Long> {
    Optional<Utilisateur> findByUsername(String username);
    Optional<Utilisateur> findByUsernameIgnoreCase(String username);
    Optional<Utilisateur> findByEmailIgnoreCase(String email);
}

