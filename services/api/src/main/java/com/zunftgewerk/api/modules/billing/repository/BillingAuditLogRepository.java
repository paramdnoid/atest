package com.zunftgewerk.api.modules.billing.repository;

import com.zunftgewerk.api.modules.billing.entity.BillingAuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingAuditLogRepository extends JpaRepository<BillingAuditLogEntity, Long> {
}
