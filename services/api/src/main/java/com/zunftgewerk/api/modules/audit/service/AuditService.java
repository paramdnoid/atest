package com.zunftgewerk.api.modules.audit.service;

import com.zunftgewerk.api.modules.audit.entity.AuditEventEntity;
import com.zunftgewerk.api.modules.audit.repository.AuditEventRepository;
import com.zunftgewerk.api.shared.audit.AuditEventType;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    public void record(UUID tenantId, UUID actorUserId, AuditEventType eventType, String payloadJson) {
        AuditEventEntity event = new AuditEventEntity();
        event.setId(UUID.randomUUID());
        event.setTenantId(tenantId);
        event.setActorUserId(actorUserId);
        event.setEventType(eventType.name());
        event.setPayloadJson(payloadJson);
        event.setOccurredAt(OffsetDateTime.now());
        repository.save(event);
    }
}
