package com.zunftgewerk.api.modules.sync.repository;

import com.zunftgewerk.api.modules.sync.entity.ClientOperationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientOperationRepository extends JpaRepository<ClientOperationEntity, String> {
}
