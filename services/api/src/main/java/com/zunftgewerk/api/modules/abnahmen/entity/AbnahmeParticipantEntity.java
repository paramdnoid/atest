package com.zunftgewerk.api.modules.abnahmen.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_abnahmen_participant")
public class AbnahmeParticipantEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "abnahme_id", nullable = false)
    private UUID abnahmeId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "role_label", nullable = false)
    private String roleLabel;

    @Column(name = "company")
    private String company;

    @Column(name = "present", nullable = false)
    private boolean present;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getAbnahmeId() { return abnahmeId; }
    public void setAbnahmeId(UUID abnahmeId) { this.abnahmeId = abnahmeId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRoleLabel() { return roleLabel; }
    public void setRoleLabel(String roleLabel) { this.roleLabel = roleLabel; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public boolean isPresent() { return present; }
    public void setPresent(boolean present) { this.present = present; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
