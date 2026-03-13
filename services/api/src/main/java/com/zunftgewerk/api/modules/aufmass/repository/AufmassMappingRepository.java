package com.zunftgewerk.api.modules.aufmass.repository;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AufmassMappingRepository extends JpaRepository<AufmassMappingEntity, UUID> {
    List<AufmassMappingEntity> findByTenantIdAndRecordIdAndDeletedAtIsNull(UUID tenantId, UUID recordId);
    Optional<AufmassMappingEntity> findByTenantIdAndRecordIdAndId(UUID tenantId, UUID recordId, UUID id);
}
