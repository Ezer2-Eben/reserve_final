package com.reserve.admin.service;

import com.reserve.admin.model.JournalActivite;

import java.util.List;

public interface JournalActiviteService {
    void logAction(String action, String module, String description, String utilisateur);
    List<JournalActivite> getAll();
    List<JournalActivite> getRecent();
    List<JournalActivite> getByModule(String module);
}
