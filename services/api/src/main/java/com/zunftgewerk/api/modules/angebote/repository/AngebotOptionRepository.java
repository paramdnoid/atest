package com.zunftgewerk.api.modules.angebote.repository;

import com.zunftgewerk.api.modules.angebote.entity.AngebotOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AngebotOptionRepository extends JpaRepository<AngebotOptionEntity, UUID> {
    List<AngebotOptionEntity> findByTenantIdAndQuoteIdAndDeletedAtIsNull(UUID tenantId, UUID quoteId);
    Optional<AngebotOptionEntity> findByTenantIdAndQuoteIdAndId(UUID tenantId, UUID quoteId, UUID id);
}
