package com.zunftgewerk.api.modules.identity.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;

@Service
public class AuthCookieService {

    public static final String REFRESH_COOKIE = "zg_refresh_token";

    private final Environment environment;

    @Value("${zunftgewerk.auth.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${zunftgewerk.auth.cookie.secure:}")
    private String secureOverride;

    @Value("${zunftgewerk.auth.cookie.domain:}")
    private String domain;

    @Value("${zunftgewerk.auth.cookie.path:/}")
    private String path;

    @Value("${zunftgewerk.auth.cookie.max-age-seconds:${zunftgewerk.security.jwt-refresh-ttl-seconds}}")
    private long maxAgeSeconds;

    public AuthCookieService(Environment environment) {
        this.environment = environment;
    }

    public ResponseCookie buildRefreshCookie(String refreshToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_COOKIE, refreshToken)
            .httpOnly(true)
            .secure(isSecureCookieEnabled())
            .sameSite(normalizeSameSite(sameSite))
            .path(path)
            .maxAge(Duration.ofSeconds(maxAgeSeconds));

        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }

        return builder.build();
    }

    public ResponseCookie clearRefreshCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_COOKIE, "")
            .httpOnly(true)
            .secure(isSecureCookieEnabled())
            .sameSite(normalizeSameSite(sameSite))
            .path(path)
            .maxAge(Duration.ZERO);

        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }

        return builder.build();
    }

    private String normalizeSameSite(String configured) {
        if (configured == null || configured.isBlank()) {
            return "Lax";
        }
        if ("None".equalsIgnoreCase(configured)) {
            return "None";
        }
        if ("Strict".equalsIgnoreCase(configured)) {
            return "Strict";
        }
        return "Lax";
    }

    private boolean isSecureCookieEnabled() {
        if (secureOverride != null && !secureOverride.isBlank()) {
            return Boolean.parseBoolean(secureOverride);
        }
        return Arrays.stream(environment.getActiveProfiles())
            .anyMatch(profile -> "prod".equalsIgnoreCase(profile));
    }
}
