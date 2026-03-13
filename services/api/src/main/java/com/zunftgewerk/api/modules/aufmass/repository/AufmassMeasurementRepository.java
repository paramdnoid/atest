package com.zunftgewerk.api.modules.aufmass.repository;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassMeasurementEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AufmassMeasurementRepository extends JpaRepository<AufmassMeasurementEntity, UUID> {
    List<AufmassMeasurementEntity> findByTenantIdAndRecordIdAndDeletedAtIsNull(UUID tenantId, UUID recordId);
    Optional<AufmassMeasurementEntity> findByTenantIdAndRecordIdAndId(UUID tenantId, UUID recordId, UUID id);
}
