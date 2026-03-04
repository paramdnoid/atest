package com.zunftgewerk.api.modules.identity;

import com.zunftgewerk.api.modules.identity.entity.RefreshTokenEntity;
import com.zunftgewerk.api.modules.identity.repository.RefreshTokenRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService.IssuedRefreshToken;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService.RefreshTokenReuseDetectedException;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService.RotationResult;
import com.zunftgewerk.api.modules.identity.service.TokenHashService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private TokenHashService tokenHashService;
    private RefreshTokenService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        tokenHashService = new TokenHashService();
        service = new RefreshTokenService(refreshTokenRepository, tokenHashService, 86400);

        when(refreshTokenRepository.save(any(RefreshTokenEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldIssueTokenWithNewFamily() {
        IssuedRefreshToken issued = service.issue(userId, tenantId);

        assertThat(issued.rawToken()).isNotBlank();
        assertThat(issued.familyId()).isNotNull();

        ArgumentCaptor<RefreshTokenEntity> captor = ArgumentCaptor.forClass(RefreshTokenEntity.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshTokenEntity saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getFamilyId()).isEqualTo(issued.familyId());
        assertThat(saved.getRotatedFrom()).isNull();
        assertThat(saved.getRevokedAt()).isNull();
        assertThat(saved.getExpiresAt()).isAfter(OffsetDateTime.now());
        assertThat(saved.getTokenHash()).isEqualTo(tokenHashService.hash(issued.rawToken()));
    }

    @Test
    void shouldRotateValidToken() {
        String rawToken = "test-token-abc123";
        String tokenHash = tokenHashService.hash(rawToken);
        UUID familyId = UUID.randomUUID();
        UUID tokenId = UUID.randomUUID();

        RefreshTokenEntity existing = validToken(tokenId, tokenHash, familyId);
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(existing));

        RotationResult result = service.rotate(rawToken);

        assertThat(result.rawToken()).isNotBlank();
        assertThat(result.rawToken()).isNotEqualTo(rawToken);
        assertThat(result.userId()).isEqualTo(userId);
        assertThat(result.tenantId()).isEqualTo(tenantId);
        assertThat(result.familyId()).isEqualTo(familyId);

        // Old token should be revoked
        assertThat(existing.getRevokedAt()).isNotNull();
        assertThat(existing.getLastUsedAt()).isNotNull();

        // New token saved with same familyId
        ArgumentCaptor<RefreshTokenEntity> captor = ArgumentCaptor.forClass(RefreshTokenEntity.class);
        verify(refreshTokenRepository, times(2)).save(captor.capture());

        RefreshTokenEntity newToken = captor.getAllValues().get(1);
        assertThat(newToken.getFamilyId()).isEqualTo(familyId);
        assertThat(newToken.getRotatedFrom()).isEqualTo(tokenId);
        assertThat(newToken.getRevokedAt()).isNull();
    }

    @Test
    void shouldDetectReuseOfRevokedToken() {
        String rawToken = "reused-token";
        String tokenHash = tokenHashService.hash(rawToken);
        UUID familyId = UUID.randomUUID();

        RefreshTokenEntity revoked = validToken(UUID.randomUUID(), tokenHash, familyId);
        revoked.setRevokedAt(OffsetDateTime.now().minusMinutes(5));

        RefreshTokenEntity siblingActive = validToken(UUID.randomUUID(), "other-hash", familyId);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(revoked));
        when(refreshTokenRepository.findByFamilyId(familyId)).thenReturn(List.of(revoked, siblingActive));

        assertThatThrownBy(() -> service.rotate(rawToken))
            .isInstanceOf(RefreshTokenReuseDetectedException.class);

        // Entire family should be revoked
        assertThat(siblingActive.getRevokedAt()).isNotNull();
    }

    @Test
    void shouldDetectReuseOfExpiredToken() {
        String rawToken = "expired-token";
        String tokenHash = tokenHashService.hash(rawToken);
        UUID familyId = UUID.randomUUID();

        RefreshTokenEntity expired = validToken(UUID.randomUUID(), tokenHash, familyId);
        expired.setExpiresAt(OffsetDateTime.now().minusHours(1));

        RefreshTokenEntity siblingActive = validToken(UUID.randomUUID(), "other-hash", familyId);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expired));
        when(refreshTokenRepository.findByFamilyId(familyId)).thenReturn(List.of(expired, siblingActive));

        assertThatThrownBy(() -> service.rotate(rawToken))
            .isInstanceOf(RefreshTokenReuseDetectedException.class);

        assertThat(siblingActive.getRevokedAt()).isNotNull();
    }

    @Test
    void shouldThrowOnUnknownToken() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotate("unknown-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Unknown refresh token");
    }

    @Test
    void shouldRevokeFamilyTokens() {
        UUID familyId = UUID.randomUUID();
        RefreshTokenEntity t1 = validToken(UUID.randomUUID(), "h1", familyId);
        RefreshTokenEntity t2 = validToken(UUID.randomUUID(), "h2", familyId);
        RefreshTokenEntity t3 = validToken(UUID.randomUUID(), "h3", familyId);
        t3.setRevokedAt(OffsetDateTime.now().minusDays(1)); // already revoked

        when(refreshTokenRepository.findByFamilyId(familyId)).thenReturn(List.of(t1, t2, t3));

        service.revokeFamily(familyId);

        assertThat(t1.getRevokedAt()).isNotNull();
        assertThat(t2.getRevokedAt()).isNotNull();
        // t3 was already revoked — save called only for t1 and t2
        verify(refreshTokenRepository, times(2)).save(any());
    }

    @Test
    void shouldRevokeAllTokensForUser() {
        RefreshTokenEntity t1 = validToken(UUID.randomUUID(), "h1", UUID.randomUUID());
        RefreshTokenEntity t2 = validToken(UUID.randomUUID(), "h2", UUID.randomUUID());

        when(refreshTokenRepository.findByUserId(userId)).thenReturn(List.of(t1, t2));

        service.revokeAllForUser(userId);

        assertThat(t1.getRevokedAt()).isNotNull();
        assertThat(t2.getRevokedAt()).isNotNull();
    }

    @Test
    void shouldPeekUserFromValidToken() {
        String rawToken = "peek-token";
        String tokenHash = tokenHashService.hash(rawToken);

        RefreshTokenEntity entity = validToken(UUID.randomUUID(), tokenHash, UUID.randomUUID());
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(entity));

        var result = service.peekUser(rawToken);

        assertThat(result).isPresent();
        assertThat(result.get().userId()).isEqualTo(userId);
        assertThat(result.get().tenantId()).isEqualTo(tenantId);
    }

    @Test
    void shouldReturnEmptyForRevokedPeek() {
        String rawToken = "revoked-peek";
        String tokenHash = tokenHashService.hash(rawToken);

        RefreshTokenEntity entity = validToken(UUID.randomUUID(), tokenHash, UUID.randomUUID());
        entity.setRevokedAt(OffsetDateTime.now());
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(entity));

        assertThat(service.peekUser(rawToken)).isEmpty();
    }

    @Test
    void shouldReturnEmptyForNullOrBlankToken() {
        assertThat(service.peekUser(null)).isEmpty();
        assertThat(service.peekUser("")).isEmpty();
        assertThat(service.peekUser("   ")).isEmpty();
    }

    @Test
    void shouldRevokeFamilyByRawToken() {
        String rawToken = "family-token";
        String tokenHash = tokenHashService.hash(rawToken);
        UUID familyId = UUID.randomUUID();

        RefreshTokenEntity entity = validToken(UUID.randomUUID(), tokenHash, familyId);
        RefreshTokenEntity sibling = validToken(UUID.randomUUID(), "sibling-hash", familyId);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(entity));
        when(refreshTokenRepository.findByFamilyId(familyId)).thenReturn(List.of(entity, sibling));

        var result = service.revokeFamilyByRawToken(rawToken);

        assertThat(result.found()).isTrue();
        assertThat(result.familyId()).isEqualTo(familyId);
        assertThat(sibling.getRevokedAt()).isNotNull();
    }

    @Test
    void shouldHandleRevokeFamilyByNullToken() {
        var result = service.revokeFamilyByRawToken(null);
        assertThat(result.found()).isFalse();

        result = service.revokeFamilyByRawToken("");
        assertThat(result.found()).isFalse();
    }

    private RefreshTokenEntity validToken(UUID id, String tokenHash, UUID familyId) {
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setId(id);
        entity.setUserId(userId);
        entity.setTenantId(tenantId);
        entity.setTokenHash(tokenHash);
        entity.setFamilyId(familyId);
        entity.setExpiresAt(OffsetDateTime.now().plusHours(24));
        entity.setCreatedAt(OffsetDateTime.now());
        return entity;
    }
}
