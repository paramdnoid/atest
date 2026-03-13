package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeDefectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeDefectRepository extends JpaRepository<AbnahmeDefectEntity, UUID> {
    List<AbnahmeDefectEntity> findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(UUID tenantId, UUID abnahmeId);
    Optional<AbnahmeDefectEntity> findByTenantIdAndAbnahmeIdAndId(UUID tenantId, UUID abnahmeId, UUID id);
}
