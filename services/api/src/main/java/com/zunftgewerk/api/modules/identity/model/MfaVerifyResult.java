package com.zunftgewerk.api.modules.identity.model;

import java.time.OffsetDateTime;

public record MfaVerifyResult(boolean verified, String accessToken, String refreshToken, OffsetDateTime accessTokenExpiresAt) {
}
