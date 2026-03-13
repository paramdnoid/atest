package com.zunftgewerk.api.modules.aufmass.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_aufmass_mapping")
public class AufmassMappingEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "position_id", nullable = false)
    private UUID positionId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "mapped_by", nullable = false)
    private String mappedBy;

    @Column(name = "mapped_at", nullable = false)
    private OffsetDateTime mappedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @Column(name = "delete_reason")
    private String deleteReason;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getRecordId() { return recordId; }
    public void setRecordId(UUID recordId) { this.recordId = recordId; }
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
    public String getMappedBy() { return mappedBy; }
    public void setMappedBy(String mappedBy) { this.mappedBy = mappedBy; }
    public OffsetDateTime getMappedAt() { return mappedAt; }
    public void setMappedAt(OffsetDateTime mappedAt) { this.mappedAt = mappedAt; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(OffsetDateTime deletedAt) { this.deletedAt = deletedAt; }
    public UUID getDeletedBy() { return deletedBy; }
    public void setDeletedBy(UUID deletedBy) { this.deletedBy = deletedBy; }
    public String getDeleteReason() { return deleteReason; }
    public void setDeleteReason(String deleteReason) { this.deleteReason = deleteReason; }
}
