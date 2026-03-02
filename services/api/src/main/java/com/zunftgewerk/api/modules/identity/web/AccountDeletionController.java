package com.zunftgewerk.api.modules.identity.web;

import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller handling GDPR-compliant account deletion.
 *
 * <p>{@code DELETE /v1/account} removes the authenticated user's account along with all
 * personally-identifiable data. Authentication is resolved via the {@code zg_refresh_token}
 * cookie using {@link RefreshTokenService#peekUser(String)} — the same pattern used across
 * all cookie-authenticated controllers in this service.
 *
 * <p>Deletion semantics:
 * <ul>
 *   <li>If the user is the <em>only owner</em> of their tenant, the entire tenant is deleted.
 *       Database {@code ON DELETE CASCADE} constraints propagate the deletion to all
 *       tenant-owned tables (memberships, subscriptions, devices, roles, etc.).</li>
 *   <li>If the tenant has at least one other member with {@code owner} or {@code admin} role,
 *       only the user's membership and user record are deleted; the tenant remains intact.</li>
 * </ul>
 *
 * <p>In both cases all active refresh tokens for the user are revoked before deletion, and
 * the {@code zg_refresh_token} cookie is cleared in the HTTP response.
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
@RestController
@RequestMapping("/v1/account")
public class AccountDeletionController {

    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final TenantRepository tenantRepository;
    private final AuthCookieService authCookieService;

    public AccountDeletionController(
        RefreshTokenService refreshTokenService,
        UserRepository userRepository,
        MembershipRepository membershipRepository,
        TenantRepository tenantRepository,
        AuthCookieService authCookieService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantRepository = tenantRepository;
        this.authCookieService = authCookieService;
    }

    /**
     * Deletes the currently authenticated account.
     *
     * <p>Resolves the caller from the {@code Cookie} request header without rotating the token.
     * Returns {@code 401} if no valid session cookie is present.
     *
     * @param cookieHeader the raw {@code Cookie} header forwarded by the browser
     * @param response     the HTTP response used to clear the refresh-token cookie on the client
     * @return {@code 200 {"message": "Account gelöscht"}} on success,
     *         {@code 401} if unauthenticated
     */
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteAccount(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletResponse response
    ) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;

        RefreshTokenService.PeekedSession session =
            refreshTokenService.peekUser(rawRefreshToken).orElse(null);

        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        UUID userId = session.userId();
        UUID tenantId = session.tenantId();

        // Revoke all active refresh tokens before deleting the user record so that
        // any concurrent requests using sibling tokens in the same family are rejected.
        refreshTokenService.revokeAllForUser(userId);

        // Clear the cookie on the client immediately.
        response.addHeader(HttpHeaders.SET_COOKIE,
            authCookieService.clearRefreshCookie().toString());

        // Determine whether this user is the sole privileged member of the tenant.
        List<MembershipEntity> tenantMemberships = membershipRepository.findByTenantId(tenantId);
        long otherAdminsOrOwners = tenantMemberships.stream()
            .filter(m -> !m.getUserId().equals(userId))
            .filter(m -> isPrivilegedRole(m.getRoleKey()))
            .count();

        if (otherAdminsOrOwners == 0) {
            // User is the sole owner/admin — cascade-delete the entire tenant.
            // ON DELETE CASCADE in all tenant-owned tables handles the propagation.
            tenantRepository.deleteById(tenantId);
        } else {
            // Other admins or owners exist — remove only this user's membership and record.
            List<MembershipEntity> userMemberships = membershipRepository.findByUserId(userId);
            membershipRepository.deleteAll(userMemberships);
            userRepository.deleteById(userId);
        }

        return ResponseEntity.ok(Map.of("message", "Account gelöscht"));
    }

    /**
     * Returns {@code true} for role keys that are considered privileged (owner or admin).
     * Mirrors the role-check convention used in other controllers such as
     * {@code WorkspaceController} and {@code TeamRestController}.
     *
     * @param roleKey the role key stored in {@link MembershipEntity#getRoleKey()}
     * @return {@code true} if the role is {@code owner} or {@code admin}
     */
    private boolean isPrivilegedRole(String roleKey) {
        return "owner".equalsIgnoreCase(roleKey) || "admin".equalsIgnoreCase(roleKey);
    }

    /**
     * Extracts the value of a named cookie from the raw {@code Cookie} header string.
     * Uses manual string parsing consistent with the rest of the codebase.
     *
     * @param cookieHeader raw value of the {@code Cookie} header
     * @param cookieName   the name of the cookie to look up
     * @return the cookie value, or {@code null} if not found
     */
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
