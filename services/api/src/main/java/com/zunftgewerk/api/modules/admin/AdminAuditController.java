package com.zunftgewerk.api.modules.admin;

import com.zunftgewerk.api.modules.audit.entity.AuditEventEntity;
import com.zunftgewerk.api.modules.audit.repository.AuditEventRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin endpoint for exporting the immutable audit-event log.
 *
 * <p>Access is restricted to tenant members with the {@code owner} or {@code admin} role,
 * enforced via the same cookie-based session peek ({@code peekUser}) used by all other
 * cookie-auth controllers. Spring Security is configured to {@code permitAll} for
 * {@code /v1/admin/**}; authentication is handled explicitly here.
 *
 * <h2>Supported formats</h2>
 * <ul>
 *   <li>{@code format=json} (default) — {@code application/json} body with an {@code events} array</li>
 *   <li>{@code format=csv} — {@code text/csv} attachment with a header row followed by data rows</li>
 * </ul>
 *
 * <h2>Pagination</h2>
 * <p>Use {@code limit} (default 100, max 500) and {@code offset} (default 0) query parameters.
 * Results are ordered newest-first by {@code occurred_at}.
 *
 * <h2>Example — JSON</h2>
 * <pre>{@code
 * GET /v1/admin/audit-export?format=json&limit=50&offset=0
 * {
 *   "events": [
 *     {
 *       "id": "...",
 *       "eventType": "USER_LOGIN",
 *       "actorId": "...",
 *       "tenantId": "...",
 *       "payloadJson": "{}",
 *       "occurredAt": "2026-03-02T10:00:00Z"
 *     }
 *   ]
 * }
 * }</pre>
 *
 * <h2>Example — CSV</h2>
 * <pre>{@code
 * GET /v1/admin/audit-export?format=csv
 * Content-Disposition: attachment; filename="audit-export.csv"
 * id,eventType,actorId,tenantId,payloadJson,occurredAt
 * ...,USER_LOGIN,...,...,{},2026-03-02T10:00:00Z
 * }</pre>
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
@RestController
@RequestMapping("/v1/admin")
public class AdminAuditController {

    private static final int MAX_LIMIT = 500;

    private final AuditEventRepository auditEventRepository;
    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;

    public AdminAuditController(
        AuditEventRepository auditEventRepository,
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository
    ) {
        this.auditEventRepository = auditEventRepository;
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
    }

    /**
     * Exports audit events for the caller's tenant in JSON or CSV format.
     *
     * @param cookieHeader raw {@code Cookie} HTTP header forwarded by the client
     * @param format       output format: {@code json} (default) or {@code csv}
     * @param limit        maximum number of events to return (1–500, default 100)
     * @param offset       zero-based row offset for pagination (default 0)
     * @return {@code 200} with the export payload, {@code 401} if unauthenticated,
     *         {@code 403} if the caller is not an owner or admin
     */
    @GetMapping("/audit-export")
    public ResponseEntity<?> exportAuditLog(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(defaultValue = "json") String format,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        RefreshTokenService.PeekedSession session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        boolean isAdmin = membershipRepository
            .findByTenantIdAndUserId(session.tenantId(), session.userId())
            .stream()
            .anyMatch(m -> "owner".equals(m.getRoleKey()) || "admin".equals(m.getRoleKey()));
        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        int page = effectiveLimit > 0 ? offset / effectiveLimit : 0;

        List<AuditEventEntity> events = auditEventRepository
            .findByTenantIdOrderByOccurredAtDesc(
                session.tenantId(),
                PageRequest.of(page, effectiveLimit)
            );

        if ("csv".equalsIgnoreCase(format)) {
            return buildCsvResponse(events);
        }

        return buildJsonResponse(events);
    }

    // --- private helpers ---

    /**
     * Builds a JSON response containing an {@code events} array. Each element
     * exposes all audit fields using camelCase keys consistent with the rest of
     * the API surface.
     */
    private ResponseEntity<?> buildJsonResponse(List<AuditEventEntity> events) {
        List<Map<String, Object>> eventList = events.stream()
            .map(this::toJsonMap)
            .toList();

        return ResponseEntity.ok(Map.of("events", eventList));
    }

    /**
     * Builds a CSV response with {@code Content-Disposition: attachment} so
     * browsers trigger a download. Columns: id, eventType, actorId, tenantId,
     * payloadJson, occurredAt.
     *
     * <p>CSV values containing commas or newlines are enclosed in double-quotes.
     * Embedded double-quotes are escaped by doubling them per RFC 4180.
     */
    private ResponseEntity<String> buildCsvResponse(List<AuditEventEntity> events) {
        StringBuilder csv = new StringBuilder();
        csv.append("id,eventType,actorId,tenantId,payloadJson,occurredAt\n");

        for (AuditEventEntity e : events) {
            csv.append(csvValue(e.getId().toString())).append(",");
            csv.append(csvValue(e.getEventType())).append(",");
            csv.append(csvValue(e.getActorUserId().toString())).append(",");
            csv.append(csvValue(e.getTenantId().toString())).append(",");
            csv.append(csvValue(e.getPayloadJson())).append(",");
            csv.append(csvValue(e.getOccurredAt().toString())).append("\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-export.csv\"");
        headers.setContentType(MediaType.parseMediaType("text/csv"));

        return ResponseEntity.ok()
            .headers(headers)
            .body(csv.toString());
    }

    /**
     * Maps a single {@link AuditEventEntity} to a plain {@code Map} suitable for
     * JSON serialization. Field names use camelCase to match the API convention.
     */
    private Map<String, Object> toJsonMap(AuditEventEntity e) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", e.getId());
        map.put("eventType", e.getEventType());
        map.put("actorId", e.getActorUserId());
        map.put("tenantId", e.getTenantId());
        map.put("payloadJson", e.getPayloadJson());
        map.put("occurredAt", e.getOccurredAt());
        return map;
    }

    /**
     * Escapes a CSV field value per RFC 4180: wraps the value in double-quotes
     * if it contains a comma, double-quote, or newline character. Embedded
     * double-quotes are doubled.
     *
     * @param value the raw field value; {@code null} is treated as an empty string
     * @return the escaped CSV field
     */
    private String csvValue(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
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
