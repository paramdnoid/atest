package com.zunftgewerk.api.modules.license;

import com.zunftgewerk.api.modules.license.entity.SeatLicenseEntity;
import com.zunftgewerk.api.modules.license.repository.SeatLicenseRepository;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SeatLicenseManagementServiceTest {

    private SeatLicenseRepository seatLicenseRepository;
    private SubscriptionRepository subscriptionRepository;
    private MembershipRepository membershipRepository;
    private SeatLicenseManagementService service;

    @BeforeEach
    void setup() {
        seatLicenseRepository = mock(SeatLicenseRepository.class);
        subscriptionRepository = mock(SubscriptionRepository.class);
        membershipRepository = mock(MembershipRepository.class);
        service = new SeatLicenseManagementService(seatLicenseRepository, subscriptionRepository, membershipRepository);
    }

    @Test
    void shouldBlockAssignWhenNoAvailableSeats() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        SubscriptionEntity subscription = new SubscriptionEntity();
        subscription.setPlanId("starter");
        when(subscriptionRepository.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(seatLicenseRepository.countActiveByTenantId(tenantId)).thenReturn(5L);
        when(seatLicenseRepository.findByTenantIdAndUserIdAndStatus(tenantId, userId, "ACTIVE"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignSeat(tenantId, userId))
            .isInstanceOf(SeatLicenseManagementService.SeatPolicyException.class)
            .hasMessageContaining("Keine freien Benutzerlizenzen");
    }

    @Test
    void shouldBlockRevokeForOwner() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        MembershipEntity ownerMembership = new MembershipEntity();
        ownerMembership.setRoleKey("owner");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId))
            .thenReturn(List.of(ownerMembership));

        assertThatThrownBy(() -> service.revokeSeat(tenantId, userId))
            .isInstanceOf(SeatLicenseManagementService.SeatPolicyException.class)
            .hasMessageContaining("Inhabers");
    }

    @Test
    void shouldRevokeActiveSeatForMember() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        MembershipEntity memberMembership = new MembershipEntity();
        memberMembership.setRoleKey("member");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId))
            .thenReturn(List.of(memberMembership));

        SeatLicenseEntity active = new SeatLicenseEntity();
        active.setId(UUID.randomUUID());
        active.setTenantId(tenantId);
        active.setUserId(userId);
        active.setStatus("ACTIVE");
        active.setUpdatedAt(OffsetDateTime.now());
        when(seatLicenseRepository.findByTenantIdAndUserIdAndStatus(tenantId, userId, "ACTIVE"))
            .thenReturn(Optional.of(active));
        when(seatLicenseRepository.save(any(SeatLicenseEntity.class))).thenReturn(active);

        boolean revoked = service.revokeSeat(tenantId, userId);

        assertThat(revoked).isTrue();
        verify(seatLicenseRepository).save(any(SeatLicenseEntity.class));
    }
}
