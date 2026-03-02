package com.zunftgewerk.api.modules.identity.model;

import java.time.OffsetDateTime;

public record RefreshResult(String accessToken, String refreshToken, OffsetDateTime accessTokenExpiresAt) {
}
