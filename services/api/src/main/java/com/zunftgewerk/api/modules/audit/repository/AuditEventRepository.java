package com.zunftgewerk.api.modules.audit.repository;

import com.zunftgewerk.api.modules.audit.entity.AuditEventEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link AuditEventEntity} records.
 *
 * <p>Provides tenant-scoped query methods used by the audit export endpoint.
 * All derived queries are handled by Spring Data JPA — no custom implementations.
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, UUID> {

    /**
     * Returns audit events for a given tenant, ordered newest-first, with
     * pagination support for the export endpoint.
     *
     * @param tenantId the tenant whose events to query
     * @param pageable page size and offset specification
     * @return ordered, paginated list of audit events
     */
    List<AuditEventEntity> findByTenantIdOrderByOccurredAtDesc(UUID tenantId, Pageable pageable);
}
