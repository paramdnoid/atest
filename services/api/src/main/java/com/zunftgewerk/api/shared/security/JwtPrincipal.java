package com.zunftgewerk.api.shared.security;

import java.util.List;
import java.util.UUID;

public record JwtPrincipal(
    UUID userId,
    UUID tenantId,
    List<String> roles,
    boolean mfa,
    List<String> amr
) {
}
