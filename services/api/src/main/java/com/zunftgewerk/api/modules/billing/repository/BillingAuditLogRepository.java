package com.zunftgewerk.api.modules.billing.repository;

import com.zunftgewerk.api.modules.billing.entity.BillingAuditLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BillingAuditLogRepository extends JpaRepository<BillingAuditLogEntity, Long> {

    List<BillingAuditLogEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
}
