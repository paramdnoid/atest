package com.zunftgewerk.api.modules.tenant.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.tenant.entity.TenantEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/workspace")
public class WorkspaceController {

    private final RefreshTokenService refreshTokenService;
    private final TenantRepository tenantRepository;
    private final MembershipRepository membershipRepository;
    private final ObjectMapper objectMapper;

    public WorkspaceController(
        RefreshTokenService refreshTokenService,
        TenantRepository tenantRepository,
        MembershipRepository membershipRepository,
        ObjectMapper objectMapper
    ) {
        this.refreshTokenService = refreshTokenService;
        this.tenantRepository = tenantRepository;
        this.membershipRepository = membershipRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getWorkspace(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        TenantEntity tenant = tenantRepository.findById(session.tenantId()).orElse(null);
        if (tenant == null) {
            return ResponseEntity.notFound().build();
        }

        long memberCount = membershipRepository.findByTenantId(session.tenantId()).size();

        Map<String, Object> response = new HashMap<>();
        response.put("id", tenant.getId().toString());
        response.put("name", tenant.getName());
        response.put("slug", tenant.getTradeSlug());
        response.put("memberCount", memberCount);
        putAddressFields(response, tenant.getAddressJson());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateWorkspace(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody PatchWorkspaceRequest body,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        // Check admin/owner role
        boolean isAdmin = membershipRepository.findByTenantIdAndUserId(session.tenantId(), session.userId())
            .stream()
            .anyMatch(m -> "owner".equals(m.getRoleKey()) || "admin".equals(m.getRoleKey()));
        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        TenantEntity tenant = tenantRepository.findById(session.tenantId()).orElse(null);
        if (tenant == null) {
            return ResponseEntity.notFound().build();
        }

        if (body.name() != null && !body.name().isBlank()) {
            tenant.setName(body.name().trim());
        }
        if (body.slug() != null) {
            tenant.setTradeSlug(body.slug().trim().isEmpty() ? null : body.slug().trim());
        }
        tenantRepository.save(tenant);

        long memberCount = membershipRepository.findByTenantId(session.tenantId()).size();
        Map<String, Object> response = new HashMap<>();
        response.put("id", tenant.getId().toString());
        response.put("name", tenant.getName());
        response.put("slug", tenant.getTradeSlug());
        response.put("memberCount", memberCount);
        putAddressFields(response, tenant.getAddressJson());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me/address")
    public ResponseEntity<?> updateAddress(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody PatchAddressRequest body,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        boolean isAdmin = membershipRepository.findByTenantIdAndUserId(session.tenantId(), session.userId())
            .stream()
            .anyMatch(m -> "owner".equals(m.getRoleKey()) || "admin".equals(m.getRoleKey()));
        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        TenantEntity tenant = tenantRepository.findById(session.tenantId()).orElse(null);
        if (tenant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            String addressJson = objectMapper.writeValueAsString(body);
            tenant.setAddressJson(addressJson);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to serialize address"));
        }
        tenantRepository.save(tenant);

        long memberCount = membershipRepository.findByTenantId(session.tenantId()).size();
        Map<String, Object> response = new HashMap<>();
        response.put("id", tenant.getId().toString());
        response.put("name", tenant.getName());
        response.put("slug", tenant.getTradeSlug());
        response.put("memberCount", memberCount);
        putAddressFields(response, tenant.getAddressJson());
        return ResponseEntity.ok(response);
    }

    private void putAddressFields(Map<String, Object> response, String addressJson) {
        response.put("addressLine1", null);
        response.put("addressLine2", null);
        response.put("postalCode", null);
        response.put("city", null);
        response.put("countryCode", null);
        response.put("latitude", null);
        response.put("longitude", null);

        if (addressJson == null || addressJson.isBlank()) return;

        try {
            Map<String, Object> addr = objectMapper.readValue(addressJson, new TypeReference<>() {});
            response.put("addressLine1", addr.get("addressLine1"));
            response.put("addressLine2", addr.get("addressLine2"));
            response.put("postalCode", addr.get("postalCode"));
            response.put("city", addr.get("city"));
            response.put("countryCode", addr.get("countryCode"));
            response.put("latitude", addr.get("latitude"));
            response.put("longitude", addr.get("longitude"));
        } catch (Exception ignored) {
            // leave all fields as null
        }
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

    record PatchWorkspaceRequest(String name, String slug) {}

    record PatchAddressRequest(
        String addressLine1,
        String addressLine2,
        String postalCode,
        String city,
        String countryCode,
        Double latitude,
        Double longitude
    ) {}
}
