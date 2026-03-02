package com.zunftgewerk.api.modules.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.billing.repository.StripeWebhookEventRepository;
import com.zunftgewerk.api.modules.billing.service.StripeBillingService;
import com.zunftgewerk.api.modules.billing.service.StripeWebhookRetryWorker;
import com.zunftgewerk.api.modules.license.repository.EntitlementRepository;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StripeWebhookRetryWorkerTest {

    private StripeWebhookEventRepository webhookEventRepository;
    private StripeBillingService stripeBillingService;
    private StripeWebhookRetryWorker retryWorker;

    @BeforeEach
    void setup() {
        webhookEventRepository = mock(StripeWebhookEventRepository.class);
        BillingAuditLogRepository billingAuditLogRepository = mock(BillingAuditLogRepository.class);
        SubscriptionRepository subscriptionRepository = mock(SubscriptionRepository.class);
        EntitlementRepository entitlementRepository = mock(EntitlementRepository.class);

        StripeBillingService realBillingService = new StripeBillingService(
            webhookEventRepository,
            billingAuditLogRepository,
            subscriptionRepository,
            entitlementRepository,
            new ObjectMapper()
        );
        stripeBillingService = spy(realBillingService);

        ReflectionTestUtils.setField(stripeBillingService, "retryBaseDelaySeconds", 30L);
        ReflectionTestUtils.setField(stripeBillingService, "retryMaxDelaySeconds", 3600L);
        ReflectionTestUtils.setField(stripeBillingService, "retryMaxAttempts", 5);

        retryWorker = new StripeWebhookRetryWorker(webhookEventRepository, stripeBillingService);
        ReflectionTestUtils.setField(retryWorker, "workerEnabled", true);
        ReflectionTestUtils.setField(retryWorker, "retryBatchSize", 50);
        ReflectionTestUtils.setField(retryWorker, "retryMaxAttempts", 5);
        ReflectionTestUtils.setField(retryWorker, "deadLetterRecoveryEnabled", true);
        ReflectionTestUtils.setField(retryWorker, "deadLetterCooldownSeconds", 3600L);
        ReflectionTestUtils.setField(retryWorker, "deadLetterMaxRecoveryAttempts", 3);
    }

    @Test
    void shouldMarkFailedEventAsProcessedWhenReplaySucceeds() {
        StripeWebhookEventEntity event = dueFailedEvent("evt_success", 1);
        when(webhookEventRepository.findDueByStatusAndNextRetryAtBefore(any(), any(), any())).thenReturn(List.of(event));

        retryWorker.retryFailedEvents();

        assertThat(event.getStatus()).isEqualTo("PROCESSED");
        assertThat(event.getProcessedAt()).isNotNull();
        assertThat(event.getNextRetryAt()).isNull();
        verify(webhookEventRepository).save(event);
    }

    @Test
    void shouldDeadLetterEventAfterMaxAttempts() {
        StripeWebhookEventEntity event = dueFailedEvent("evt_dead", 4);
        when(webhookEventRepository.findDueByStatusAndNextRetryAtBefore(any(), any(), any())).thenReturn(List.of(event));
        doThrow(new IllegalStateException("downstream failed")).when(stripeBillingService).replayWebhookPayload(any());

        retryWorker.retryFailedEvents();

        assertThat(event.getStatus()).isEqualTo("DEAD_LETTER");
        assertThat(event.getDeadLetteredAt()).isNotNull();
        assertThat(event.getNextRetryAt()).isNull();
        assertThat(event.getRetryCount()).isEqualTo(5);
    }

    @Test
    void shouldRequeueDueDeadLettersDuringAutoRecovery() {
        StripeWebhookEventEntity event = new StripeWebhookEventEntity();
        event.setEventId("evt_recover");
        event.setStatus("DEAD_LETTER");
        event.setPayload("{}");
        event.setRecoveryAttempts(0);
        event.setDeadLetteredAt(OffsetDateTime.now().minusHours(2));
        when(webhookEventRepository.findDueByStatusAndDeadLetteredAtBefore(any(), any(), any())).thenReturn(List.of(event));

        retryWorker.recoverDeadLettersAutomatically();

        assertThat(event.getStatus()).isEqualTo("FAILED");
        assertThat(event.getNextRetryAt()).isNotNull();
        assertThat(event.getRecoveryAttempts()).isEqualTo(1);
        verify(webhookEventRepository).save(event);
    }

    private StripeWebhookEventEntity dueFailedEvent(String eventId, int retryCount) {
        StripeWebhookEventEntity event = new StripeWebhookEventEntity();
        event.setEventId(eventId);
        event.setStatus("FAILED");
        event.setRetryCount(retryCount);
        event.setPayload("{\"id\":\"" + eventId + "\",\"type\":\"noop.event\",\"data\":{\"object\":{}}}");
        event.setNextRetryAt(OffsetDateTime.now().minusMinutes(1));
        event.setReceivedAt(OffsetDateTime.now().minusMinutes(2));
        return event;
    }
}
