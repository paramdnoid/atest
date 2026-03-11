package com.zunftgewerk.api.modules.identity;

import com.zunftgewerk.api.config.FeatureFlagProperties;
import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.EmailVerificationTokenRepository;
import com.zunftgewerk.api.modules.identity.repository.PasswordResetTokenRepository;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.EmailService;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.modules.identity.service.MfaService;
import com.zunftgewerk.api.modules.identity.service.PasskeyService;
import com.zunftgewerk.api.modules.identity.service.PasswordHasher;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.service.TokenHashService;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.service.TenantService;
import com.zunftgewerk.api.shared.security.JwtService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IdentityServiceSignUpSeatTest {

    private UserRepository userRepository;
    private TenantService tenantService;
    private SeatLicenseManagementService seatLicenseManagementService;
    private IdentityService identityService;

    @BeforeEach
    void setup() {
        userRepository = mock(UserRepository.class);
        tenantService = mock(TenantService.class);
        seatLicenseManagementService = mock(SeatLicenseManagementService.class);

        identityService = new IdentityService(
            userRepository,
            mock(MembershipRepository.class),
            tenantService,
            mock(SubscriptionRepository.class),
            mock(PasswordHasher.class),
            mock(JwtService.class),
            mock(RefreshTokenService.class),
            mock(MfaService.class),
            mock(PasskeyService.class),
            mock(AuditService.class),
            new SimpleMeterRegistry(),
            mock(EmailVerificationTokenRepository.class),
            mock(PasswordResetTokenRepository.class),
            mock(TokenHashService.class),
            mock(EmailService.class),
            mock(FeatureFlagProperties.class),
            seatLicenseManagementService
        );

        ReflectionTestUtils.setField(identityService, "emailVerificationTtlSeconds", 86400L);
    }

    @Test
    void shouldAssignSeatToNewOwnerOnSignup() {
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tenantService.createTenant(any(), any(), any(), any())).thenReturn(UUID.randomUUID());

        PasswordHasher passwordHasher = (PasswordHasher) ReflectionTestUtils.getField(identityService, "passwordHasher");
        when(passwordHasher.hash("supersecret1234")).thenReturn("hashed");

        TokenHashService tokenHashService = (TokenHashService) ReflectionTestUtils.getField(identityService, "tokenHashService");
        when(tokenHashService.hash(any())).thenReturn("token-hash");

        identityService.signUp(
            "owner@example.com",
            "supersecret1234",
            "Owner User",
            "Workspace",
            "electrician",
            null,
            "starter"
        );

        ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(userCaptor.capture());
        UUID ownerUserId = userCaptor.getValue().getId();

        ArgumentCaptor<UUID> tenantCaptor = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<UUID> seatUserCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(tenantService).createTenant(any(), any(), any(), any());
        verify(seatLicenseManagementService).assignSeat(tenantCaptor.capture(), seatUserCaptor.capture());
        assertThat(ownerUserId).isNotNull();
        assertThat(tenantCaptor.getValue()).isNotNull();
        assertThat(seatUserCaptor.getValue()).isEqualTo(ownerUserId);
    }
}
