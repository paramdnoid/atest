package com.zunftgewerk.api.shared.events;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record DomainMutationEventPayload(
    String domain,
    String operation,
    UUID tenantId,
    UUID actorUserId,
    UUID entityId,
    OffsetDateTime occurredAt,
    Map<String, String> metadata
) {}
