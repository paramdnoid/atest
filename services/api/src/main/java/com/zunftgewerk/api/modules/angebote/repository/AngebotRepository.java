package com.zunftgewerk.api.modules.angebote.repository;

import com.zunftgewerk.api.modules.angebote.entity.AngebotEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AngebotRepository extends JpaRepository<AngebotEntity, UUID> {
    List<AngebotEntity> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    Optional<AngebotEntity> findByTenantIdAndId(UUID tenantId, UUID id);
    boolean existsByTenantIdAndNumber(UUID tenantId, String number);
}
