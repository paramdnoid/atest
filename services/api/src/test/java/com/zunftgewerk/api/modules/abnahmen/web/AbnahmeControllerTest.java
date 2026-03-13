package com.zunftgewerk.api.modules.abnahmen.web;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeRecordEntity;
import com.zunftgewerk.api.modules.abnahmen.service.AbnahmeService;
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

class AbnahmeControllerTest {

    private RefreshTokenService refreshTokenService;
    private MembershipRepository membershipRepository;
    private AbnahmeService abnahmeService;
    private AbnahmeController abnahmeController;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        membershipRepository = mock(MembershipRepository.class);
        abnahmeService = mock(AbnahmeService.class);
        abnahmeController = new AbnahmeController(refreshTokenService, membershipRepository, abnahmeService);
    }

    @Test
    void shouldRejectListWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = abnahmeController.list(null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(abnahmeService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnListForAuthenticatedSession() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        when(abnahmeService.list(tenantId, "OPEN")).thenReturn(List.of());

        ResponseEntity<?> response = abnahmeController.list("zg_refresh_token=abc", "OPEN");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("items");
        verify(abnahmeService).list(tenantId, "OPEN");
    }

    @Test
    void shouldRejectCreateWithoutSession() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = abnahmeController.create(
            null,
            new AbnahmeController.CreateAbnahmeRequest(
                "ABN-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle A",
                "Elektro",
                "Max Mustermann",
                "DRAFT",
                OffsetDateTime.now().plusDays(3),
                false
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(abnahmeService);
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

        ResponseEntity<?> response = abnahmeController.create(
            "zg_refresh_token=abc",
            new AbnahmeController.CreateAbnahmeRequest(
                "ABN-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle A",
                "Elektro",
                "Max Mustermann",
                "DRAFT",
                OffsetDateTime.now().plusDays(3),
                false
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(abnahmeService);
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

        AbnahmeRecordEntity created = new AbnahmeRecordEntity();
        created.setId(recordId);
        created.setTenantId(tenantId);
        created.setNumber("ABN-1");
        when(abnahmeService.create(eq(tenantId), eq(userId), any())).thenReturn(created);
        when(abnahmeService.summarize(created)).thenReturn(Map.of("id", recordId, "number", "ABN-1"));

        ResponseEntity<?> response = abnahmeController.create(
            "zg_refresh_token=abc",
            new AbnahmeController.CreateAbnahmeRequest(
                "ABN-1",
                "Projekt Nord",
                "Muster GmbH",
                "Baustelle A",
                "Elektro",
                "Max Mustermann",
                "DRAFT",
                OffsetDateTime.now().plusDays(3),
                false
            )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> payload = (Map<String, Object>) response.getBody();
        assertThat(payload).containsKey("item");
        verify(abnahmeService).create(eq(tenantId), eq(userId), any());
    }
}
