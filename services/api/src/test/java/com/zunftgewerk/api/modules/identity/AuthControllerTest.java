package com.zunftgewerk.api.modules.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.service.AuthRateLimitService;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthController;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    private IdentityService identityService;
    private JwtService jwtService;
    private AuthCookieService authCookieService;
    private AuthRateLimitService authRateLimitService;
    private RefreshTokenService refreshTokenService;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        identityService = mock(IdentityService.class);
        jwtService = mock(JwtService.class);
        authCookieService = mock(AuthCookieService.class);
        authRateLimitService = mock(AuthRateLimitService.class);
        refreshTokenService = mock(RefreshTokenService.class);

        authController = new AuthController(
            identityService,
            jwtService,
            authCookieService,
            authRateLimitService,
            refreshTokenService,
            new ObjectMapper()
        );
    }

    @Test
    void shouldRejectLoginWhenRequiredFieldsMissing() {
        ResponseEntity<?> response = authController.login(
            new AuthController.LoginHttpRequest("   ", null),
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Email and password required");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldRejectSignupWhenRequestIsNull() {
        ResponseEntity<?> response = authController.signup(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Missing required fields");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldNotLeakSignupFailureDetails() {
        when(identityService.signUp(anyString(), anyString(), any(), anyString(), any(), any(), anyString()))
            .thenThrow(new IllegalArgumentException("Tenant creation failed with DB detail"));

        ResponseEntity<?> response = authController.signup(new AuthController.SignupHttpRequest(
            "ops@zunft.test",
            "secret-secret-123",
            "Ops User",
            "Ops Workspace",
            "maler",
            null,
            "STARTER"
        ));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Invalid signup request");
    }

    @Test
    void shouldNotLeakInternalLoginFailureMessage() {
        when(authRateLimitService.checkLogin(anyString(), anyString(), anyString()))
            .thenReturn(AuthRateLimitService.RateLimitDecision.allowed());
        when(identityService.login("ops@zunft.test", "secret-secret-123"))
            .thenThrow(new IllegalArgumentException("User is disabled"));

        ResponseEntity<?> response = authController.login(
            new AuthController.LoginHttpRequest("ops@zunft.test", "secret-secret-123"),
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(error(response)).isEqualTo("Invalid credentials");
    }

    @Test
    void shouldRejectUnsupportedPasskeyMode() {
        ResponseEntity<?> response = authController.beginPasskey(
            new AuthController.PasskeyBeginHttpRequest("ops@zunft.test", "magic"),
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Unsupported passkey mode");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldRejectEnableMfaWhenUserIdMissing() {
        ResponseEntity<?> response = authController.enableMfa(
            new AuthController.EnableMfaHttpRequest(" "),
            "Bearer token"
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("userId required");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldRejectMfaVerifyWithoutAnyCode() {
        ResponseEntity<?> response = authController.verifyMfa(
            new AuthController.VerifyMfaHttpRequest(
                UUID.randomUUID().toString(),
                "mfa-token",
                " ",
                null,
                ""
            ),
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("One verification code is required");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldRejectDisableMfaWithoutAnyCode() {
        ResponseEntity<?> response = authController.disableMfa(
            new AuthController.DisableMfaHttpRequest(" ", null),
            "Bearer token"
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("One verification code is required");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldNotLeakDisableMfaFailureDetails() {
        UUID userId = UUID.randomUUID();
        when(jwtService.verifyAccessToken("token"))
            .thenReturn(new JwtPrincipal(userId, UUID.randomUUID(), List.of("owner"), true, List.of("pwd", "totp")));
        doThrow(new IllegalArgumentException("TOTP window mismatch for user"))
            .when(identityService)
            .disableMfa(eq(userId), eq("123456"), eq(null));

        ResponseEntity<?> response = authController.disableMfa(
            new AuthController.DisableMfaHttpRequest("123456", null),
            "Bearer token"
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Invalid MFA disable request");
    }

    @Test
    void shouldRejectRequestPasswordResetWhenRequestIsNull() {
        ResponseEntity<?> response = authController.requestPasswordReset(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Email required");
        verifyNoInteractions(identityService);
    }

    @Test
    void shouldNotLeakResetPasswordFailureDetails() {
        doThrow(new IllegalArgumentException("Reset token expired at 2026-03-01T10:00Z"))
            .when(identityService)
            .resetPassword("reset-token", "secret-secret-123");

        ResponseEntity<?> response = authController.resetPassword(
            new AuthController.ResetPasswordHttpRequest("reset-token", "secret-secret-123")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(error(response)).isEqualTo("Invalid reset token or password");
    }

    @Test
    void shouldReturnEnglishUnauthorizedMessageForMfaStatusWhenSessionMissing() {
        when(refreshTokenService.peekUser(any())).thenReturn(java.util.Optional.empty());

        ResponseEntity<?> response = authController.getMfaStatus(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(error(response)).isEqualTo("Not authenticated");
    }

    @Test
    void shouldReturnRetryAfterHeaderWhenRateLimited() {
        when(authRateLimitService.checkLogin(anyString(), anyString(), anyString()))
            .thenReturn(new AuthRateLimitService.RateLimitDecision(true, 42));

        ResponseEntity<?> response = authController.login(
            new AuthController.LoginHttpRequest("ops@zunft.test", "secret-secret-123"),
            "203.0.113.10",
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("42");
    }

    @Test
    void shouldSetNoStoreHeadersOnRefreshSuccess() {
        when(authRateLimitService.checkRefreshLike(anyString(), anyString(), anyString()))
            .thenReturn(AuthRateLimitService.RateLimitDecision.allowed());
        when(identityService.refreshToken("raw-refresh-token"))
            .thenReturn(new RefreshResult("access-token", "new-refresh-token", OffsetDateTime.now().plusMinutes(15)));
        when(authCookieService.buildRefreshCookie("new-refresh-token"))
            .thenReturn(ResponseCookie.from(AuthCookieService.REFRESH_COOKIE, "new-refresh-token").httpOnly(true).build());

        ResponseEntity<?> response = authController.refresh(
            new AuthController.RefreshHttpRequest("raw-refresh-token"),
            null,
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store, no-cache, must-revalidate, max-age=0");
        assertThat(response.getHeaders().getFirst(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
        assertThat(response.getHeaders().getFirst(HttpHeaders.EXPIRES)).isEqualTo("0");
    }

    @Test
    void shouldSetNoStoreHeadersOnLoginMfaRequiredResponse() {
        when(authRateLimitService.checkLogin(anyString(), anyString(), anyString()))
            .thenReturn(AuthRateLimitService.RateLimitDecision.allowed());
        when(identityService.login("ops@zunft.test", "secret-secret-123"))
            .thenReturn(new LoginResult(
                true,
                "",
                "",
                "mfa-token",
                UUID.randomUUID(),
                UUID.randomUUID(),
                List.of("owner"),
                null
            ));

        ResponseEntity<?> response = authController.login(
            new AuthController.LoginHttpRequest("ops@zunft.test", "secret-secret-123"),
            null,
            request()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store, no-cache, must-revalidate, max-age=0");
        assertThat(response.getHeaders().getFirst(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
        assertThat(response.getHeaders().getFirst(HttpHeaders.EXPIRES)).isEqualTo("0");
    }

    private HttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        return request;
    }

    @SuppressWarnings("unchecked")
    private String error(ResponseEntity<?> response) {
        return ((Map<String, String>) response.getBody()).get("error");
    }
}
