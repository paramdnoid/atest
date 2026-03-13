package com.zunftgewerk.api.modules.aufmass.web;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassRecordEntity;
import com.zunftgewerk.api.modules.aufmass.service.AufmassService;
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
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AufmassControllerTest {

    private RefreshTokenService refreshTokenService;
    private MembershipRepository membershipRepository;
    private AufmassService aufmassService;
    private AufmassController aufmassController;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        membershipRepository = mock(MembershipRepository.class);
        aufmassService = mock(AufmassService.class);
        aufmassController = new AufmassController(refreshTokenService, membershipRepository, aufmassService);
    }

    @Test
    void shouldRejectListWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = aufmassController.list(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(aufmassService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnListForAuthenticatedSession() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        when(aufmassService.list(tenantId, "DRAFT")).thenReturn(List.of());

        ResponseEntity<?> response = aufmassController.list("zg_refresh_token=abc", "DRAFT");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("items");
        verify(aufmassService).list(tenantId, "DRAFT");
    }

    @Test
    void shouldRejectCreateWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = aufmassController.create(
            null,
            new AufmassController.CreateRecordRequest(
                "AUF-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle 1",
                "Max Mustermann",
                OffsetDateTime.now().plusDays(5),
                "DRAFT",
                1,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(aufmassService);
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

        ResponseEntity<?> response = aufmassController.create(
            "zg_refresh_token=abc",
            new AufmassController.CreateRecordRequest(
                "AUF-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle 1",
                "Max Mustermann",
                OffsetDateTime.now().plusDays(5),
                "DRAFT",
                1,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(aufmassService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldCreateForAdminRole() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID recordId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        MembershipEntity admin = new MembershipEntity();
        admin.setRoleKey("admin");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(List.of(admin));

        AufmassRecordEntity created = new AufmassRecordEntity();
        created.setId(recordId);
        created.setTenantId(tenantId);
        created.setNumber("AUF-1");
        when(aufmassService.create(eq(tenantId), eq(userId), any())).thenReturn(created);
        when(aufmassService.summarize(created)).thenReturn(Map.of("id", recordId, "number", "AUF-1"));

        ResponseEntity<?> response = aufmassController.create(
            "zg_refresh_token=abc",
            new AufmassController.CreateRecordRequest(
                "AUF-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle 1",
                "Max Mustermann",
                OffsetDateTime.now().plusDays(5),
                "DRAFT",
                1,
                null
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("item");
        verify(aufmassService).create(eq(tenantId), eq(userId), any());
    }
}
