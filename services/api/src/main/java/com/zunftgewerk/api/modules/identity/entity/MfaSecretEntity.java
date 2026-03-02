package com.zunftgewerk.api.modules.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mfa_secrets")
public class MfaSecretEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "totp_secret_encrypted", nullable = false)
    private String totpSecretEncrypted;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "backup_codes_hashes", nullable = false)
    private String backupCodesHashes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getTotpSecretEncrypted() {
        return totpSecretEncrypted;
    }

    public void setTotpSecretEncrypted(String totpSecretEncrypted) {
        this.totpSecretEncrypted = totpSecretEncrypted;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBackupCodesHashes() {
        return backupCodesHashes;
    }

    public void setBackupCodesHashes(String backupCodesHashes) {
        this.backupCodesHashes = backupCodesHashes;
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
}
