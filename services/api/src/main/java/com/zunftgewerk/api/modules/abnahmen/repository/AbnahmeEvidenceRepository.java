package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeEvidenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeEvidenceRepository extends JpaRepository<AbnahmeEvidenceEntity, UUID> {
    List<AbnahmeEvidenceEntity> findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(UUID tenantId, UUID abnahmeId);
    Optional<AbnahmeEvidenceEntity> findByTenantIdAndAbnahmeIdAndId(UUID tenantId, UUID abnahmeId, UUID id);
}
