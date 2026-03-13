package com.zunftgewerk.api.modules.kunden.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.kunden.entity.KundenEntity;
import com.zunftgewerk.api.modules.kunden.service.KundenService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KundenControllerTest {

    private RefreshTokenService refreshTokenService;
    private MembershipRepository membershipRepository;
    private KundenService kundenService;
    private KundenController kundenController;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        membershipRepository = mock(MembershipRepository.class);
        kundenService = mock(KundenService.class);

        kundenController = new KundenController(
            refreshTokenService,
            membershipRepository,
            kundenService
        );
    }

    @Test
    void shouldRejectListWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = kundenController.listKunden(null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(kundenService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnListForAuthenticatedSession() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        when(kundenService.listKunden(tenantId, "must", "AKTIV")).thenReturn(List.of());

        ResponseEntity<?> response = kundenController.listKunden("zg_refresh_token=abc", "must", "AKTIV");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("items");
        verify(kundenService).listKunden(tenantId, "must", "AKTIV");
    }

    @Test
    void shouldRejectCreateWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = kundenController.createKunde(
            null,
            new KundenController.CreateKundeRequest(
                "K-1",
                "Muster GmbH",
                "MALER",
                "B2B",
                "AKTIV",
                null,
                5,
                "ERTEILT",
                "STANDARD",
                "DE",
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(kundenService);
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

        ResponseEntity<?> response = kundenController.createKunde(
            "zg_refresh_token=abc",
            new KundenController.CreateKundeRequest(
                "K-1",
                "Muster GmbH",
                "MALER",
                "B2B",
                "AKTIV",
                null,
                5,
                "ERTEILT",
                "STANDARD",
                "DE",
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(kundenService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldCreateKundeForAdminRole() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID kundenId = UUID.randomUUID();

        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));

        MembershipEntity admin = new MembershipEntity();
        admin.setRoleKey("admin");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(List.of(admin));

        KundenEntity created = new KundenEntity();
        created.setId(kundenId);
        created.setTenantId(tenantId);
        created.setNumber("K-1");
        created.setName("Muster GmbH");
        when(kundenService.createKunde(eq(tenantId), eq(userId), any())).thenReturn(created);
        when(kundenService.summarizeKunde(created)).thenReturn(Map.of("id", kundenId, "name", "Muster GmbH"));

        ResponseEntity<?> response = kundenController.createKunde(
            "zg_refresh_token=abc",
            new KundenController.CreateKundeRequest(
                "K-1",
                "Muster GmbH",
                "MALER",
                "B2B",
                "AKTIV",
                null,
                5,
                "ERTEILT",
                "STANDARD",
                "DE",
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("item");
        verify(kundenService).createKunde(eq(tenantId), eq(userId), any());
    }
}
