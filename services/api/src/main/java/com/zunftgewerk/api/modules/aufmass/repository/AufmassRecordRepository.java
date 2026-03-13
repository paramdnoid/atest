package com.zunftgewerk.api.modules.aufmass.repository;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AufmassRecordRepository extends JpaRepository<AufmassRecordEntity, UUID> {
    List<AufmassRecordEntity> findByTenantIdAndDeletedAtIsNull(UUID tenantId);
    Optional<AufmassRecordEntity> findByTenantIdAndId(UUID tenantId, UUID id);
    boolean existsByTenantIdAndNumber(UUID tenantId, String number);
}
