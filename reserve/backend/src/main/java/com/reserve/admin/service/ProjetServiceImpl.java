package com.reserve.admin.service;

import com.reserve.admin.model.Projet;
import com.reserve.admin.repository.ProjetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjetServiceImpl implements ProjetService {

    @Autowired
    private ProjetRepository projetRepository;

    @Autowired
    private JournalActiviteService journalService;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "système";
    }

    @Override
    public Projet saveProjet(Projet projet) {
        Projet saved = projetRepository.save(projet);
        journalService.logAction("CREATE", "PROJET",
                "Création du projet '" + saved.getNomProjet() + "'"
                + (saved.getReserve() != null ? " lié à la réserve '" + saved.getReserve().getNom() + "'" : ""),
                getCurrentUsername());
        return saved;
    }

    @Override
    public List<Projet> getAllProjets() {
        return projetRepository.findAll();
    }

    @Override
    public Optional<Projet> getProjetById(Long id) {
        return projetRepository.findById(id);
    }

    @Override
    public Projet updateProjet(Long id, Projet projet) {
        Optional<Projet> existing = projetRepository.findById(id);
        if (existing.isPresent()) {
            Projet updated = existing.get();
            updated.setNomProjet(projet.getNomProjet());
            updated.setMaitreOuvrage(projet.getMaitreOuvrage());
            updated.setDateDebut(projet.getDateDebut());
            updated.setDateFin(projet.getDateFin());
            updated.setFinancement(projet.getFinancement());
            updated.setStatut(projet.getStatut());
            updated.setReserve(projet.getReserve());
            Projet saved = projetRepository.save(updated);
            journalService.logAction("UPDATE", "PROJET",
                    "Modification du projet '" + saved.getNomProjet() + "' — statut: " + saved.getStatut(),
                    getCurrentUsername());
            return saved;
        }
        return null;
    }

    @Override
    public void deleteProjet(Long id) {
        projetRepository.findById(id).ifPresent(p ->
            journalService.logAction("DELETE", "PROJET",
                    "Suppression du projet '" + p.getNomProjet() + "'",
                    getCurrentUsername())
        );
        projetRepository.deleteById(id);
    }
}
