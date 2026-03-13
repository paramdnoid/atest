package com.zunftgewerk.api.modules.angebote.repository;

import com.zunftgewerk.api.modules.angebote.entity.AngebotPositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AngebotPositionRepository extends JpaRepository<AngebotPositionEntity, UUID> {
    List<AngebotPositionEntity> findByTenantIdAndQuoteIdAndDeletedAtIsNull(UUID tenantId, UUID quoteId);
    Optional<AngebotPositionEntity> findByTenantIdAndQuoteIdAndId(UUID tenantId, UUID quoteId, UUID id);
}
