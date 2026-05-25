package com.reserve.admin.service;

import com.reserve.admin.model.Alerte;
import com.reserve.admin.repository.AlerteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlerteServiceImpl implements AlerteService {

    @Autowired
    private AlerteRepository alerteRepository;

    @Autowired
    private JournalActiviteService journalService;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "système";
    }

    @Override
    public Alerte saveAlerte(Alerte alerte) {
        Alerte saved = alerteRepository.save(alerte);
        journalService.logAction("CREATE", "ALERTE",
                "Création d'une alerte de type '" + saved.getType() + "' niveau " + saved.getNiveau()
                + (saved.getReserve() != null ? " pour la réserve '" + saved.getReserve().getNom() + "'" : ""),
                getCurrentUsername());
        return saved;
    }

    @Override
    public List<Alerte> getAllAlertes() {
        return alerteRepository.findAll();
    }

    @Override
    public Optional<Alerte> getAlerteById(Long id) {
        return alerteRepository.findById(id);
    }

    @Override
    public Alerte updateAlerte(Long id, Alerte alerte) {
        Optional<Alerte> existing = alerteRepository.findById(id);
        if (existing.isPresent()) {
            Alerte updated = existing.get();
            updated.setType(alerte.getType());
            updated.setDescription(alerte.getDescription());
            updated.setNiveau(alerte.getNiveau());
            updated.setReserve(alerte.getReserve());
            Alerte saved = alerteRepository.save(updated);
            journalService.logAction("UPDATE", "ALERTE",
                    "Modification de l'alerte '" + saved.getType() + "' — niveau: " + saved.getNiveau(),
                    getCurrentUsername());
            return saved;
        }
        return null;
    }

    @Override
    public void deleteAlerte(Long id) {
        alerteRepository.findById(id).ifPresent(a ->
            journalService.logAction("DELETE", "ALERTE",
                    "Suppression de l'alerte '" + a.getType() + "'",
                    getCurrentUsername())
        );
        alerteRepository.deleteById(id);
    }
}
