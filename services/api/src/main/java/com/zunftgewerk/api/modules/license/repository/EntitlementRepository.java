package com.zunftgewerk.api.modules.license.repository;

import com.zunftgewerk.api.modules.license.entity.EntitlementEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EntitlementRepository extends JpaRepository<EntitlementEntity, UUID> {
    List<EntitlementEntity> findByTenantId(UUID tenantId);
}
