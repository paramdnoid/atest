package com.zunftgewerk.api.modules.billing.service;

import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import com.zunftgewerk.api.modules.billing.repository.StripeWebhookEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class StripeWebhookRetryWorker {

    private final StripeWebhookEventRepository webhookEventRepository;
    private final StripeBillingService stripeBillingService;

    @Value("${zunftgewerk.stripe.retries.worker-enabled:true}")
    private boolean workerEnabled;

    @Value("${zunftgewerk.stripe.retries.batch-size:50}")
    private int retryBatchSize;

    @Value("${zunftgewerk.stripe.retries.max-attempts:5}")
    private int retryMaxAttempts;

    @Value("${zunftgewerk.stripe.dead-letter.recovery-enabled:true}")
    private boolean deadLetterRecoveryEnabled;

    @Value("${zunftgewerk.stripe.dead-letter.cooldown-seconds:3600}")
    private long deadLetterCooldownSeconds;

    @Value("${zunftgewerk.stripe.dead-letter.max-recovery-attempts:3}")
    private int deadLetterMaxRecoveryAttempts;

    public StripeWebhookRetryWorker(
        StripeWebhookEventRepository webhookEventRepository,
        StripeBillingService stripeBillingService
    ) {
        this.webhookEventRepository = webhookEventRepository;
        this.stripeBillingService = stripeBillingService;
    }

    @Scheduled(fixedDelayString = "#{${zunftgewerk.stripe.retries.scan-interval-seconds:30} * 1000}")
    @Transactional
    public void retryFailedEvents() {
        if (!workerEnabled) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<StripeWebhookEventEntity> dueEvents = webhookEventRepository.findDueByStatusAndNextRetryAtBefore(
            "FAILED",
            now,
            PageRequest.of(0, retryBatchSize)
        );

        for (StripeWebhookEventEntity event : dueEvents) {
            try {
                stripeBillingService.replayWebhookPayload(event.getPayload());
                stripeBillingService.markProcessed(event, OffsetDateTime.now());
            } catch (RuntimeException ex) {
                stripeBillingService.markFailure(event, ex, OffsetDateTime.now());
                if (event.getRetryCount() >= retryMaxAttempts || "DEAD_LETTER".equals(event.getStatus())) {
                    event.setStatus("DEAD_LETTER");
                    event.setDeadLetteredAt(OffsetDateTime.now());
                    event.setNextRetryAt(null);
                }
            }
            webhookEventRepository.save(event);
        }
    }

    @Scheduled(fixedDelayString = "#{${zunftgewerk.stripe.dead-letter.recovery-interval-seconds:300} * 1000}")
    @Transactional
    public void recoverDeadLettersAutomatically() {
        if (!workerEnabled || !deadLetterRecoveryEnabled) {
            return;
        }

        OffsetDateTime dueAt = OffsetDateTime.now().minusSeconds(deadLetterCooldownSeconds);
        List<StripeWebhookEventEntity> deadLetters = webhookEventRepository.findDueByStatusAndDeadLetteredAtBefore(
            "DEAD_LETTER",
            dueAt,
            PageRequest.of(0, retryBatchSize)
        );

        for (StripeWebhookEventEntity deadLetter : deadLetters) {
            requeueDeadLetter(deadLetter);
            webhookEventRepository.save(deadLetter);
        }
    }

    @Transactional
    public RecoveryResult recoverDeadLettersManually(String eventId, Integer limit) {
        List<String> requeuedEventIds = new ArrayList<>();
        int skippedCount = 0;

        if (eventId != null && !eventId.isBlank()) {
            Optional<StripeWebhookEventEntity> event = webhookEventRepository.findByEventIdAndStatus(eventId, "DEAD_LETTER");
            if (event.isPresent() && requeueDeadLetter(event.get())) {
                webhookEventRepository.save(event.get());
                requeuedEventIds.add(event.get().getEventId());
            } else {
                skippedCount = 1;
            }
            return new RecoveryResult(requeuedEventIds.size(), skippedCount, requeuedEventIds);
        }

        int safeLimit = limit == null ? retryBatchSize : Math.max(1, Math.min(limit, 200));
        List<StripeWebhookEventEntity> deadLetters = webhookEventRepository.findByStatusOrderByDeadLetteredAtAsc(
            "DEAD_LETTER",
            PageRequest.of(0, safeLimit)
        );

        for (StripeWebhookEventEntity deadLetter : deadLetters) {
            if (requeueDeadLetter(deadLetter)) {
                webhookEventRepository.save(deadLetter);
                requeuedEventIds.add(deadLetter.getEventId());
            } else {
                skippedCount++;
            }
        }

        return new RecoveryResult(requeuedEventIds.size(), skippedCount, requeuedEventIds);
    }

    private boolean requeueDeadLetter(StripeWebhookEventEntity event) {
        if (event.getRecoveryAttempts() >= deadLetterMaxRecoveryAttempts) {
            return false;
        }

        OffsetDateTime now = OffsetDateTime.now();
        event.setStatus("FAILED");
        event.setNextRetryAt(now);
        event.setDeadLetteredAt(null);
        event.setRecoveryAttempts(event.getRecoveryAttempts() + 1);
        event.setLastError(null);
        return true;
    }

    public record RecoveryResult(int requeuedCount, int skippedCount, List<String> eventIds) {
    }
}
