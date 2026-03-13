package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeParticipantRepository extends JpaRepository<AbnahmeParticipantEntity, UUID> {
    List<AbnahmeParticipantEntity> findByTenantIdAndAbnahmeId(UUID tenantId, UUID abnahmeId);
    Optional<AbnahmeParticipantEntity> findByTenantIdAndAbnahmeIdAndId(UUID tenantId, UUID abnahmeId, UUID id);
}
