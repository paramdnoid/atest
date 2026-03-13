package com.zunftgewerk.api.modules.angebote.web;

import com.zunftgewerk.api.modules.angebote.entity.AngebotEntity;
import com.zunftgewerk.api.modules.angebote.service.AngebotService;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AngebotControllerTest {

    private RefreshTokenService refreshTokenService;
    private MembershipRepository membershipRepository;
    private AngebotService angebotService;
    private AngebotController angebotController;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        membershipRepository = mock(MembershipRepository.class);
        angebotService = mock(AngebotService.class);
        angebotController = new AngebotController(refreshTokenService, membershipRepository, angebotService);
    }

    @Test
    void shouldRejectListWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = angebotController.list(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(angebotService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnListForAuthenticatedSession() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        when(angebotService.list(tenantId, "DRAFT")).thenReturn(List.of());

        ResponseEntity<?> response = angebotController.list("zg_refresh_token=abc", "DRAFT");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("items");
        verify(angebotService).list(tenantId, "DRAFT");
    }

    @Test
    void shouldRejectCreateWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = angebotController.create(
            null,
            new AngebotController.CreateAngebotRequest(
                "A-1",
                "Muster GmbH",
                "Projekt Nord",
                "MALER",
                "HIGH",
                null,
                "DRAFT",
                OffsetDateTime.now().plusDays(10),
                "Hinweis",
                null,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(angebotService);
    }

    @Test
    void shouldRejectCreateForMemberRole() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        MembershipEntity member = new MembershipEntity();
        member.setRoleKey("member");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(List.of(member));

        ResponseEntity<?> response = angebotController.create(
            "zg_refresh_token=abc",
            new AngebotController.CreateAngebotRequest(
                "A-1",
                "Muster GmbH",
                "Projekt Nord",
                "MALER",
                "HIGH",
                null,
                "DRAFT",
                OffsetDateTime.now().plusDays(10),
                "Hinweis",
                null,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(angebotService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldCreateForAdminRole() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID angebotId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        MembershipEntity admin = new MembershipEntity();
        admin.setRoleKey("admin");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(List.of(admin));

        AngebotEntity created = new AngebotEntity();
        created.setId(angebotId);
        created.setTenantId(tenantId);
        created.setNumber("A-1");
        when(angebotService.create(eq(tenantId), eq(userId), any())).thenReturn(created);
        when(angebotService.summarize(created)).thenReturn(Map.of("id", angebotId, "number", "A-1"));

        ResponseEntity<?> response = angebotController.create(
            "zg_refresh_token=abc",
            new AngebotController.CreateAngebotRequest(
                "A-1",
                "Muster GmbH",
                "Projekt Nord",
                "MALER",
                "HIGH",
                null,
                "DRAFT",
                OffsetDateTime.now().plusDays(10),
                "Hinweis",
                null,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("item");
        verify(angebotService).create(eq(tenantId), eq(userId), any());
    }
}
