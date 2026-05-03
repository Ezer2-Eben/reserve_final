// src/main/java/com/reserve/admin/repository/CommuneRepository.java
package com.reserve.admin.repository;

import com.reserve.admin.model.Commune;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommuneRepository extends JpaRepository<Commune, String> {
    List<Commune> findByRegion(String region);
    List<Commune> findByPrefecture(String prefecture);
}