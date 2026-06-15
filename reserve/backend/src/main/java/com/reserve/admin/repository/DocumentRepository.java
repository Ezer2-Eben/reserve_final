package com.reserve.admin.repository;

import com.reserve.admin.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByReserveId(Long reserveId);
    List<Document> findByProjetId(Long projetId);
    long countByReserveId(Long reserveId);
}