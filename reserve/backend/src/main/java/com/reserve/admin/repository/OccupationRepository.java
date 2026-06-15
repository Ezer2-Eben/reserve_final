package com.reserve.admin.repository;

import com.reserve.admin.model.Occupation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OccupationRepository extends JpaRepository<Occupation, Long> {
    List<Occupation> findByReserveId(Long reserveId);
    List<Occupation> findByStatut(Occupation.StatutOccupation statut);
    List<Occupation> findByTypeOccupation(Occupation.TypeOccupation type);
    long countByReserveId(Long reserveId);
}
