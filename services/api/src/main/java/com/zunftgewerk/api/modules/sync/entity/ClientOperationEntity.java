package com.zunftgewerk.api.modules.sync.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "client_operations")
public class ClientOperationEntity {

    @Id
    @Column(name = "client_op_id")
    private String clientOpId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "applied_status", nullable = false)
    private String appliedStatus;

    @Column(name = "resolution", nullable = false)
    private String resolution;

    @Column(name = "operation_vector_json", nullable = false)
    private String operationVectorJson;

    @Column(name = "server_vector_json", nullable = false)
    private String serverVectorJson;

    @Column(name = "conflict_type")
    private String conflictType;

    @Column(name = "resolved_payload_json")
    private String resolvedPayloadJson;

    @Column(name = "server_version", nullable = false)
    private long serverVersion;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public String getClientOpId() {
        return clientOpId;
    }

    public void setClientOpId(String clientOpId) {
        this.clientOpId = clientOpId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getAppliedStatus() {
        return appliedStatus;
    }

    public void setAppliedStatus(String appliedStatus) {
        this.appliedStatus = appliedStatus;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getOperationVectorJson() {
        return operationVectorJson;
    }

    public void setOperationVectorJson(String operationVectorJson) {
        this.operationVectorJson = operationVectorJson;
    }

    public String getServerVectorJson() {
        return serverVectorJson;
    }

    public void setServerVectorJson(String serverVectorJson) {
        this.serverVectorJson = serverVectorJson;
    }

    public String getConflictType() {
        return conflictType;
    }

    public void setConflictType(String conflictType) {
        this.conflictType = conflictType;
    }

    public String getResolvedPayloadJson() {
        return resolvedPayloadJson;
    }

    public void setResolvedPayloadJson(String resolvedPayloadJson) {
        this.resolvedPayloadJson = resolvedPayloadJson;
    }

    public long getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(long serverVersion) {
        this.serverVersion = serverVersion;
    }
}
