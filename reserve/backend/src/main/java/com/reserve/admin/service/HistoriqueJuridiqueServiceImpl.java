package com.reserve.admin.service;

import com.reserve.admin.model.HistoriqueJuridique;
import com.reserve.admin.model.Reserve;
import com.reserve.admin.repository.HistoriqueJuridiqueRepository;
import com.reserve.admin.repository.ReserveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueJuridiqueServiceImpl implements HistoriqueJuridiqueService {

    @Autowired
    private HistoriqueJuridiqueRepository historiqueRepository;

    @Autowired
    private ReserveRepository reserveRepository;

    @Override
    public HistoriqueJuridique saveHistorique(HistoriqueJuridique historique) {
        if (historique.getReserve() != null && historique.getReserve().getId() != null) {
            Reserve reserve = reserveRepository.findById(historique.getReserve().getId())
                    .orElseThrow(() -> new RuntimeException("Reserve non trouvée"));
            historique.setReserve(reserve);
        }
        return historiqueRepository.save(historique);
    }

    @Override
    public List<HistoriqueJuridique> getAllHistoriques() {
        return historiqueRepository.findAll();
    }

    @Override
    public Optional<HistoriqueJuridique> getHistoriqueById(Long id) {
        return historiqueRepository.findById(id);
    }

    @Override
    public HistoriqueJuridique updateHistorique(Long id, HistoriqueJuridique historique) {
        return historiqueRepository.findById(id).map(existing -> {
            existing.setNatureActe(historique.getNatureActe());
            existing.setNumeroReference(historique.getNumeroReference());
            existing.setDateActe(historique.getDateActe());
            existing.setCommentaire(historique.getCommentaire());
            
            if (historique.getReserve() != null && historique.getReserve().getId() != null) {
                Reserve reserve = reserveRepository.findById(historique.getReserve().getId())
                        .orElseThrow(() -> new RuntimeException("Reserve non trouvée"));
                existing.setReserve(reserve);
            }

            return historiqueRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Historique non trouvé avec l'id " + id));
    }

    @Override
    public void deleteHistorique(Long id) {
        historiqueRepository.deleteById(id);
    }
}
