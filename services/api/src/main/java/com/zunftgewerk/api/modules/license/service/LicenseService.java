package com.zunftgewerk.api.modules.license.service;

import com.zunftgewerk.api.modules.license.entity.SeatLicenseEntity;
import com.zunftgewerk.api.modules.license.entity.EntitlementEntity;
import com.zunftgewerk.api.modules.billing.service.StripeBillingService;
import com.zunftgewerk.api.modules.license.repository.EntitlementRepository;
import com.zunftgewerk.api.modules.license.repository.SeatLicenseRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class LicenseService {

    private final SeatLicenseRepository seatLicenseRepository;
    private final EntitlementRepository entitlementRepository;
    private final StripeBillingService stripeBillingService;

    public LicenseService(
        SeatLicenseRepository seatLicenseRepository,
        EntitlementRepository entitlementRepository,
        StripeBillingService stripeBillingService
    ) {
        this.seatLicenseRepository = seatLicenseRepository;
        this.entitlementRepository = entitlementRepository;
        this.stripeBillingService = stripeBillingService;
    }

    public List<SeatLicenseEntity> listSeats(UUID tenantId) {
        return seatLicenseRepository.findByTenantId(tenantId);
    }

    public UUID assignSeat(UUID tenantId, UUID userId) {
        boolean billingActive = entitlementRepository.findByTenantId(tenantId).stream()
            .filter(entitlement -> "billing.active".equals(entitlement.getEntitlementKey()))
            .findFirst()
            .map(EntitlementEntity::isEnabled)
            .orElse(true);

        if (!billingActive) {
            throw new IllegalStateException("Seat assignment is frozen while billing is inactive");
        }

        SeatLicenseEntity seat = new SeatLicenseEntity();
        seat.setId(UUID.randomUUID());
        seat.setTenantId(tenantId);
        seat.setUserId(userId);
        seat.setStatus("ACTIVE");
        seat.setUpdatedAt(OffsetDateTime.now());
        SeatLicenseEntity saved = seatLicenseRepository.save(seat);
        stripeBillingService.syncSeatQuantity(tenantId, seatLicenseRepository.countActiveByTenantId(tenantId));
        return saved.getId();
    }

    public boolean revokeSeat(UUID tenantId, UUID seatId) {
        return seatLicenseRepository.findById(seatId)
            .filter(seat -> seat.getTenantId().equals(tenantId))
            .map(seat -> {
                seat.setStatus("REVOKED");
                seat.setUpdatedAt(OffsetDateTime.now());
                seatLicenseRepository.save(seat);
                stripeBillingService.syncSeatQuantity(tenantId, seatLicenseRepository.countActiveByTenantId(tenantId));
                return true;
            })
            .orElse(false);
    }

    public List<EntitlementEntity> listEntitlements(UUID tenantId) {
        return entitlementRepository.findByTenantId(tenantId);
    }
}
