package com.zunftgewerk.api.modules.identity.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record LoginResult(
    boolean mfaRequired,
    String accessToken,
    String refreshToken,
    String mfaToken,
    UUID userId,
    UUID tenantId,
    List<String> roles,
    OffsetDateTime accessTokenExpiresAt
) {
}
