package com.zunftgewerk.api.modules.aufmass.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_aufmass_measurement")
public class AufmassMeasurementEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "position_id", nullable = false)
    private UUID positionId;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "formula", nullable = false)
    private String formula;

    @Column(name = "formula_ast_json")
    private String formulaAstJson;

    @Column(name = "formula_source")
    private String formulaSource;

    @Column(name = "formula_migration_status")
    private String formulaMigrationStatus;

    @Column(name = "quantity", nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "note")
    private String note;

    @Column(name = "photo_count")
    private Integer photoCount;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }
    public String getFormulaAstJson() { return formulaAstJson; }
    public void setFormulaAstJson(String formulaAstJson) { this.formulaAstJson = formulaAstJson; }
    public String getFormulaSource() { return formulaSource; }
    public void setFormulaSource(String formulaSource) { this.formulaSource = formulaSource; }
    public String getFormulaMigrationStatus() { return formulaMigrationStatus; }
    public void setFormulaMigrationStatus(String formulaMigrationStatus) { this.formulaMigrationStatus = formulaMigrationStatus; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Integer getPhotoCount() { return photoCount; }
    public void setPhotoCount(Integer photoCount) { this.photoCount = photoCount; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(OffsetDateTime deletedAt) { this.deletedAt = deletedAt; }
    public UUID getDeletedBy() { return deletedBy; }
    public void setDeletedBy(UUID deletedBy) { this.deletedBy = deletedBy; }
    public String getDeleteReason() { return deleteReason; }
    public void setDeleteReason(String deleteReason) { this.deleteReason = deleteReason; }
}
