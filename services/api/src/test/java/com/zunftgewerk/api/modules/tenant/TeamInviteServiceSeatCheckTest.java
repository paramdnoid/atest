package com.zunftgewerk.api.modules.tenant;

import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.EmailService;
import com.zunftgewerk.api.modules.identity.service.TokenHashService;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.modules.tenant.entity.TeamInviteTokenEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TeamInviteTokenRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import com.zunftgewerk.api.modules.tenant.service.TeamInviteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeamInviteServiceSeatCheckTest {

    private TeamInviteTokenRepository inviteTokenRepository;
    private UserRepository userRepository;
    private MembershipRepository membershipRepository;
    private SeatLicenseManagementService seatLicenseManagementService;
    private TeamInviteService service;

    @BeforeEach
    void setup() {
        inviteTokenRepository = mock(TeamInviteTokenRepository.class);
        TokenHashService tokenHashService = mock(TokenHashService.class);
        when(tokenHashService.hash(any())).thenReturn("hash");

        userRepository = mock(UserRepository.class);
        membershipRepository = mock(MembershipRepository.class);
        seatLicenseManagementService = mock(SeatLicenseManagementService.class);

        service = new TeamInviteService(
            inviteTokenRepository,
            tokenHashService,
            mock(EmailService.class),
            userRepository,
            membershipRepository,
            mock(TenantRepository.class),
            mock(AuditService.class),
            seatLicenseManagementService
        );
        ReflectionTestUtils.setField(service, "inviteTtlSeconds", 3600L);
    }

    @Test
    void shouldBlockInviteCreationWhenNoSeatsAvailable() {
        UUID tenantId = UUID.randomUUID();
        UUID inviterId = UUID.randomUUID();
        when(seatLicenseManagementService.summary(tenantId))
            .thenReturn(new SeatLicenseManagementService.SeatSummary(5, 5, 0, false));

        assertThatThrownBy(() -> service.invite(tenantId, inviterId, "user@example.com", "member"))
            .isInstanceOf(TeamInviteService.TeamInvitePolicyException.class)
            .hasMessageContaining("Keine freie Benutzerlizenz");
    }

    @Test
    void shouldReturnNoSeatCodeWhenAcceptingInviteWithoutAvailableSeats() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        TeamInviteTokenEntity invite = new TeamInviteTokenEntity();
        invite.setTenantId(tenantId);
        invite.setInvitedEmail("user@example.com");
        invite.setRoleKey("member");
        invite.setExpiresAt(OffsetDateTime.now().plusHours(1));
        when(inviteTokenRepository.findByTokenHash("hash")).thenReturn(Optional.of(invite));

        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setEmail("user@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        when(seatLicenseManagementService.summary(tenantId))
            .thenReturn(new SeatLicenseManagementService.SeatSummary(5, 5, 0, false));

        TeamInviteService.AcceptInviteResult result = service.acceptInvite("raw-token");

        assertThat(result.success()).isFalse();
        assertThat(result.code()).isEqualTo("NO_AVAILABLE_SEAT");
        verify(seatLicenseManagementService, never()).assignSeat(any(), any());
    }
}
