package com.reserve.admin.service;

import com.reserve.admin.model.HistoriqueJuridique;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.HistoriqueJuridiqueRepository;
import com.reserve.admin.repository.ReserveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ReserveService {

    private final ReserveRepository reserveRepository;
    private final HistoriqueJuridiqueRepository historiqueRepository;

    @Autowired
    public ReserveService(ReserveRepository reserveRepository, HistoriqueJuridiqueRepository historiqueRepository) {
        this.reserveRepository = reserveRepository;
        this.historiqueRepository = historiqueRepository;
    }

    public List<Reserve> getAllReserves() {
        return reserveRepository.findAll();
    }

    public Optional<Reserve> getReserveById(Long id) {
        return reserveRepository.findById(id);
    }

    public Reserve createReserve(Reserve reserve) {
        // Validation supplémentaire si nécessaire
        if (reserve.getZone() == null || reserve.getZone().isEmpty()) {
            throw new IllegalArgumentException("La zone géographique est obligatoire");
        }

        // Calcul automatique du centre si non fourni
        if (reserve.getLatitude() == null || reserve.getLongitude() == null) {
            // Vous pourriez ajouter une logique pour extraire le centre du GeoJSON
            // Pour l'instant, on garde les valeurs fournies
        }

        Reserve savedReserve = reserveRepository.save(reserve);

        // Création automatique de l'historique
        HistoriqueJuridique historique = new HistoriqueJuridique();
        historique.setNatureActe("AUTRE");
        historique.setNumeroReference("AUTO-" + savedReserve.getId());
        historique.setDateActe(LocalDate.now());
        historique.setCommentaire("Création initiale de la réserve");
        historique.setReserve(savedReserve);
        historiqueRepository.save(historique);

        return savedReserve;
    }

    public Reserve updateReserve(Long id, Reserve reserveDetails) {
        Optional<Reserve> optionalReserve = reserveRepository.findById(id);

        if (optionalReserve.isPresent()) {
            Reserve reserve = optionalReserve.get();

            // Mise à jour des champs
            reserve.setNom(reserveDetails.getNom());
            reserve.setLocalisation(reserveDetails.getLocalisation());
            reserve.setSuperficie(reserveDetails.getSuperficie());
            reserve.setType(reserveDetails.getType());
            reserve.setLatitude(reserveDetails.getLatitude());
            reserve.setLongitude(reserveDetails.getLongitude());
            reserve.setStatut(reserveDetails.getStatut());
            reserve.setDescription(reserveDetails.getDescription());
            reserve.setProprietaire(reserveDetails.getProprietaire());
            reserve.setReference(reserveDetails.getReference());

            // Mise à jour de la zone si fournie
            if (reserveDetails.getZone() != null && !reserveDetails.getZone().isEmpty()) {
                reserve.setZone(reserveDetails.getZone());
            }

            return reserveRepository.save(reserve);
        }

        return null;
    }

    public void deleteReserve(Long id) {
        reserveRepository.deleteById(id);
    }

    /**
     * Crée une réserve envoyée depuis l'application mobile Flutter.
     * Contrairement à createReserve(), ne valide pas la présence obligatoire du
     * champ zone.
     */
    public Reserve createReserveFromMobile(Reserve reserve) {
        // S'assurer que les champs obligatoires ont des valeurs par défaut
        if (reserve.getNom() == null || reserve.getNom().isBlank()) {
            reserve.setNom("Réserve sans nom");
        }
        if (reserve.getLocalisation() == null || reserve.getLocalisation().isBlank()) {
            reserve.setLocalisation("Non spécifiée");
        }
        if (reserve.getType() == null || reserve.getType().isBlank()) {
            reserve.setType("Mobile");
        }
        if (reserve.getStatut() == null || reserve.getStatut().isBlank()) {
            reserve.setStatut("Active");
        }
        if (reserve.getSuperficie() == null) {
            reserve.setSuperficie(0.0);
        }
        if (reserve.getZone() == null || reserve.getZone().isBlank()) {
            reserve.setZone("{}");
        }
        Reserve savedReserve = reserveRepository.save(reserve);

        // Création automatique de l'historique
        HistoriqueJuridique historique = new HistoriqueJuridique();
        historique.setNatureActe("AUTRE");
        historique.setNumeroReference("MOB-" + savedReserve.getId());
        historique.setDateActe(LocalDate.now());
        historique.setCommentaire("Création de la réserve depuis l'application mobile");
        historique.setReserve(savedReserve);
        historiqueRepository.save(historique);

        return savedReserve;
    }
}