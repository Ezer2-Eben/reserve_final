package com.reserve.admin.repository;

import com.reserve.admin.model.JournalActivite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalActiviteRepository extends JpaRepository<JournalActivite, Long> {
    List<JournalActivite> findAllByOrderByDateActionDesc();
    List<JournalActivite> findTop20ByOrderByDateActionDesc();
    List<JournalActivite> findByModuleOrderByDateActionDesc(String module);
    List<JournalActivite> findByUtilisateurOrderByDateActionDesc(String utilisateur);
}
