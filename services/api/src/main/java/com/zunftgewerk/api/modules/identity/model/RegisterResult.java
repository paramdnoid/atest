package com.zunftgewerk.api.modules.identity.model;

import java.util.UUID;

public record RegisterResult(UUID userId, UUID tenantId) {
}
