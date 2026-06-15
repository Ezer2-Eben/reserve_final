package com.reserve.admin.repository;

import com.reserve.admin.model.Alerte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlerteRepository extends JpaRepository<Alerte, Long> {
    List<Alerte> findByReserveId(Long reserveId);
    long countByReserveId(Long reserveId);
}
