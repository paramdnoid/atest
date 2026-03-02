package com.zunftgewerk.api.modules.sync.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "change_log")
public class ChangeLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "operation", nullable = false)
    private String operation;

    @Column(name = "payload_delta", nullable = false)
    private String payloadDelta;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "operation_vector_json", nullable = false)
    private String operationVectorJson;

    @Column(name = "result_vector_json", nullable = false)
    private String resultVectorJson;

    @Column(name = "conflict", nullable = false)
    private boolean conflict;

    @Column(name = "server_version", nullable = false)
    private long serverVersion;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    public Long getId() {
        return id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getPayloadDelta() {
        return payloadDelta;
    }

    public void setPayloadDelta(String payloadDelta) {
        this.payloadDelta = payloadDelta;
    }

    public long getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(long serverVersion) {
        this.serverVersion = serverVersion;
    }

    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(OffsetDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getOperationVectorJson() {
        return operationVectorJson;
    }

    public void setOperationVectorJson(String operationVectorJson) {
        this.operationVectorJson = operationVectorJson;
    }

    public String getResultVectorJson() {
        return resultVectorJson;
    }

    public void setResultVectorJson(String resultVectorJson) {
        this.resultVectorJson = resultVectorJson;
    }

    public boolean isConflict() {
        return conflict;
    }

    public void setConflict(boolean conflict) {
        this.conflict = conflict;
    }
}
