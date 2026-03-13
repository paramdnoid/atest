package com.zunftgewerk.api.modules.aufmass.repository;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassRoomEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AufmassRoomRepository extends JpaRepository<AufmassRoomEntity, UUID> {
    List<AufmassRoomEntity> findByTenantIdAndRecordIdAndDeletedAtIsNull(UUID tenantId, UUID recordId);
    Optional<AufmassRoomEntity> findByTenantIdAndRecordIdAndId(UUID tenantId, UUID recordId, UUID id);
}
