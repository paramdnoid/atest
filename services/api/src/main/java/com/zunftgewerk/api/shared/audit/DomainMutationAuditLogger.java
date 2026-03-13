package com.zunftgewerk.api.shared.audit;

import com.zunftgewerk.api.modules.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DomainMutationAuditLogger {

    private static final Logger log = LoggerFactory.getLogger(DomainMutationAuditLogger.class);

    private final ObjectProvider<AuditService> auditServiceProvider;

    public DomainMutationAuditLogger(ObjectProvider<AuditService> auditServiceProvider) {
        this.auditServiceProvider = auditServiceProvider;
    }

    public void recordMutation(String domain, String operation, UUID tenantId, UUID actorUserId, UUID entityId) {
        if (tenantId == null || actorUserId == null || entityId == null) {
            return;
        }
        AuditService auditService = auditServiceProvider.getIfAvailable();
        if (auditService == null) {
            return;
        }
        try {
            auditService.record(tenantId, actorUserId, AuditEventType.DOMAIN_MUTATION, buildPayload(domain, operation, entityId));
        } catch (RuntimeException ex) {
            log.warn("Skipping domain mutation audit event after persistence error: domain={}, operation={}", domain, operation, ex);
        }
    }

    private String buildPayload(String domain, String operation, UUID entityId) {
        return "{"
            + "\"domain\":\"" + escapeJson(domain) + "\","
            + "\"operation\":\"" + escapeJson(operation) + "\","
            + "\"entityId\":\"" + entityId + "\""
            + "}";
    }

    private String escapeJson(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
