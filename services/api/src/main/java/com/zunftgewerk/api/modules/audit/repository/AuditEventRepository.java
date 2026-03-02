package com.zunftgewerk.api.modules.audit.repository;

import com.zunftgewerk.api.modules.audit.entity.AuditEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, UUID> {
}
