package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeReworkEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeReworkRepository extends JpaRepository<AbnahmeReworkEntity, UUID> {
    List<AbnahmeReworkEntity> findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(UUID tenantId, UUID abnahmeId);
    Optional<AbnahmeReworkEntity> findByTenantIdAndAbnahmeIdAndId(UUID tenantId, UUID abnahmeId, UUID id);
}
