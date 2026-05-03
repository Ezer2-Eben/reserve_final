package com.reserve.admin.repository;

import com.reserve.admin.model.Alerte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlerteRepository  extends JpaRepository<Alerte, Long> {


}
