package com.zunftgewerk.api.modules.sync.repository;

import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChangeLogRepository extends JpaRepository<ChangeLogEntity, Long> {
    List<ChangeLogEntity> findByTenantIdAndIdGreaterThanOrderByIdAsc(UUID tenantId, Long afterCursor);
    Optional<ChangeLogEntity> findTopByTenantIdAndEntityTypeAndEntityIdOrderByIdDesc(UUID tenantId, String entityType, String entityId);
}
