package com.zunftgewerk.api.modules.abnahmen.repository;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AbnahmeRecordRepository extends JpaRepository<AbnahmeRecordEntity, UUID> {
    List<AbnahmeRecordEntity> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    Optional<AbnahmeRecordEntity> findByTenantIdAndId(UUID tenantId, UUID id);
    boolean existsByTenantIdAndNumber(UUID tenantId, String number);
}
