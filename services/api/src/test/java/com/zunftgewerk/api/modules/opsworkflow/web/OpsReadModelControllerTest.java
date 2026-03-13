package com.zunftgewerk.api.modules.opsworkflow.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.opsworkflow.service.OpsReadModelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class OpsReadModelControllerTest {

    private RefreshTokenService refreshTokenService;
    private OpsReadModelService opsReadModelService;
    private OpsReadModelController controller;

    @BeforeEach
    void setUp() {
        refreshTokenService = mock(RefreshTokenService.class);
        opsReadModelService = mock(OpsReadModelService.class);
        controller = new OpsReadModelController(refreshTokenService, opsReadModelService);
    }

    @Test
    void shouldRejectWhenSessionMissing() {
        when(refreshTokenService.peekUser(any())).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.overview(null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(opsReadModelService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldReturnOverviewWhenAuthenticated() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(refreshTokenService.peekUser(any()))
            .thenReturn(Optional.of(new RefreshTokenService.PeekedSession(userId, tenantId)));
        when(opsReadModelService.overview(tenantId))
            .thenReturn(Map.of("kunden", Map.of("total", 2)));

        ResponseEntity<?> response = controller.overview("zg_refresh_token=abc");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsKey("overview");
        verify(opsReadModelService).overview(tenantId);
    }
}
