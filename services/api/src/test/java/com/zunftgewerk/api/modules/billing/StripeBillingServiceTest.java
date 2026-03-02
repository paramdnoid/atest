package com.zunftgewerk.api.modules.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.billing.repository.StripeWebhookEventRepository;
import com.zunftgewerk.api.modules.billing.service.StripeBillingService;
import com.zunftgewerk.api.modules.license.repository.EntitlementRepository;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StripeBillingServiceTest {

    private StripeBillingService stripeBillingService;
    private StripeWebhookEventRepository webhookEventRepository;

    @BeforeEach
    void setup() {
        webhookEventRepository = mock(StripeWebhookEventRepository.class);
        stripeBillingService = new StripeBillingService(
            webhookEventRepository,
            mock(BillingAuditLogRepository.class),
            mock(SubscriptionRepository.class),
            mock(EntitlementRepository.class),
            new ObjectMapper(),
            new SimpleMeterRegistry()
        );

        ReflectionTestUtils.setField(stripeBillingService, "retryBaseDelaySeconds", 30L);
        ReflectionTestUtils.setField(stripeBillingService, "retryMaxDelaySeconds", 3600L);
        ReflectionTestUtils.setField(stripeBillingService, "retryMaxAttempts", 5);
    }

    @Test
    void shouldReplayStoredPayloadWithoutSignatureVerification() {
        String payload = "{\"id\":\"evt_123\",\"type\":\"noop.event\",\"data\":{\"object\":{}}}";
        assertThatNoException().isThrownBy(() -> stripeBillingService.replayWebhookPayload(payload));
    }

    @Test
    void shouldClassifyIllegalArgumentAsNonRetryable() {
        assertThat(stripeBillingService.isRetryableFailure(new IllegalArgumentException("invalid payload"))).isFalse();
        assertThat(stripeBillingService.isRetryableFailure(new IllegalStateException("temporary"))).isTrue();
    }

    @Test
    void shouldMarkNonRetryableFailuresAsDeadLetter() {
        StripeWebhookEventEntity event = new StripeWebhookEventEntity();
        event.setStatus("FAILED");
        event.setRetryCount(0);

        stripeBillingService.markFailure(event, new IllegalArgumentException("invalid"), OffsetDateTime.now());

        assertThat(event.getStatus()).isEqualTo("DEAD_LETTER");
        assertThat(event.getDeadLetteredAt()).isNotNull();
        assertThat(event.getNextRetryAt()).isNull();
    }

    @Test
    void shouldPersistWebhookAsReceivedWithoutImmediateProcessing() {
        when(webhookEventRepository.findByEventId("evt_ingest")).thenReturn(Optional.empty());

        String payload = "{\"id\":\"evt_ingest\",\"type\":\"invoice.paid\",\"data\":{\"object\":{}}}";
        stripeBillingService.processWebhook(payload, "");

        ArgumentCaptor<StripeWebhookEventEntity> captor = ArgumentCaptor.forClass(StripeWebhookEventEntity.class);
        verify(webhookEventRepository).save(captor.capture());
        StripeWebhookEventEntity persisted = captor.getValue();
        assertThat(persisted.getStatus()).isEqualTo("RECEIVED");
        assertThat(persisted.getProcessedAt()).isNull();
        assertThat(persisted.getNextRetryAt()).isNull();
    }

    @Test
    void shouldIgnoreDuplicateWebhookEvents() {
        StripeWebhookEventEntity existing = new StripeWebhookEventEntity();
        existing.setEventId("evt_dup");
        existing.setStatus("PROCESSED");
        when(webhookEventRepository.findByEventId("evt_dup")).thenReturn(Optional.of(existing));

        String payload = "{\"id\":\"evt_dup\",\"type\":\"invoice.paid\",\"data\":{\"object\":{}}}";
        stripeBillingService.processWebhook(payload, "");

        verify(webhookEventRepository).findByEventId("evt_dup");
    }
}
