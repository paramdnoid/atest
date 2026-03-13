package com.zunftgewerk.api.shared.events;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DomainMutationEventListener {

    private static final Logger log = LoggerFactory.getLogger(DomainMutationEventListener.class);

    private final MeterRegistry meterRegistry;

    public DomainMutationEventListener(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @EventListener
    public void onDomainMutation(DomainMutationEventPayload payload) {
        if (payload == null) {
            return;
        }

        String domain = normalized(payload.domain(), "unknown");
        String operation = normalized(payload.operation(), "unknown");

        meterRegistry.counter(
            "zg_domain_event_total",
            "domain",
            domain,
            "operation",
            operation
        ).increment();

        log.info(
            "Domain mutation event published: domain={}, operation={}, tenantId={}, entityId={}",
            domain,
            operation,
            payload.tenantId(),
            payload.entityId()
        );
    }

    private String normalized(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase();
    }
}
