package com.reserve.admin.service;

import com.reserve.admin.model.Utilisateur;

import java.util.List;
import java.util.Optional;

public interface UtilisateurService {
    Utilisateur connecterOuCreerUtilisateur(String username, String password);
    Utilisateur enregistrer(Utilisateur utilisateur);
    Optional<Utilisateur> rechercherParNom(String username);
    Utilisateur getByUsername(String username);
    List<Utilisateur> listerUtilisateurs();
}