package com.reserve.admin.service;

import com.reserve.admin.model.JournalActivite;
import com.reserve.admin.repository.JournalActiviteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JournalActiviteServiceImpl implements JournalActiviteService {

    @Autowired
    private JournalActiviteRepository journalRepository;

    @Override
    public void logAction(String action, String module, String description, String utilisateur) {
        try {
            JournalActivite entry = new JournalActivite(action, module, description,
                    utilisateur != null ? utilisateur : "système");
            journalRepository.save(entry);
        } catch (Exception e) {
            // Ne pas bloquer l'opération principale si le logging échoue
            System.err.println(">>> [JOURNAL] Erreur lors du logging: " + e.getMessage());
        }
    }

    @Override
    public List<JournalActivite> getAll() {
        return journalRepository.findAllByOrderByDateActionDesc();
    }

    @Override
    public List<JournalActivite> getRecent() {
        return journalRepository.findTop20ByOrderByDateActionDesc();
    }

    @Override
    public List<JournalActivite> getByModule(String module) {
        return journalRepository.findByModuleOrderByDateActionDesc(module);
    }
}
