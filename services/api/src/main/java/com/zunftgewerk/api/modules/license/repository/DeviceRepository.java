package com.zunftgewerk.api.modules.license.repository;

import com.zunftgewerk.api.modules.license.entity.DeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<DeviceEntity, UUID> {
    List<DeviceEntity> findByTenantId(UUID tenantId);

    @Query("SELECT COUNT(d) FROM DeviceEntity d WHERE d.tenantId = :tenantId AND d.status = 'licensed'")
    long countLicensedByTenantId(UUID tenantId);
}
