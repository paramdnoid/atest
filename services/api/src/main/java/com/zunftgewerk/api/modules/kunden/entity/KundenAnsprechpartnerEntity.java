package com.zunftgewerk.api.modules.kunden.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_kunden_ansprechpartner")
public class KundenAnsprechpartnerEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "kunden_id", nullable = false)
    private UUID kundenId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "rolle", nullable = false)
    private String rolle;

    @Column(name = "email")
    private String email;

    @Column(name = "telefon", nullable = false)
    private String telefon;

    @Column(name = "bevorzugter_kanal", nullable = false)
    private String bevorzugterKanal;

    @Column(name = "dsgvo_consent", nullable = false)
    private String dsgvoConsent;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary;

    @Column(name = "last_contact_at")
    private OffsetDateTime lastContactAt;

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

    public String getRolle() {
        return rolle;
    }

    public void setRolle(String rolle) {
        this.rolle = rolle;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefon() {
        return telefon;
    }

    public void setTelefon(String telefon) {
        this.telefon = telefon;
    }

    public String getBevorzugterKanal() {
        return bevorzugterKanal;
    }

    public void setBevorzugterKanal(String bevorzugterKanal) {
        this.bevorzugterKanal = bevorzugterKanal;
    }

    public String getDsgvoConsent() {
        return dsgvoConsent;
    }

    public void setDsgvoConsent(String dsgvoConsent) {
        this.dsgvoConsent = dsgvoConsent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public OffsetDateTime getLastContactAt() {
        return lastContactAt;
    }

    public void setLastContactAt(OffsetDateTime lastContactAt) {
        this.lastContactAt = lastContactAt;
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
