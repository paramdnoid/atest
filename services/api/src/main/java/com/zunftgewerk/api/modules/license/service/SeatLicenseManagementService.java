package com.zunftgewerk.api.modules.license.service;

import com.zunftgewerk.api.modules.license.entity.SeatLicenseEntity;
import com.zunftgewerk.api.modules.license.repository.SeatLicenseRepository;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SeatLicenseManagementService {

    private static final Logger log = LoggerFactory.getLogger(SeatLicenseManagementService.class);
    private final SeatLicenseRepository seatLicenseRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MembershipRepository membershipRepository;

    public SeatLicenseManagementService(
        SeatLicenseRepository seatLicenseRepository,
        SubscriptionRepository subscriptionRepository,
        MembershipRepository membershipRepository
    ) {
        this.seatLicenseRepository = seatLicenseRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.membershipRepository = membershipRepository;
    }

    public SeatSummary summary(UUID tenantId) {
        long usedSeats = seatLicenseRepository.countActiveByTenantId(tenantId);
        int includedSeats = resolveIncludedSeats(tenantId);
        long availableSeats = Math.max(0, includedSeats - usedSeats);
        boolean overLimit = usedSeats > includedSeats;
        return new SeatSummary(includedSeats, usedSeats, availableSeats, overLimit);
    }

    public boolean hasActiveSeat(UUID tenantId, UUID userId) {
        return seatLicenseRepository.findByTenantIdAndUserIdAndStatus(tenantId, userId, "ACTIVE").isPresent();
    }

    @Transactional
    public SeatLicenseEntity assignSeat(UUID tenantId, UUID userId) {
        SeatLicenseEntity existingSeat = seatLicenseRepository
            .findByTenantIdAndUserIdAndStatus(tenantId, userId, "ACTIVE")
            .orElse(null);
        if (existingSeat != null) {
            return existingSeat;
        }

        SeatSummary summary = summary(tenantId);
        if (summary.availableSeats() <= 0) {
            log.info("Seat assignment blocked: no available seats for tenant={}", tenantId);
            throw new SeatPolicyException("NO_AVAILABLE_SEAT", "Keine freien Benutzerlizenzen verfuegbar.");
        }

        SeatLicenseEntity seat = new SeatLicenseEntity();
        seat.setId(UUID.randomUUID());
        seat.setTenantId(tenantId);
        seat.setUserId(userId);
        seat.setStatus("ACTIVE");
        seat.setUpdatedAt(OffsetDateTime.now());
        return seatLicenseRepository.save(seat);
    }

    @Transactional
    public boolean revokeSeat(UUID tenantId, UUID userId) {
        MembershipEntity membership = membershipRepository
            .findByTenantIdAndUserId(tenantId, userId)
            .stream()
            .findFirst()
            .orElse(null);
        if (membership != null && "owner".equals(membership.getRoleKey())) {
            log.info("Seat revoke blocked: owner seat protected for tenant={} user={}", tenantId, userId);
            throw new SeatPolicyException("OWNER_SEAT_PROTECTED", "Die Benutzerlizenz des Inhabers kann nicht entzogen werden.");
        }

        SeatLicenseEntity activeSeat = seatLicenseRepository
            .findByTenantIdAndUserIdAndStatus(tenantId, userId, "ACTIVE")
            .orElse(null);
        if (activeSeat == null) {
            return false;
        }
        activeSeat.setStatus("REVOKED");
        activeSeat.setUpdatedAt(OffsetDateTime.now());
        seatLicenseRepository.save(activeSeat);
        return true;
    }

    public Map<String, Object> seatToMap(SeatLicenseEntity seat) {
        Map<String, Object> result = new HashMap<>();
        result.put("seatId", seat.getId().toString());
        result.put("tenantId", seat.getTenantId().toString());
        result.put("userId", seat.getUserId().toString());
        result.put("status", seat.getStatus());
        result.put("updatedAt", seat.getUpdatedAt());
        return result;
    }

    private int resolveIncludedSeats(UUID tenantId) {
        SubscriptionEntity sub = subscriptionRepository.findByTenantId(tenantId).orElse(null);
        if (sub == null || sub.getPlanId() == null) {
            return 0;
        }
        return PlanCatalog.plans().stream()
            .filter(plan -> plan.planId().equalsIgnoreCase(sub.getPlanId()))
            .findFirst()
            .map(PlanCatalog.PlanDefinition::includedSeats)
            .orElse(0);
    }

    public record SeatSummary(
        int includedSeats,
        long usedSeats,
        long availableSeats,
        boolean overLimit
    ) {
    }

    public static final class SeatPolicyException extends RuntimeException {
        private final String code;

        public SeatPolicyException(String code, String message) {
            super(message);
            this.code = code;
        }

        public String code() {
            return code;
        }
    }
}
