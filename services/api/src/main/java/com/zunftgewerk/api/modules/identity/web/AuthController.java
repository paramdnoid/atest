package com.zunftgewerk.api.modules.identity.web;

import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.MfaEnrollmentResult;
import com.zunftgewerk.api.modules.identity.model.MfaVerifyResult;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.service.AuthRateLimitService;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private static final String CACHE_CONTROL_NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";
    private static final String PRAGMA_NO_CACHE = "no-cache";
    private static final String EXPIRES_IMMEDIATELY = "0";
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
    private static final String INVALID_REFRESH_TOKEN_MESSAGE = "Invalid refresh token";
    private static final String INVALID_MFA_MESSAGE = "Invalid MFA verification";
    private static final String INVALID_SIGNUP_MESSAGE = "Invalid signup request";
    private static final String INVALID_RESET_MESSAGE = "Invalid reset token or password";
    private static final String INVALID_PASSKEY_REQUEST_MESSAGE = "Invalid passkey request";
    private static final String INVALID_MFA_ENABLE_MESSAGE = "Invalid MFA enable request";
    private static final String INVALID_MFA_EMAIL_MESSAGE = "Invalid MFA email request";
    private static final String INVALID_MFA_DISABLE_MESSAGE = "Invalid MFA disable request";

    private final IdentityService identityService;
    private final JwtService jwtService;
    private final AuthCookieService authCookieService;
    private final AuthRateLimitService authRateLimitService;
    private final RefreshTokenService refreshTokenService;
    private final ObjectMapper objectMapper;

    @Value("${zunftgewerk.email.landing-base-url:http://localhost:3000}")
    private String landingBaseUrl;

    public AuthController(
        IdentityService identityService,
        JwtService jwtService,
        AuthCookieService authCookieService,
        AuthRateLimitService authRateLimitService,
        RefreshTokenService refreshTokenService,
        ObjectMapper objectMapper
    ) {
        this.identityService = identityService;
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
        this.authRateLimitService = authRateLimitService;
        this.refreshTokenService = refreshTokenService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupHttpRequest request) {
        if (request == null
            || request.email() == null || request.email().isBlank()
            || request.password() == null || request.password().length() < 12
            || request.workspaceName() == null || request.workspaceName().isBlank()
            || request.planCode() == null || request.planCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        String addressJson = null;
        if (request.address() != null) {
            try {
                addressJson = objectMapper.writeValueAsString(request.address());
            } catch (JsonProcessingException ignored) {
                // address is optional; proceed without it
            }
        }

        try {
            identityService.signUp(
                request.email(),
                request.password(),
                request.fullName(),
                request.workspaceName(),
                request.tradeSlug(),
                addressJson,
                request.planCode()
            );
            return ResponseEntity.ok(Map.of("message", "Verification email sent"));
        } catch (IllegalArgumentException ex) {
            if ("User already exists".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User already exists"));
            }
            return badRequest(INVALID_SIGNUP_MESSAGE);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Registration failed"));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            identityService.verifyEmail(token);
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(landingBaseUrl + "/onboarding?step=verify&verified=1"))
                .build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(landingBaseUrl + "/onboarding?step=verify&verified=1&error=invalid_token"))
                .build();
        }
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordReset(@RequestBody PasswordResetRequestHttpRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email required"));
        }
        // Always returns success to prevent user enumeration.
        identityService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message", "If this email exists, a reset code was sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordHttpRequest request) {
        if (request == null
            || request.token() == null || request.token().isBlank()
            || request.password() == null || request.password().length() < 12) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token and password (min 12 chars) required"));
        }
        try {
            identityService.resetPassword(request.token(), request.password());
            return ResponseEntity.ok(Map.of("message", "Password updated"));
        } catch (IllegalArgumentException ex) {
            return badRequest(INVALID_RESET_MESSAGE);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
        @RequestBody LoginHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (request == null || !hasText(request.email()) || !hasText(request.password())) {
            return badRequest("Email and password required");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkLogin(
            request.email(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("login", rateLimit.retryAfterSeconds());
        }

        try {
            LoginResult result = identityService.login(request.email(), request.password());
            return withLoginResult(result);
        } catch (IllegalArgumentException ex) {
            return unauthorized(INVALID_CREDENTIALS_MESSAGE);
        } catch (Exception ex) {
            return unauthorized(INVALID_CREDENTIALS_MESSAGE);
        }
    }

    @PostMapping("/passkey/begin")
    public ResponseEntity<?> beginPasskey(
        @RequestBody PasskeyBeginHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (request == null || !hasText(request.email())) {
            return badRequest("Email required");
        }

        PasskeyMode mode;
        try {
            mode = parsePasskeyMode(request.mode());
        } catch (IllegalArgumentException ex) {
            return badRequest("Unsupported passkey mode");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkPasskey(
            request.email(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("passkey", rateLimit.retryAfterSeconds());
        }

        try {
            PasskeyBeginResult result = identityService.beginPasskey(request.email(), mode);
            return ResponseEntity.ok(Map.of(
                "challenge", result.challenge(),
                "challengeId", result.challengeId(),
                "mode", result.mode().name().toLowerCase(),
                "options", result.optionsJson()
            ));
        } catch (IllegalArgumentException ex) {
            return badRequest(INVALID_PASSKEY_REQUEST_MESSAGE);
        } catch (Exception ex) {
            return badRequest(INVALID_PASSKEY_REQUEST_MESSAGE);
        }
    }

    @PostMapping("/passkey/verify")
    public ResponseEntity<?> verifyPasskey(
        @RequestBody PasskeyVerifyHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (request == null
            || !hasText(request.email())
            || !hasText(request.challengeId())
            || !hasText(request.credentialJson())) {
            return badRequest("email, challengeId and credentialJson required");
        }

        PasskeyMode mode;
        try {
            mode = parsePasskeyMode(request.mode());
        } catch (IllegalArgumentException ex) {
            return badRequest("Unsupported passkey mode");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkPasskey(
            request.email(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("passkey", rateLimit.retryAfterSeconds());
        }

        try {
            LoginResult result = identityService.verifyPasskey(request.email(), request.challengeId(), request.credentialJson(), mode);
            return withLoginResult(result);
        } catch (IllegalArgumentException ex) {
            return unauthorized(INVALID_CREDENTIALS_MESSAGE);
        } catch (Exception ex) {
            return unauthorized(INVALID_CREDENTIALS_MESSAGE);
        }
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(
        @RequestBody EnableMfaHttpRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        if (request == null || !hasText(request.userId())) {
            return badRequest("userId required");
        }
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return unauthorized("Missing bearer token");
            }

            UUID requestedUserId = UUID.fromString(request.userId());
            JwtPrincipal principal = jwtService.verifyAccessToken(authorization.substring("Bearer ".length()));
            if (!principal.userId().equals(requestedUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Token user mismatch"));
            }

            MfaEnrollmentResult enrollment = identityService.enableMfa(requestedUserId);
            return ResponseEntity.ok(Map.of(
                "secret", enrollment.secret(),
                "provisioningUri", enrollment.provisioningUri(),
                "backupCodes", enrollment.backupCodes()
            ));
        } catch (IllegalArgumentException ex) {
            return badRequest(INVALID_MFA_ENABLE_MESSAGE);
        } catch (Exception ex) {
            return badRequest(INVALID_MFA_ENABLE_MESSAGE);
        }
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verifyMfa(
        @RequestBody VerifyMfaHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (request == null || !hasText(request.userId()) || !hasText(request.mfaToken())) {
            return badRequest("userId and mfaToken required");
        }
        if (!hasText(request.code()) && !hasText(request.backupCode()) && !hasText(request.emailCode())) {
            return badRequest("One verification code is required");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkMfa(
            request.userId(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("mfa", rateLimit.retryAfterSeconds());
        }

        try {
            MfaVerifyResult result = identityService.verifyMfa(
                UUID.fromString(request.userId()),
                request.mfaToken(),
                request.code(),
                request.backupCode(),
                request.emailCode()
            );

            ResponseCookie cookie = authCookieService.buildRefreshCookie(result.refreshToken());

            return noStore(ResponseEntity.ok())
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                    "verified", result.verified(),
                    "accessToken", result.accessToken(),
                    "expiresAt", result.accessTokenExpiresAt().toString()
                ));
        } catch (IllegalArgumentException ex) {
            return unauthorized(INVALID_MFA_MESSAGE);
        } catch (Exception ex) {
            return unauthorized(INVALID_MFA_MESSAGE);
        }
    }

    @PostMapping("/mfa/send-email-code")
    public ResponseEntity<?> sendMfaEmailCode(
        @RequestBody SendMfaEmailCodeHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (request == null || !hasText(request.userId()) || !hasText(request.mfaToken())) {
            return badRequest("userId and mfaToken required");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkMfaEmailSend(
            request.userId(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("mfa_email", rateLimit.retryAfterSeconds());
        }

        try {
            identityService.sendMfaEmailCode(UUID.fromString(request.userId()), request.mfaToken());
            return ResponseEntity.ok(Map.of("sent", true));
        } catch (IllegalArgumentException ex) {
            return badRequest(INVALID_MFA_EMAIL_MESSAGE);
        } catch (Exception ex) {
            return badRequest(INVALID_MFA_EMAIL_MESSAGE);
        }
    }

    @GetMapping("/mfa/status")
    public ResponseEntity<?> getMfaStatus(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
    ) {
        String rawToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;
        java.util.Optional<RefreshTokenService.PeekedSession> session =
            refreshTokenService.peekUser(rawToken);
        if (session.isEmpty()) {
            return unauthorized("Not authenticated");
        }
        boolean enabled = identityService.getMfaStatus(session.get().userId());
        return ResponseEntity.ok(Map.of("mfaEnabled", enabled));
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<?> disableMfa(
        @RequestBody DisableMfaHttpRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        if (request == null || (!hasText(request.code()) && !hasText(request.backupCode()))) {
            return badRequest("One verification code is required");
        }
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return unauthorized("Missing bearer token");
            }
            JwtPrincipal principal = jwtService.verifyAccessToken(
                authorization.substring("Bearer ".length()));
            identityService.disableMfa(principal.userId(), request.code(), request.backupCode());
            return ResponseEntity.ok(Map.of("disabled", true));
        } catch (IllegalArgumentException ex) {
            return badRequest(INVALID_MFA_DISABLE_MESSAGE);
        } catch (Exception ex) {
            return badRequest(INVALID_MFA_DISABLE_MESSAGE);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
        @RequestBody(required = false) RefreshHttpRequest body,
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        String refreshToken = body != null ? body.refreshToken() : null;
        if ((refreshToken == null || refreshToken.isBlank()) && cookieHeader != null) {
            refreshToken = extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE);
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return unauthorized("Missing refresh token");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkRefreshLike(
            refreshToken,
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("refresh", rateLimit.retryAfterSeconds());
        }

        try {
            RefreshResult result = identityService.refreshToken(refreshToken);
            ResponseCookie cookie = authCookieService.buildRefreshCookie(result.refreshToken());

            return noStore(ResponseEntity.ok())
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                    "accessToken", result.accessToken(),
                    "expiresAt", result.accessTokenExpiresAt().toString()
                ));
        } catch (IllegalArgumentException ex) {
            return unauthorized(INVALID_REFRESH_TOKEN_MESSAGE);
        } catch (Exception ex) {
            return unauthorized(INVALID_REFRESH_TOKEN_MESSAGE);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
        @RequestBody(required = false) RefreshHttpRequest body,
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        String refreshToken = body != null ? body.refreshToken() : null;
        if ((refreshToken == null || refreshToken.isBlank()) && cookieHeader != null) {
            refreshToken = extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE);
        }
        if (refreshToken == null || refreshToken.isBlank()) {
            return unauthorized("Missing refresh token");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkRefreshLike(
            refreshToken,
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("refresh", rateLimit.retryAfterSeconds());
        }

        boolean revoked = identityService.logout(refreshToken);
        if (!revoked) {
            return unauthorized(INVALID_REFRESH_TOKEN_MESSAGE);
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, authCookieService.clearRefreshCookie().toString())
            .body(Map.of("revoked", true));
    }

    @PostMapping("/revoke-family")
    public ResponseEntity<?> revokeFamily(
        @RequestBody RefreshHttpRequest body,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        if (body == null || body.refreshToken() == null || body.refreshToken().isBlank()) {
            return badRequest("Missing refresh token");
        }

        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkRefreshLike(
            body.refreshToken(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("refresh", rateLimit.retryAfterSeconds());
        }

        boolean revoked = identityService.revokeTokenFamily(body.refreshToken());
        if (!revoked) {
            return unauthorized(INVALID_REFRESH_TOKEN_MESSAGE);
        }

        return ResponseEntity.ok(Map.of("revoked", true));
    }

    private ResponseEntity<?> withLoginResult(LoginResult result) {
        if (result.mfaRequired()) {
            return noStore(ResponseEntity.ok()).body(Map.of(
                "state", "MFA_REQUIRED",
                "userId", result.userId().toString(),
                "tenantId", result.tenantId().toString(),
                "roles", result.roles(),
                "mfaToken", result.mfaToken()
            ));
        }

        ResponseCookie cookie = authCookieService.buildRefreshCookie(result.refreshToken());

        return noStore(ResponseEntity.ok())
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(Map.of(
                "state", "AUTHENTICATED",
                "userId", result.userId().toString(),
                "tenantId", result.tenantId().toString(),
                "roles", result.roles(),
                "accessToken", result.accessToken(),
                "expiresAt", result.accessTokenExpiresAt().toString()
            ));
    }

    private String extractCookie(String cookieHeader, String cookieName) {
        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String trimmed = cookie.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring((cookieName + "=").length());
            }
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> rateLimited(String action, long retryAfterSeconds) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds))
            .body(Map.of(
                "error",
                "rate_limited",
                "action",
                action,
                "retryAfterSeconds",
                retryAfterSeconds
            ));
    }

    private String clientFingerprint(String forwardedFor, HttpServletRequest request) {
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // Use the rightmost IP — it's set by the trusted reverse proxy and cannot
            // be spoofed by the client (unlike the leftmost entry).
            String[] values = forwardedFor.split(",");
            for (int i = values.length - 1; i >= 0; i--) {
                String ip = values[i].trim();
                if (!ip.isBlank()) {
                    return ip;
                }
            }
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private ResponseEntity.BodyBuilder noStore(ResponseEntity.BodyBuilder builder) {
        return builder
            .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
            .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
            .header(HttpHeaders.EXPIRES, EXPIRES_IMMEDIATELY);
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    private ResponseEntity<Map<String, String>> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", message));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private PasskeyMode parsePasskeyMode(String value) {
        if (!hasText(value)) {
            throw new IllegalArgumentException("mode required");
        }
        if ("register".equalsIgnoreCase(value)) {
            return PasskeyMode.REGISTER;
        }
        if ("authenticate".equalsIgnoreCase(value)) {
            return PasskeyMode.AUTHENTICATE;
        }
        throw new IllegalArgumentException("Unsupported passkey mode");
    }

    public record LoginHttpRequest(String email, String password) {
    }

    public record PasskeyBeginHttpRequest(String email, String mode) {
    }

    public record PasskeyVerifyHttpRequest(String email, String challengeId, String credentialJson, String mode) {
    }

    public record VerifyMfaHttpRequest(String userId, String mfaToken, String code, String backupCode, String emailCode) {
    }

    public record SendMfaEmailCodeHttpRequest(String userId, String mfaToken) {
    }

    public record EnableMfaHttpRequest(String userId) {
    }

    public record DisableMfaHttpRequest(String code, String backupCode) {
    }

    public record RefreshHttpRequest(String refreshToken) {
    }

    public record SignupHttpRequest(
        String email,
        String password,
        String fullName,
        String workspaceName,
        String tradeSlug,
        Map<String, Object> address,
        String planCode
    ) {
    }

    public record PasswordResetRequestHttpRequest(String email) {
    }

    public record ResetPasswordHttpRequest(String token, String password) {
    }
}
