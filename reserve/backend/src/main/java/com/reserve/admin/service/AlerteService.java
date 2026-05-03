package com.reserve.admin.service;

import com.reserve.admin.model.Alerte;

import java.util.List;
import java.util.Optional;

public interface AlerteService {
    Alerte saveAlerte(Alerte alerte);
    List<Alerte> getAllAlertes();
    Optional<Alerte> getAlerteById(Long id);
    Alerte updateAlerte(Long id, Alerte alerte);
    void deleteAlerte(Long id);
}
