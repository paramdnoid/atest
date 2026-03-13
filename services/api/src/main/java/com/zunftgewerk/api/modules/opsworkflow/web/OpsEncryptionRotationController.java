package com.zunftgewerk.api.modules.opsworkflow.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.shared.security.FieldEncryptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/ops/encryption/rotation")
public class OpsEncryptionRotationController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final FieldEncryptionService fieldEncryptionService;

    public OpsEncryptionRotationController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        FieldEncryptionService fieldEncryptionService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.fieldEncryptionService = fieldEncryptionService;
    }

    @GetMapping("/status")
    public ResponseEntity<?> status(@RequestHeader(value = "Cookie", required = false) String cookieHeader) {
        RefreshTokenService.PeekedSession session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!isAdminOrOwner(session.tenantId(), session.userId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("enabled", fieldEncryptionService.isEnabled());
        response.put("keyVersion", fieldEncryptionService.keyVersion());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody(required = false) ValidateRotationRequest request
    ) {
        RefreshTokenService.PeekedSession session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!isAdminOrOwner(session.tenantId(), session.userId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        if (!fieldEncryptionService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Field encryption is disabled"));
        }

        String probe = request != null && request.probe() != null && !request.probe().isBlank()
            ? request.probe().trim()
            : "rotation-check";
        String aad = request != null ? request.aad() : null;

        try {
            String decrypted = fieldEncryptionService.roundTrip(probe, aad);
            Map<String, Object> response = new HashMap<>();
            response.put("success", probe.equals(decrypted));
            response.put("keyVersion", fieldEncryptionService.keyVersion());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "Rotation validation failed";
            return ResponseEntity.badRequest().body(Map.of("error", message));
        }
    }

    private boolean isAdminOrOwner(UUID tenantId, UUID userId) {
        return membershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .stream()
            .anyMatch(m -> "owner".equals(m.getRoleKey()) || "admin".equals(m.getRoleKey()));
    }

    private RefreshTokenService.PeekedSession resolveSession(String cookieHeader) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;
        return refreshTokenService.peekUser(rawRefreshToken).orElse(null);
    }

    private String extractCookie(String cookieHeader, String cookieName) {
        for (String part : cookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring(cookieName.length() + 1);
            }
        }
        return null;
    }

    record ValidateRotationRequest(String probe, String aad) {}
}
