package com.zunftgewerk.api.modules.sync.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "entity_sync_state")
@IdClass(EntitySyncStateId.class)
public class EntitySyncStateEntity {

    @Id
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Id
    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Id
    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "server_version", nullable = false)
    private long serverVersion;

    @Column(name = "vector_clock_json", nullable = false)
    private String vectorClockJson;

    @Column(name = "deleted", nullable = false)
    private boolean deleted;

    @Column(name = "tombstoned_at")
    private OffsetDateTime tombstonedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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

    public long getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(long serverVersion) {
        this.serverVersion = serverVersion;
    }

    public String getVectorClockJson() {
        return vectorClockJson;
    }

    public void setVectorClockJson(String vectorClockJson) {
        this.vectorClockJson = vectorClockJson;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public OffsetDateTime getTombstonedAt() {
        return tombstonedAt;
    }

    public void setTombstonedAt(OffsetDateTime tombstonedAt) {
        this.tombstonedAt = tombstonedAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
