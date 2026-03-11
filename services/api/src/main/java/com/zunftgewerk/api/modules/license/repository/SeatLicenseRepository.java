package com.zunftgewerk.api.modules.license.repository;

import com.zunftgewerk.api.modules.license.entity.SeatLicenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeatLicenseRepository extends JpaRepository<SeatLicenseEntity, UUID> {
    List<SeatLicenseEntity> findByTenantId(UUID tenantId);
    List<SeatLicenseEntity> findByTenantIdAndStatus(UUID tenantId, String status);
    Optional<SeatLicenseEntity> findByTenantIdAndUserIdAndStatus(UUID tenantId, UUID userId, String status);

    @Query("select count(s) from SeatLicenseEntity s where s.tenantId = :tenantId and s.status = 'ACTIVE'")
    long countActiveByTenantId(UUID tenantId);
}
