package com.reserve.admin.service;

import com.reserve.admin.model.Projet;

import java.util.List;
import java.util.Optional;

public interface ProjetService {
    Projet saveProjet(Projet projet);
    Optional<Projet> getProjetById(Long id); // pour récupérer un projet par ID (avec gestion de null)
    List<Projet> getAllProjets();
    Projet updateProjet(Long id , Projet projet); // pour mise à jour
    void deleteProjet(Long id);
}
