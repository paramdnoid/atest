package com.zunftgewerk.api.modules.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.billing.repository.StripeWebhookEventRepository;
import com.zunftgewerk.api.modules.billing.service.StripeBillingService;
import com.zunftgewerk.api.modules.license.repository.EntitlementRepository;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.mock;

class StripeBillingServiceTest {

    private StripeBillingService stripeBillingService;

    @BeforeEach
    void setup() {
        stripeBillingService = new StripeBillingService(
            mock(StripeWebhookEventRepository.class),
            mock(BillingAuditLogRepository.class),
            mock(SubscriptionRepository.class),
            mock(EntitlementRepository.class),
            new ObjectMapper()
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
}
