package com.zunftgewerk.api.modules.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class TenantEntity {

    @Id
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "trade_slug")
    private String tradeSlug;

    @Column(name = "address_json")
    private String addressJson;

    @Column(name = "device_registration_token")
    private String deviceRegistrationToken;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getTradeSlug() {
        return tradeSlug;
    }

    public void setTradeSlug(String tradeSlug) {
        this.tradeSlug = tradeSlug;
    }

    public String getAddressJson() {
        return addressJson;
    }

    public void setAddressJson(String addressJson) {
        this.addressJson = addressJson;
    }

    public String getDeviceRegistrationToken() {
        return deviceRegistrationToken;
    }

    public void setDeviceRegistrationToken(String deviceRegistrationToken) {
        this.deviceRegistrationToken = deviceRegistrationToken;
    }
}
