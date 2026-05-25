package com.reserve.admin.repository;

import com.reserve.admin.model.Litige;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LitigeRepository extends JpaRepository<Litige, Long> {
    List<Litige> findByReserveId(Long reserveId);
    List<Litige> findByStatut(Litige.StatutLitige statut);
    List<Litige> findByType(Litige.TypeLitige type);
}
