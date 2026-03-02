package com.zunftgewerk.api.modules.identity.service;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

@Service
public class AuthRateLimitService {

    private static final String KEY_PREFIX = "zg:auth:ratelimit";

    private final StringRedisTemplate redisTemplate;
    private final MeterRegistry meterRegistry;
    private final TokenHashService tokenHashService;

    @Value("${zunftgewerk.auth.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${zunftgewerk.auth.rate-limit.login-limit:5}")
    private long loginLimit;

    @Value("${zunftgewerk.auth.rate-limit.login-window-seconds:60}")
    private long loginWindowSeconds;

    @Value("${zunftgewerk.auth.rate-limit.passkey-limit:10}")
    private long passkeyLimit;

    @Value("${zunftgewerk.auth.rate-limit.passkey-window-seconds:60}")
    private long passkeyWindowSeconds;

    @Value("${zunftgewerk.auth.rate-limit.mfa-limit:10}")
    private long mfaLimit;

    @Value("${zunftgewerk.auth.rate-limit.mfa-window-seconds:300}")
    private long mfaWindowSeconds;

    @Value("${zunftgewerk.auth.rate-limit.refresh-limit:30}")
    private long refreshLimit;

    @Value("${zunftgewerk.auth.rate-limit.refresh-window-seconds:60}")
    private long refreshWindowSeconds;

    public AuthRateLimitService(
        ObjectProvider<StringRedisTemplate> redisTemplateProvider,
        MeterRegistry meterRegistry,
        TokenHashService tokenHashService
    ) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.meterRegistry = meterRegistry;
        this.tokenHashService = tokenHashService;
    }

    public RateLimitDecision checkLogin(String email, String clientFingerprint, String protocol) {
        String emailHash = tokenHashService.hash(normalize(email));
        return check("login", emailHash, clientFingerprint, protocol, loginLimit, loginWindowSeconds);
    }

    public RateLimitDecision checkPasskey(String email, String clientFingerprint, String protocol) {
        String emailHash = tokenHashService.hash(normalize(email));
        return check("passkey", emailHash, clientFingerprint, protocol, passkeyLimit, passkeyWindowSeconds);
    }

    public RateLimitDecision checkMfa(String userId, String clientFingerprint, String protocol) {
        String userHash = tokenHashService.hash(normalize(userId));
        return check("mfa", userHash, clientFingerprint, protocol, mfaLimit, mfaWindowSeconds);
    }

    public RateLimitDecision checkRefreshLike(String rawRefreshToken, String clientFingerprint, String protocol) {
        String tokenHash = tokenHashService.hash(normalize(rawRefreshToken));
        String tokenPrefix = tokenHash.substring(0, Math.min(12, tokenHash.length()));
        return check("refresh", tokenPrefix, clientFingerprint, protocol, refreshLimit, refreshWindowSeconds);
    }

    private RateLimitDecision check(
        String action,
        String identifier,
        String clientFingerprint,
        String protocol,
        long limit,
        long windowSeconds
    ) {
        if (!enabled || redisTemplate == null) {
            return RateLimitDecision.allowed();
        }

        String key = KEY_PREFIX
            + ":" + action
            + ":" + identifier
            + ":" + hashFingerprint(clientFingerprint);

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count == null) {
                return RateLimitDecision.allowed();
            }

            if (count == 1L) {
                redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
            }

            if (count > limit) {
                Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                long retryAfterSeconds = ttl == null || ttl < 1 ? 1L : ttl;
                meterRegistry.counter(
                    "auth_rate_limit_blocked_total",
                    "action",
                    action,
                    "protocol",
                    protocol
                ).increment();
                return new RateLimitDecision(true, retryAfterSeconds);
            }

            return RateLimitDecision.allowed();
        } catch (RuntimeException ex) {
            return RateLimitDecision.allowed();
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String hashFingerprint(String fingerprint) {
        String normalized = fingerprint == null || fingerprint.isBlank() ? "unknown" : fingerprint.trim().toLowerCase();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString(normalized.hashCode());
        }
    }

    public record RateLimitDecision(boolean limited, long retryAfterSeconds) {
        public static RateLimitDecision allowed() {
            return new RateLimitDecision(false, 0L);
        }
    }
}
