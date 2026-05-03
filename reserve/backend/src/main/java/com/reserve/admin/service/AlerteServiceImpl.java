package com.reserve.admin.service;

import com.reserve.admin.model.Alerte;
import com.reserve.admin.repository.AlerteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlerteServiceImpl implements AlerteService {

    @Autowired
    private AlerteRepository alerteRepository;

    @Override
    public Alerte saveAlerte(Alerte alerte) {
        return alerteRepository.save(alerte);
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

            return alerteRepository.save(updated);
        }
        return null;
    }

    @Override
    public void deleteAlerte(Long id) {
        alerteRepository.deleteById(id);
    }
}
