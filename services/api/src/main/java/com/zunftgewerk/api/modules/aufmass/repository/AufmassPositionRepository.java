package com.zunftgewerk.api.modules.aufmass.repository;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassPositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AufmassPositionRepository extends JpaRepository<AufmassPositionEntity, UUID> {
    List<AufmassPositionEntity> findByTenantIdAndRecordIdAndDeletedAtIsNull(UUID tenantId, UUID recordId);
    Optional<AufmassPositionEntity> findByTenantIdAndRecordIdAndId(UUID tenantId, UUID recordId, UUID id);
}
