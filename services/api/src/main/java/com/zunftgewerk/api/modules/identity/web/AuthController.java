package com.zunftgewerk.api.modules.identity.web;

import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.MfaEnrollmentResult;
import com.zunftgewerk.api.modules.identity.model.MfaVerifyResult;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "zg_refresh_token";

    private final IdentityService identityService;
    private final JwtService jwtService;

    public AuthController(IdentityService identityService, JwtService jwtService) {
        this.identityService = identityService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginHttpRequest request) {
        try {
            LoginResult result = identityService.login(request.email(), request.password());
            return withLoginResult(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/passkey/begin")
    public ResponseEntity<?> beginPasskey(@RequestBody PasskeyBeginHttpRequest request) {
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
    public ResponseEntity<?> verifyPasskey(@RequestBody PasskeyVerifyHttpRequest request) {
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
    public ResponseEntity<?> verifyMfa(@RequestBody VerifyMfaHttpRequest request) {
        try {
            MfaVerifyResult result = identityService.verifyMfa(
                UUID.fromString(request.userId()),
                request.mfaToken(),
                request.code(),
                request.backupCode()
            );

            ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();

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
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
    ) {
        String refreshToken = body != null ? body.refreshToken() : null;
        if ((refreshToken == null || refreshToken.isBlank()) && cookieHeader != null) {
            refreshToken = extractCookie(cookieHeader, REFRESH_COOKIE);
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing refresh token"));
        }

        try {
            RefreshResult result = identityService.refreshToken(refreshToken);
            ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();

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

        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofDays(30))
            .build();

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
