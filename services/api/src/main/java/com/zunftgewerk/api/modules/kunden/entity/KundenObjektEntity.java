package com.zunftgewerk.api.modules.kunden.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_kunden_objekte")
public class KundenObjektEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "kunden_id", nullable = false)
    private UUID kundenId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "objekt_typ", nullable = false)
    private String objektTyp;

    @Column(name = "adresse", nullable = false)
    private String adresse;

    @Column(name = "region", nullable = false)
    private String region;

    @Column(name = "service_interval_days", nullable = false)
    private Integer serviceIntervalDays;

    @Column(name = "zugangshinweise")
    private String zugangshinweise;

    @Column(name = "risk_class", nullable = false)
    private String riskClass;

    @Column(name = "status", nullable = false)
    private String status;

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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getKundenId() {
        return kundenId;
    }

    public void setKundenId(UUID kundenId) {
        this.kundenId = kundenId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getObjektTyp() {
        return objektTyp;
    }

    public void setObjektTyp(String objektTyp) {
        this.objektTyp = objektTyp;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getServiceIntervalDays() {
        return serviceIntervalDays;
    }

    public void setServiceIntervalDays(Integer serviceIntervalDays) {
        this.serviceIntervalDays = serviceIntervalDays;
    }

    public String getZugangshinweise() {
        return zugangshinweise;
    }

    public void setZugangshinweise(String zugangshinweise) {
        this.zugangshinweise = zugangshinweise;
    }

    public String getRiskClass() {
        return riskClass;
    }

    public void setRiskClass(String riskClass) {
        this.riskClass = riskClass;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(OffsetDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public UUID getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(UUID deletedBy) {
        this.deletedBy = deletedBy;
    }

    public String getDeleteReason() {
        return deleteReason;
    }

    public void setDeleteReason(String deleteReason) {
        this.deleteReason = deleteReason;
    }
}
