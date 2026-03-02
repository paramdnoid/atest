package com.zunftgewerk.api.modules.identity.service;

import com.zunftgewerk.api.modules.identity.entity.RefreshTokenEntity;
import com.zunftgewerk.api.modules.identity.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenHashService tokenHashService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long refreshTtlSeconds;

    public RefreshTokenService(
        RefreshTokenRepository refreshTokenRepository,
        TokenHashService tokenHashService,
        @Value("${zunftgewerk.security.jwt-refresh-ttl-seconds}") long refreshTtlSeconds
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenHashService = tokenHashService;
        this.refreshTtlSeconds = refreshTtlSeconds;
    }

    /**
     * Reads user/tenant from a refresh token without rotating it. Used for
     * unauthenticated status endpoints that want to identify the caller from
     * their cookie without consuming the token.
     */
    public java.util.Optional<PeekedSession> peekUser(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return java.util.Optional.empty();
        }
        String tokenHash = tokenHashService.hash(rawRefreshToken);
        return refreshTokenRepository.findByTokenHash(tokenHash)
            .filter(t -> t.getRevokedAt() == null && t.getExpiresAt().isAfter(OffsetDateTime.now()))
            .map(t -> new PeekedSession(t.getUserId(), t.getTenantId()));
    }

    public record PeekedSession(UUID userId, UUID tenantId) {
    }

    @Transactional
    public IssuedRefreshToken issue(UUID userId, UUID tenantId) {
        UUID familyId = UUID.randomUUID();
        return issue(userId, tenantId, familyId, null);
    }

    @Transactional
    public RotationResult rotate(String rawRefreshToken) {
        String tokenHash = tokenHashService.hash(rawRefreshToken);
        RefreshTokenEntity existing = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Unknown refresh token"));

        if (existing.getRevokedAt() != null || existing.getExpiresAt().isBefore(OffsetDateTime.now())) {
            revokeFamily(existing.getFamilyId());
            throw new RefreshTokenReuseDetectedException(existing.getFamilyId(), existing.getUserId(), existing.getTenantId());
        }

        existing.setRevokedAt(OffsetDateTime.now());
        existing.setLastUsedAt(OffsetDateTime.now());
        refreshTokenRepository.save(existing);

        IssuedRefreshToken rotated = issue(existing.getUserId(), existing.getTenantId(), existing.getFamilyId(), existing.getId());
        return new RotationResult(rotated.rawToken(), existing.getUserId(), existing.getTenantId(), existing.getFamilyId());
    }

    @Transactional
    public void revokeFamily(UUID familyId) {
        List<RefreshTokenEntity> familyTokens = refreshTokenRepository.findByFamilyId(familyId);
        OffsetDateTime now = OffsetDateTime.now();
        for (RefreshTokenEntity token : familyTokens) {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(now);
                refreshTokenRepository.save(token);
            }
        }
    }

    @Transactional
    public FamilyRevocationResult revokeFamilyByRawToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return FamilyRevocationResult.notFound();
        }

        String tokenHash = tokenHashService.hash(rawRefreshToken);
        RefreshTokenEntity token = refreshTokenRepository.findByTokenHash(tokenHash).orElse(null);
        if (token == null) {
            return FamilyRevocationResult.notFound();
        }

        revokeFamily(token.getFamilyId());
        return new FamilyRevocationResult(true, token.getFamilyId(), token.getUserId(), token.getTenantId());
    }

    private IssuedRefreshToken issue(UUID userId, UUID tenantId, UUID familyId, UUID rotatedFrom) {
        byte[] random = new byte[48];
        secureRandom.nextBytes(random);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(random);

        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setId(UUID.randomUUID());
        entity.setUserId(userId);
        entity.setTenantId(tenantId);
        entity.setTokenHash(tokenHashService.hash(rawToken));
        entity.setFamilyId(familyId);
        entity.setRotatedFrom(rotatedFrom);
        entity.setExpiresAt(OffsetDateTime.now().plusSeconds(refreshTtlSeconds));
        entity.setCreatedAt(OffsetDateTime.now());

        refreshTokenRepository.save(entity);
        return new IssuedRefreshToken(rawToken, entity.getFamilyId(), entity.getId());
    }

    public record IssuedRefreshToken(String rawToken, UUID familyId, UUID tokenId) {
    }

    public record RotationResult(String rawToken, UUID userId, UUID tenantId, UUID familyId) {
    }

    public record FamilyRevocationResult(boolean found, UUID familyId, UUID userId, UUID tenantId) {
        public static FamilyRevocationResult notFound() {
            return new FamilyRevocationResult(false, null, null, null);
        }
    }

    public static class RefreshTokenReuseDetectedException extends RuntimeException {
        private final UUID familyId;
        private final UUID userId;
        private final UUID tenantId;

        public RefreshTokenReuseDetectedException(UUID familyId, UUID userId, UUID tenantId) {
            super("Refresh token reuse detected");
            this.familyId = familyId;
            this.userId = userId;
            this.tenantId = tenantId;
        }

        public UUID getFamilyId() {
            return familyId;
        }

        public UUID getUserId() {
            return userId;
        }

        public UUID getTenantId() {
            return tenantId;
        }
    }
}
