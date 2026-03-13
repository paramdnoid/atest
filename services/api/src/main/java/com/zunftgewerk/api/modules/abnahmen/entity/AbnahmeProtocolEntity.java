package com.zunftgewerk.api.modules.abnahmen.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ops_abnahmen_protocol")
public class AbnahmeProtocolEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "abnahme_id", nullable = false)
    private UUID abnahmeId;

    @Column(name = "acceptance_type", nullable = false)
    private String acceptanceType;

    @Column(name = "inspection_date")
    private OffsetDateTime inspectionDate;

    @Column(name = "appointment_date")
    private OffsetDateTime appointmentDate;

    @Column(name = "place")
    private String place;

    @Column(name = "reservation_text")
    private String reservationText;

    @Column(name = "signoff_status", nullable = false)
    private String signoffStatus;

    @Column(name = "signed_at")
    private OffsetDateTime signedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getAbnahmeId() { return abnahmeId; }
    public void setAbnahmeId(UUID abnahmeId) { this.abnahmeId = abnahmeId; }
    public String getAcceptanceType() { return acceptanceType; }
    public void setAcceptanceType(String acceptanceType) { this.acceptanceType = acceptanceType; }
    public OffsetDateTime getInspectionDate() { return inspectionDate; }
    public void setInspectionDate(OffsetDateTime inspectionDate) { this.inspectionDate = inspectionDate; }
    public OffsetDateTime getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(OffsetDateTime appointmentDate) { this.appointmentDate = appointmentDate; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
    public String getReservationText() { return reservationText; }
    public void setReservationText(String reservationText) { this.reservationText = reservationText; }
    public String getSignoffStatus() { return signoffStatus; }
    public void setSignoffStatus(String signoffStatus) { this.signoffStatus = signoffStatus; }
    public OffsetDateTime getSignedAt() { return signedAt; }
    public void setSignedAt(OffsetDateTime signedAt) { this.signedAt = signedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
