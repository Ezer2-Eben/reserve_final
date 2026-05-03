package com.reserve.admin.controller;

import com.reserve.admin.model.HistoriqueJuridique;
import com.reserve.admin.service.HistoriqueJuridiqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/historiques")
@CrossOrigin(origins = "*")
public class HistoriqueJuridiqueController {

    @Autowired
    private HistoriqueJuridiqueService historiqueService;
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public HistoriqueJuridique create(@RequestBody HistoriqueJuridique historique) {
        return historiqueService.saveHistorique(historique);
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<HistoriqueJuridique> getAll() {
        return historiqueService.getAllHistoriques();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public Optional<HistoriqueJuridique> getById(@PathVariable Long id) {
        return historiqueService.getHistoriqueById(id);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public HistoriqueJuridique update(@PathVariable Long id, @RequestBody HistoriqueJuridique historique) {
        return historiqueService.updateHistorique(id, historique);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        historiqueService.deleteHistorique(id);
    }
}
