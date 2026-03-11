package com.zunftgewerk.api.modules.tenant.controller;

import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.entity.TeamInviteTokenEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.service.TeamInviteService;
import com.zunftgewerk.api.shared.audit.AuditEventType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for team management within a tenant.
 *
 * <p>Authentication is performed by resolving the {@code zg_refresh_token} cookie
 * via {@link RefreshTokenService#peekUser(String)}, consistent with the pattern
 * used in {@code WorkspaceController} and {@code BillingRestController}.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code GET /v1/team/members} — returns all members of the caller's tenant</li>
 *   <li>{@code POST /v1/team/invite} — sends an invite email to a prospective member</li>
 *   <li>{@code POST /v1/team/invites/accept} — accepts an invite (no auth required, token IS the auth)</li>
 * </ul>
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
@RestController
@RequestMapping("/v1/team")
public class TeamRestController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final TeamInviteService teamInviteService;
    private final AuditService auditService;

    public TeamRestController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        UserRepository userRepository,
        TeamInviteService teamInviteService,
        AuditService auditService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.teamInviteService = teamInviteService;
        this.auditService = auditService;
    }

    /**
     * Returns all members belonging to the authenticated caller's tenant.
     *
     * <p>For each membership, user details (email, fullName) are fetched from the
     * {@code users} table via {@link UserRepository#findById(Object)}. If a user
     * record cannot be found (data integrity issue), the member entry is still
     * included with {@code null} values for user-specific fields.
     *
     * @param cookieHeader the raw {@code Cookie} request header, may be {@code null}
     * @return 200 with {@code { "members": [...] }}, 401 if unauthenticated
     */
    @GetMapping("/members")
    public ResponseEntity<?> getMembers(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return error(401, "UNAUTHORIZED", "Nicht authentifiziert.");
        }

        UUID tenantId = session.tenantId();
        List<MembershipEntity> memberships = membershipRepository.findByTenantId(tenantId);

        List<Map<String, Object>> members = new ArrayList<>(memberships.size());
        for (MembershipEntity membership : memberships) {
            UserEntity user = userRepository.findById(membership.getUserId()).orElse(null);

            Map<String, Object> memberMap = new HashMap<>();
            memberMap.put("userId", membership.getUserId().toString());
            memberMap.put("email", user != null ? user.getEmail() : null);
            memberMap.put("name", user != null ? user.getFullName() : null);
            memberMap.put("role", membership.getRoleKey());
            memberMap.put("joinedAt", membership.getCreatedAt());
            members.add(memberMap);
        }

        return ResponseEntity.ok(Map.of("members", members));
    }

    /**
     * Sends an invite email to a prospective team member.
     *
     * <p>Requires the caller to be authenticated and to hold the {@code owner} or
     * {@code admin} role within their tenant. Delegates to {@link TeamInviteService}
     * for token generation, persistence, email delivery, and audit recording.
     *
     * @param cookieHeader the raw {@code Cookie} request header, may be {@code null}
     * @param body         request body expecting {@code { "email": "...", "role": "member" }}
     * @return 200 with invite details, 401 if unauthenticated, 403 if not admin/owner
     */
    @PostMapping("/invite")
    public ResponseEntity<?> inviteMember(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody InviteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        boolean isAdmin = membershipRepository
            .findByTenantIdAndUserId(session.tenantId(), session.userId())
            .stream()
            .anyMatch(m -> "owner".equals(m.getRoleKey()) || "admin".equals(m.getRoleKey()));

        if (!isAdmin) {
            return error(403, "FORBIDDEN", "Keine Berechtigung.");
        }

        String email = body.email();
        String roleKey = body.role() != null ? body.role() : "member";

        if (email == null || email.isBlank()) {
            return error(400, "EMAIL_REQUIRED", "E-Mail-Adresse ist erforderlich.");
        }

        TeamInviteTokenEntity invite;
        try {
            invite = teamInviteService.invite(
                session.tenantId(), session.userId(), email.trim().toLowerCase(), roleKey);
        } catch (TeamInviteService.TeamInvitePolicyException ex) {
            auditService.record(
                session.tenantId(),
                session.userId(),
                AuditEventType.MEMBER_INVITE_BLOCKED,
                "{\"email\":\"" + email.trim().toLowerCase() + "\",\"reason\":\"" + ex.code() + "\"}"
            );
            return error(409, ex.code(), ex.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "inviteId", invite.getId().toString(),
            "email", invite.getInvitedEmail(),
            "role", invite.getRoleKey(),
            "expiresAt", invite.getExpiresAt().toString()
        ));
    }

    /**
     * Accepts an invite using the raw token from the invite email.
     *
     * <p>No authentication is required — the token itself serves as proof of
     * access to the invited email address.
     *
     * @param body request body expecting {@code { "token": "..." }}
     * @return 200 on success, 400 with error details on failure
     */
    @PostMapping("/invites/accept")
    public ResponseEntity<?> acceptInvite(@RequestBody AcceptInviteRequest body) {
        if (body.token() == null || body.token().isBlank()) {
            return error(400, "TOKEN_REQUIRED", "Token ist erforderlich.");
        }

        TeamInviteService.AcceptInviteResult result = teamInviteService.acceptInvite(body.token());

        if (!result.success()) {
            int status = "NO_AVAILABLE_SEAT".equals(result.code()) ? 409 : 400;
            return error(status, result.code(), result.error());
        }

        return ResponseEntity.ok(Map.of(
            "message", "Einladung erfolgreich angenommen.",
            "membershipId", result.membershipId().toString()
        ));
    }

    private ResponseEntity<Map<String, Object>> error(int status, String code, String message) {
        return ResponseEntity.status(status).body(Map.of("code", code, "error", message));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Request records
    // -------------------------------------------------------------------------

    /**
     * Request body for {@code POST /v1/team/invite}.
     *
     * @param email the email address of the person to invite
     * @param role  the role to assign; defaults to {@code "member"} if omitted
     */
    record InviteRequest(String email, String role) {}

    /**
     * Request body for {@code POST /v1/team/invites/accept}.
     *
     * @param token the raw invite token from the email link
     */
    record AcceptInviteRequest(String token) {}
}
