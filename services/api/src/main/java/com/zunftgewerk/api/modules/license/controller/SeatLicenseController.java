package com.zunftgewerk.api.modules.license.controller;

import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.shared.audit.AuditEventType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/licenses")
public class SeatLicenseController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final SeatLicenseManagementService seatLicenseManagementService;
    private final AuditService auditService;

    public SeatLicenseController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        UserRepository userRepository,
        SeatLicenseManagementService seatLicenseManagementService,
        AuditService auditService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.seatLicenseManagementService = seatLicenseManagementService;
        this.auditService = auditService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return error(401, "UNAUTHORIZED", "Nicht authentifiziert.");
        }

        var summary = seatLicenseManagementService.summary(session.tenantId());
        return ResponseEntity.ok(Map.of(
            "includedSeats", summary.includedSeats(),
            "usedSeats", summary.usedSeats(),
            "availableSeats", summary.availableSeats(),
            "overLimit", summary.overLimit()
        ));
    }

    @GetMapping("/seats")
    public ResponseEntity<?> getSeats(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return error(401, "UNAUTHORIZED", "Nicht authentifiziert.");
        }

        List<Map<String, Object>> seats = membershipRepository.findByTenantId(session.tenantId())
            .stream()
            .map(member -> memberWithSeat(member, session.tenantId()))
            .toList();

        return ResponseEntity.ok(Map.of("seats", seats));
    }

    @PostMapping("/seats/assign")
    public ResponseEntity<?> assignSeat(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody SeatActionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return error(401, "UNAUTHORIZED", "Nicht authentifiziert.");
        }
        if (!isAdmin(session)) {
            return error(403, "FORBIDDEN", "Keine Berechtigung.");
        }

        ParsedUserId parsed = parseUserId(body);
        if (parsed.userId() == null) {
            return error(400, parsed.code(), parsed.message());
        }
        UUID userId = parsed.userId();
        boolean isMember = membershipRepository.findByTenantIdAndUserId(session.tenantId(), userId).stream().findAny().isPresent();
        if (!isMember) {
            return error(400, "USER_NOT_IN_TENANT", "Benutzer ist kein Teammitglied.");
        }

        try {
            var seat = seatLicenseManagementService.assignSeat(session.tenantId(), userId);
            auditService.record(
                session.tenantId(),
                session.userId(),
                AuditEventType.SEAT_ASSIGNED,
                "{\"userId\":\"" + userId + "\"}"
            );
            return ResponseEntity.ok(seatLicenseManagementService.seatToMap(seat));
        } catch (SeatLicenseManagementService.SeatPolicyException ex) {
            return error(409, ex.code(), ex.getMessage());
        }
    }

    @PostMapping("/seats/revoke")
    public ResponseEntity<?> revokeSeat(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody SeatActionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return error(401, "UNAUTHORIZED", "Nicht authentifiziert.");
        }
        if (!isAdmin(session)) {
            return error(403, "FORBIDDEN", "Keine Berechtigung.");
        }

        ParsedUserId parsed = parseUserId(body);
        if (parsed.userId() == null) {
            return error(400, parsed.code(), parsed.message());
        }
        UUID userId = parsed.userId();
        try {
            boolean revoked = seatLicenseManagementService.revokeSeat(session.tenantId(), userId);
            if (!revoked) {
                return error(409, "ACTIVE_SEAT_NOT_FOUND", "Keine aktive Benutzerlizenz gefunden.");
            }
            auditService.record(
                session.tenantId(),
                session.userId(),
                AuditEventType.SEAT_REVOKED,
                "{\"userId\":\"" + userId + "\"}"
            );
            return ResponseEntity.noContent().build();
        } catch (SeatLicenseManagementService.SeatPolicyException ex) {
            return error(409, ex.code(), ex.getMessage());
        }
    }

    private Map<String, Object> memberWithSeat(MembershipEntity membership, UUID tenantId) {
        UserEntity user = userRepository.findById(membership.getUserId()).orElse(null);
        boolean hasSeat = seatLicenseManagementService.hasActiveSeat(tenantId, membership.getUserId());
        Map<String, Object> result = new HashMap<>();
        result.put("userId", membership.getUserId().toString());
        result.put("email", user != null ? user.getEmail() : null);
        result.put("name", user != null ? user.getFullName() : null);
        result.put("role", membership.getRoleKey());
        result.put("joinedAt", membership.getCreatedAt());
        result.put("seatStatus", hasSeat ? "ACTIVE" : "NONE");
        return result;
    }

    private ParsedUserId parseUserId(SeatActionRequest body) {
        if (body == null || body.userId() == null || body.userId().isBlank()) {
            return new ParsedUserId(null, "MISSING_USER_ID", "userId ist erforderlich.");
        }
        try {
            return new ParsedUserId(UUID.fromString(body.userId()), null, null);
        } catch (IllegalArgumentException ex) {
            return new ParsedUserId(null, "INVALID_USER_ID", "userId ist nicht gueltig.");
        }
    }

    private ResponseEntity<Map<String, Object>> error(int status, String code, String message) {
        return ResponseEntity.status(status).body(Map.of("code", code, "error", message));
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

    record SeatActionRequest(String userId) {
    }

    record ParsedUserId(UUID userId, String code, String message) {
    }
}
