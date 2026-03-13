package com.zunftgewerk.api.modules.opsworkflow.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.shared.security.FieldEncryptionService;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class OpsEncryptionRotationControllerTest {

    private RefreshTokenService refreshTokenService;
    private MembershipRepository membershipRepository;
    private FieldEncryptionService fieldEncryptionService;
    private OpsEncryptionRotationController controller;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        membershipRepository = mock(MembershipRepository.class);
        fieldEncryptionService = mock(FieldEncryptionService.class);
        controller = new OpsEncryptionRotationController(refreshTokenService, membershipRepository, fieldEncryptionService);
    }

    @Test
    void shouldRejectStatusWhenSessionMissing() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.status(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(membershipRepository, fieldEncryptionService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnStatusForOwner() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));

        MembershipEntity owner = new MembershipEntity();
        owner.setRoleKey("owner");
        when(membershipRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(List.of(owner));
        when(fieldEncryptionService.isEnabled()).thenReturn(true);
        when(fieldEncryptionService.keyVersion()).thenReturn("v1");

        ResponseEntity<?> response = controller.status("zg_refresh_token=abc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("enabled", true);
        assertThat(body).containsEntry("keyVersion", "v1");
        verify(fieldEncryptionService).isEnabled();
        verify(fieldEncryptionService).keyVersion();
    }
}
