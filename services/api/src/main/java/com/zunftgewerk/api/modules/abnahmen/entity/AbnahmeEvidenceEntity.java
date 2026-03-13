package com.zunftgewerk.api.modules.abnahmen.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_abnahmen_evidence")
public class AbnahmeEvidenceEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "abnahme_id", nullable = false)
    private UUID abnahmeId;

    @Column(name = "defect_id")
    private UUID defectId;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "has_people", nullable = false)
    private boolean hasPeople;

    @Column(name = "has_license_plate", nullable = false)
    private boolean hasLicensePlate;

    @Column(name = "redacted", nullable = false)
    private boolean redacted;

    @Column(name = "legal_basis")
    private String legalBasis;

    @Column(name = "geo_lat")
    private Double geoLat;

    @Column(name = "geo_lng")
    private Double geoLng;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

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
    public UUID getAbnahmeId() { return abnahmeId; }
    public void setAbnahmeId(UUID abnahmeId) { this.abnahmeId = abnahmeId; }
    public UUID getDefectId() { return defectId; }
    public void setDefectId(UUID defectId) { this.defectId = defectId; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public boolean isHasPeople() { return hasPeople; }
    public void setHasPeople(boolean hasPeople) { this.hasPeople = hasPeople; }
    public boolean isHasLicensePlate() { return hasLicensePlate; }
    public void setHasLicensePlate(boolean hasLicensePlate) { this.hasLicensePlate = hasLicensePlate; }
    public boolean isRedacted() { return redacted; }
    public void setRedacted(boolean redacted) { this.redacted = redacted; }
    public String getLegalBasis() { return legalBasis; }
    public void setLegalBasis(String legalBasis) { this.legalBasis = legalBasis; }
    public Double getGeoLat() { return geoLat; }
    public void setGeoLat(Double geoLat) { this.geoLat = geoLat; }
    public Double getGeoLng() { return geoLng; }
    public void setGeoLng(Double geoLng) { this.geoLng = geoLng; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(OffsetDateTime deletedAt) { this.deletedAt = deletedAt; }
    public UUID getDeletedBy() { return deletedBy; }
    public void setDeletedBy(UUID deletedBy) { this.deletedBy = deletedBy; }
    public String getDeleteReason() { return deleteReason; }
    public void setDeleteReason(String deleteReason) { this.deleteReason = deleteReason; }
}
