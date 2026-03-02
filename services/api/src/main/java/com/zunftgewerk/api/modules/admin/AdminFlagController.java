package com.zunftgewerk.api.modules.admin;

import com.zunftgewerk.api.config.FeatureFlagProperties;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Internal admin endpoint exposing the current runtime feature flag state.
 *
 * <p>Access is restricted to tenant members with the {@code owner} or {@code admin} role,
 * enforced via the same cookie-based session peek used by other cookie-auth controllers.
 * Spring Security is configured to {@code permitAll} for {@code /v1/admin/**} because
 * authentication is handled explicitly in this controller rather than via a JWT filter.
 *
 * <p>Example response:
 * <pre>{@code
 * GET /v1/admin/flags
 * {
 *   "flags": {
 *     "syncEngineV1": true,
 *     "stripeBilling": true,
 *     "customRoles": true,
 *     "passkeyAuth": true,
 *     "mfaEnforcementAdmin": false,
 *     "authV2Enabled": true,
 *     "stripeWebhookEnabled": true,
 *     "syncVectorResolverEnabled": true
 *   }
 * }
 * }</pre>
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
@RestController
@RequestMapping("/v1/admin")
public class AdminFlagController {

    private final FeatureFlagProperties featureFlagProperties;
    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;

    public AdminFlagController(
        FeatureFlagProperties featureFlagProperties,
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository
    ) {
        this.featureFlagProperties = featureFlagProperties;
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
    }

    /**
     * Returns all runtime feature flags as a key-value map.
     *
     * <p>Only callers whose refresh token belongs to a tenant member with the
     * {@code owner} or {@code admin} role may access this endpoint.
     * Unauthenticated callers receive {@code 401}; callers with insufficient
     * privilege receive {@code 403}.
     *
     * @param cookieHeader the raw {@code Cookie} HTTP header forwarded by the client
     * @return {@code 200} with a {@code flags} map, {@code 401} or {@code 403} on error
     */
    @GetMapping("/flags")
    public ResponseEntity<?> getFlags(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader
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

        Map<String, Object> flags = buildFlagsMap();
        return ResponseEntity.ok(Map.of("flags", flags));
    }

    // --- private helpers ---

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

    /**
     * Builds an ordered map of all feature flags using camelCase keys so the
     * JSON response matches the existing {@code config/feature-flags.json} schema.
     */
    private Map<String, Object> buildFlagsMap() {
        Map<String, Object> flags = new LinkedHashMap<>();
        flags.put("syncEngineV1",            featureFlagProperties.isSyncEngineV1());
        flags.put("stripeBilling",           featureFlagProperties.isStripeBilling());
        flags.put("customRoles",             featureFlagProperties.isCustomRoles());
        flags.put("passkeyAuth",             featureFlagProperties.isPasskeyAuth());
        flags.put("mfaEnforcementAdmin",     featureFlagProperties.isMfaEnforcementAdmin());
        flags.put("authV2Enabled",           featureFlagProperties.isAuthV2Enabled());
        flags.put("stripeWebhookEnabled",    featureFlagProperties.isStripeWebhookEnabled());
        flags.put("syncVectorResolverEnabled", featureFlagProperties.isSyncVectorResolverEnabled());
        return flags;
    }
}
