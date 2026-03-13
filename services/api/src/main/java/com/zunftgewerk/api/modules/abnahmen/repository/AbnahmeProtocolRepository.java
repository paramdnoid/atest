package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeProtocolEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AbnahmeProtocolRepository extends JpaRepository<AbnahmeProtocolEntity, UUID> {
    Optional<AbnahmeProtocolEntity> findByTenantIdAndAbnahmeId(UUID tenantId, UUID abnahmeId);
    Optional<AbnahmeProtocolEntity> findByTenantIdAndAbnahmeIdAndId(UUID tenantId, UUID abnahmeId, UUID id);
}
