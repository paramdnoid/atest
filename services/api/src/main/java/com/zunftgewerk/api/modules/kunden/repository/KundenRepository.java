package com.zunftgewerk.api.modules.kunden.repository;

import com.zunftgewerk.api.modules.kunden.entity.KundenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KundenRepository extends JpaRepository<KundenEntity, UUID> {
    List<KundenEntity> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    Optional<KundenEntity> findByTenantIdAndId(UUID tenantId, UUID id);
    boolean existsByTenantIdAndNumber(UUID tenantId, String number);
}
