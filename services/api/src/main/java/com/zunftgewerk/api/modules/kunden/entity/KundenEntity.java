package com.zunftgewerk.api.modules.kunden.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_kunden")
public class KundenEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "number", nullable = false)
    private String number;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "branche", nullable = false)
    private String branche;

    @Column(name = "segment", nullable = false)
    private String segment;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "consent_state", nullable = false)
    private String consentState;

    @Column(name = "retention_class", nullable = false)
    private String retentionClass;

    @Column(name = "region", nullable = false)
    private String region;

    @Column(name = "next_follow_up_at")
    private OffsetDateTime nextFollowUpAt;

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

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBranche() {
        return branche;
    }

    public void setBranche(String branche) {
        this.branche = branche;
    }

    public String getSegment() {
        return segment;
    }

    public void setSegment(String segment) {
        this.segment = segment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(UUID ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getConsentState() {
        return consentState;
    }

    public void setConsentState(String consentState) {
        this.consentState = consentState;
    }

    public String getRetentionClass() {
        return retentionClass;
    }

    public void setRetentionClass(String retentionClass) {
        this.retentionClass = retentionClass;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public OffsetDateTime getNextFollowUpAt() {
        return nextFollowUpAt;
    }

    public void setNextFollowUpAt(OffsetDateTime nextFollowUpAt) {
        this.nextFollowUpAt = nextFollowUpAt;
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
