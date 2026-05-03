package com.reserve.admin.repository;

import com.reserve.admin.model.Reserve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReserveRepository extends JpaRepository<Reserve, Long> {
    // Vous pouvez ajouter des méthodes de recherche personnalisées
    List<Reserve> findByType(String type);
    List<Reserve> findByStatut(String statut);
    List<Reserve> findByProprietaire(String proprietaire);
}