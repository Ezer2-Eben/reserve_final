package com.reserve.admin.service;

import com.reserve.admin.model.Projet;
import com.reserve.admin.repository.ProjetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjetServiceImpl implements ProjetService {

    @Autowired
    private ProjetRepository projetRepository;


    @Override
    public Projet saveProjet(Projet projet) {
        return projetRepository.save(projet);
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

            return projetRepository.save(updated);
        }
        return null;
    }

    @Override
    public void deleteProjet(Long id) {
        projetRepository.deleteById(id);
    }
}
