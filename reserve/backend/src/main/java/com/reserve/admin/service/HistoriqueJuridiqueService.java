package com.reserve.admin.service;

import com.reserve.admin.model.HistoriqueJuridique;

import java.util.List;
import java.util.Optional;

public interface HistoriqueJuridiqueService {
    HistoriqueJuridique saveHistorique(HistoriqueJuridique historique);
    List<HistoriqueJuridique> getAllHistoriques();
    Optional<HistoriqueJuridique> getHistoriqueById(Long id);
    HistoriqueJuridique updateHistorique(Long id, HistoriqueJuridique historique);
    void deleteHistorique(Long id);
}
