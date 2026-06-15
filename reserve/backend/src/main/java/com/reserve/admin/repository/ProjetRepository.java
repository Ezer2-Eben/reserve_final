package com.reserve.admin.repository;

import com.reserve.admin.model.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjetRepository extends JpaRepository<Projet, Long> {
    List<Projet> findByReserveId(Long reserveId);
    long countByReserveId(Long reserveId);
}
