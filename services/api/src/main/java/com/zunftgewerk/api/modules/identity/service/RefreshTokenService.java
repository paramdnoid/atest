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
