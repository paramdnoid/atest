package com.zunftgewerk.api.modules.identity.web;

import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.MfaEnrollmentResult;
import com.zunftgewerk.api.modules.identity.model.MfaVerifyResult;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.service.AuthRateLimitService;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final IdentityService identityService;
    private final JwtService jwtService;
    private final AuthCookieService authCookieService;
    private final AuthRateLimitService authRateLimitService;

    public AuthController(
        IdentityService identityService,
        JwtService jwtService,
        AuthCookieService authCookieService,
        AuthRateLimitService authRateLimitService
    ) {
        this.identityService = identityService;
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
        this.authRateLimitService = authRateLimitService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
        @RequestBody LoginHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
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
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/passkey/begin")
    public ResponseEntity<?> beginPasskey(
        @RequestBody PasskeyBeginHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkPasskey(
            request.email(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("passkey", rateLimit.retryAfterSeconds());
        }

        try {
            PasskeyMode mode = "register".equalsIgnoreCase(request.mode()) ? PasskeyMode.REGISTER : PasskeyMode.AUTHENTICATE;
            PasskeyBeginResult result = identityService.beginPasskey(request.email(), mode);
            return ResponseEntity.ok(Map.of(
                "challenge", result.challenge(),
                "challengeId", result.challengeId(),
                "mode", result.mode().name().toLowerCase(),
                "options", result.optionsJson()
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/passkey/verify")
    public ResponseEntity<?> verifyPasskey(
        @RequestBody PasskeyVerifyHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
        AuthRateLimitService.RateLimitDecision rateLimit = authRateLimitService.checkPasskey(
            request.email(),
            clientFingerprint(forwardedFor, servletRequest),
            "http"
        );
        if (rateLimit.limited()) {
            return rateLimited("passkey", rateLimit.retryAfterSeconds());
        }

        try {
            PasskeyMode mode = "register".equalsIgnoreCase(request.mode()) ? PasskeyMode.REGISTER : PasskeyMode.AUTHENTICATE;
            LoginResult result = identityService.verifyPasskey(request.email(), request.challengeId(), request.credentialJson(), mode);
            return withLoginResult(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(
        @RequestBody EnableMfaHttpRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing bearer token"));
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
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verifyMfa(
        @RequestBody VerifyMfaHttpRequest request,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        HttpServletRequest servletRequest
    ) {
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
                request.backupCode()
            );

            ResponseCookie cookie = authCookieService.buildRefreshCookie(result.refreshToken());

            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                    "verified", result.verified(),
                    "accessToken", result.accessToken(),
                    "expiresAt", result.accessTokenExpiresAt().toString()
                ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing refresh token"));
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

            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                    "accessToken", result.accessToken(),
                    "expiresAt", result.accessTokenExpiresAt().toString()
                ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing refresh token"));
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Missing refresh token"));
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
        }

        return ResponseEntity.ok(Map.of("revoked", true));
    }

    private ResponseEntity<?> withLoginResult(LoginResult result) {
        if (result.mfaRequired()) {
            return ResponseEntity.ok(Map.of(
                "state", "MFA_REQUIRED",
                "userId", result.userId().toString(),
                "tenantId", result.tenantId().toString(),
                "roles", result.roles(),
                "mfaToken", result.mfaToken()
            ));
        }

        ResponseCookie cookie = authCookieService.buildRefreshCookie(result.refreshToken());

        return ResponseEntity.ok()
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
            String[] values = forwardedFor.split(",");
            if (values.length > 0 && !values[0].trim().isBlank()) {
                return values[0].trim();
            }
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    public record LoginHttpRequest(String email, String password) {
    }

    public record PasskeyBeginHttpRequest(String email, String mode) {
    }

    public record PasskeyVerifyHttpRequest(String email, String challengeId, String credentialJson, String mode) {
    }

    public record VerifyMfaHttpRequest(String userId, String mfaToken, String code, String backupCode) {
    }

    public record EnableMfaHttpRequest(String userId) {
    }

    public record RefreshHttpRequest(String refreshToken) {
    }
}
