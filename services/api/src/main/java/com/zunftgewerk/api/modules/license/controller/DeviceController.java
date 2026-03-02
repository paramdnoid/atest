package com.zunftgewerk.api.modules.license.controller;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.license.entity.DeviceEntity;
import com.zunftgewerk.api.modules.license.repository.DeviceRepository;
import com.zunftgewerk.api.modules.tenant.entity.TenantEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/devices")
public class DeviceController {

    private final RefreshTokenService refreshTokenService;
    private final DeviceRepository deviceRepository;
    private final TenantRepository tenantRepository;
    private final MembershipRepository membershipRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public DeviceController(
        RefreshTokenService refreshTokenService,
        DeviceRepository deviceRepository,
        TenantRepository tenantRepository,
        MembershipRepository membershipRepository
    ) {
        this.refreshTokenService = refreshTokenService;
        this.deviceRepository = deviceRepository;
        this.tenantRepository = tenantRepository;
        this.membershipRepository = membershipRepository;
    }

    @GetMapping
    public ResponseEntity<?> listDevices(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<Map<String, Object>> devices = deviceRepository.findByTenantId(session.tenantId())
            .stream()
            .map(this::deviceToMap)
            .toList();
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/registration-token")
    public ResponseEntity<?> getRegistrationToken(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!isAdmin(session)) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        TenantEntity tenant = tenantRepository.findById(session.tenantId()).orElse(null);
        if (tenant == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of("token", tenant.getDeviceRegistrationToken() != null
            ? tenant.getDeviceRegistrationToken() : ""));
    }

    @PostMapping("/registration-token/renew")
    public ResponseEntity<?> renewRegistrationToken(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!isAdmin(session)) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        TenantEntity tenant = tenantRepository.findById(session.tenantId()).orElse(null);
        if (tenant == null) return ResponseEntity.notFound().build();

        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        tenant.setDeviceRegistrationToken(token);
        tenantRepository.save(tenant);

        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/{id}/license")
    public ResponseEntity<?> assignLicense(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable UUID id,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!isAdmin(session)) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        DeviceEntity device = deviceRepository.findById(id).orElse(null);
        if (device == null || !session.tenantId().equals(device.getTenantId())) {
            return ResponseEntity.notFound().build();
        }

        device.setStatus("licensed");
        device.setLicensedAt(OffsetDateTime.now());
        device.setRevokedAt(null);
        deviceRepository.save(device);

        return ResponseEntity.ok(deviceToMap(device));
    }

    @DeleteMapping("/{id}/license")
    public ResponseEntity<?> revokeLicense(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable UUID id,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!isAdmin(session)) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        DeviceEntity device = deviceRepository.findById(id).orElse(null);
        if (device == null || !session.tenantId().equals(device.getTenantId())) {
            return ResponseEntity.notFound().build();
        }

        device.setStatus("revoked");
        device.setRevokedAt(OffsetDateTime.now());
        deviceRepository.save(device);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable UUID id,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!isAdmin(session)) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        DeviceEntity device = deviceRepository.findById(id).orElse(null);
        if (device == null || !session.tenantId().equals(device.getTenantId())) {
            return ResponseEntity.notFound().build();
        }

        deviceRepository.delete(device);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> deviceToMap(DeviceEntity d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId().toString());
        m.put("name", d.getName());
        m.put("platform", d.getPlatform());
        m.put("status", d.getStatus());
        m.put("licensedAt", d.getLicensedAt());
        m.put("revokedAt", d.getRevokedAt());
        m.put("lastSeenAt", d.getLastSeenAt());
        m.put("createdAt", d.getCreatedAt());
        return m;
    }

    private boolean isAdmin(RefreshTokenService.PeekedSession session) {
        return membershipRepository.findByTenantIdAndUserId(session.tenantId(), session.userId())
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
}
