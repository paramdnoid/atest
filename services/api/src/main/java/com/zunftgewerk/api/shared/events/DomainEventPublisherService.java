package com.zunftgewerk.api.shared.events;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class DomainEventPublisherService {

    private final ApplicationEventPublisher applicationEventPublisher;

    public DomainEventPublisherService(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    public void publishMutation(
        String domain,
        String operation,
        UUID tenantId,
        UUID actorUserId,
        UUID entityId,
        Map<String, String> metadata
    ) {
        Map<String, String> safeMetadata = metadata == null ? new HashMap<>() : new HashMap<>(metadata);
        applicationEventPublisher.publishEvent(
            new DomainMutationEventPayload(
                domain,
                operation,
                tenantId,
                actorUserId,
                entityId,
                OffsetDateTime.now(),
                safeMetadata
            )
        );
    }
}
