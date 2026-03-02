package com.zunftgewerk.api.modules.billing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.SubscriptionItemUpdateParams;
import com.zunftgewerk.api.modules.billing.entity.BillingAuditLogEntity;
import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.billing.repository.StripeWebhookEventRepository;
import com.zunftgewerk.api.modules.license.entity.EntitlementEntity;
import com.zunftgewerk.api.modules.license.repository.EntitlementRepository;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class StripeBillingService {

    private final StripeWebhookEventRepository webhookEventRepository;
    private final BillingAuditLogRepository billingAuditLogRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EntitlementRepository entitlementRepository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;

    @Value("${zunftgewerk.stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${zunftgewerk.stripe.retries.base-delay-seconds:30}")
    private long retryBaseDelaySeconds;

    @Value("${zunftgewerk.stripe.retries.max-attempts:5}")
    private int retryMaxAttempts;

    @Value("${zunftgewerk.stripe.retries.max-delay-seconds:3600}")
    private long retryMaxDelaySeconds;

    public StripeBillingService(
        StripeWebhookEventRepository webhookEventRepository,
        BillingAuditLogRepository billingAuditLogRepository,
        SubscriptionRepository subscriptionRepository,
        EntitlementRepository entitlementRepository,
        ObjectMapper objectMapper,
        MeterRegistry meterRegistry
    ) {
        this.webhookEventRepository = webhookEventRepository;
        this.billingAuditLogRepository = billingAuditLogRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.entitlementRepository = entitlementRepository;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        Gauge.builder("stripe_webhook_dead_letter_events", webhookEventRepository, repo -> repo.countByStatus("DEAD_LETTER"))
            .description("Number of Stripe webhook events currently in dead-letter state")
            .register(meterRegistry);
    }

    @Transactional
    public void processWebhook(String payload, String signatureHeader) {
        Event event = processEventPayload(payload, signatureHeader, false, true);

        if (webhookEventRepository.findByEventId(event.getId()).isPresent()) {
            meterRegistry.counter("stripe_webhook_ingested_total", "result", "duplicate").increment();
            return;
        }

        StripeWebhookEventEntity webhookEvent = new StripeWebhookEventEntity();
        webhookEvent.setEventId(event.getId());
        webhookEvent.setEventType(event.getType());
        webhookEvent.setReceivedAt(OffsetDateTime.now());
        webhookEvent.setStatus("RECEIVED");
        webhookEvent.setPayload(payload);
        webhookEvent.setRetryCount(0);
        webhookEvent.setNextRetryAt(null);
        webhookEventRepository.save(webhookEvent);
        meterRegistry.counter("stripe_webhook_ingested_total", "result", "accepted", "event_type", event.getType()).increment();
    }

    @Transactional
    public void processQueuedWebhookEvent(StripeWebhookEventEntity webhookEvent) {
        long startedNanos = System.nanoTime();
        try {
            replayWebhookPayload(webhookEvent.getPayload());
            markProcessed(webhookEvent, OffsetDateTime.now());
            meterRegistry.counter(
                "stripe_webhook_processed_total",
                "status",
                "processed",
                "event_type",
                normalizeEventType(webhookEvent.getEventType())
            ).increment();
        } catch (RuntimeException ex) {
            markFailure(webhookEvent, ex, OffsetDateTime.now());
            meterRegistry.counter(
                "stripe_webhook_processed_total",
                "status",
                "failed",
                "event_type",
                normalizeEventType(webhookEvent.getEventType())
            ).increment();
            if ("DEAD_LETTER".equalsIgnoreCase(webhookEvent.getStatus())) {
                meterRegistry.counter(
                    "stripe_webhook_processed_total",
                    "status",
                    "dead_letter",
                    "event_type",
                    normalizeEventType(webhookEvent.getEventType())
                ).increment();
            }
        } finally {
            webhookEventRepository.save(webhookEvent);
            Timer.builder("stripe_webhook_processing_latency")
                .tag("event_type", normalizeEventType(webhookEvent.getEventType()))
                .register(meterRegistry)
                .record(System.nanoTime() - startedNanos, TimeUnit.NANOSECONDS);
        }
    }

    public void replayWebhookPayload(String payload) {
        Event event = processEventPayload(payload, "", true, false);
        handleEvent(event);
    }

    public boolean isRetryableFailure(Throwable throwable) {
        return !(throwable instanceof IllegalArgumentException);
    }

    public OffsetDateTime computeNextRetryAt(OffsetDateTime now, int retryCount) {
        long exponent = Math.max(0, retryCount - 1);
        long multiplier = exponent >= 30 ? (1L << 30) : (1L << exponent);
        long delaySeconds = retryBaseDelaySeconds * multiplier;
        return now.plusSeconds(Math.min(delaySeconds, retryMaxDelaySeconds));
    }

    public void markFailure(StripeWebhookEventEntity webhookEvent, Throwable throwable, OffsetDateTime now) {
        webhookEvent.setRetryCount(webhookEvent.getRetryCount() + 1);
        webhookEvent.setLastFailedAt(now);
        webhookEvent.setLastError(toCompactError(throwable));

        if (!isRetryableFailure(throwable) || webhookEvent.getRetryCount() >= retryMaxAttempts) {
            webhookEvent.setStatus("DEAD_LETTER");
            webhookEvent.setDeadLetteredAt(now);
            webhookEvent.setNextRetryAt(null);
            return;
        }

        webhookEvent.setStatus("FAILED");
        webhookEvent.setNextRetryAt(computeNextRetryAt(now, webhookEvent.getRetryCount()));
    }

    public void markProcessed(StripeWebhookEventEntity webhookEvent, OffsetDateTime now) {
        webhookEvent.setStatus("PROCESSED");
        webhookEvent.setProcessedAt(now);
        webhookEvent.setNextRetryAt(null);
        webhookEvent.setLastError(null);
        webhookEvent.setLastFailedAt(null);
        webhookEvent.setDeadLetteredAt(null);
    }

    @Transactional
    public void syncSeatQuantity(UUID tenantId, long activeSeats) {
        Optional<SubscriptionEntity> optionalSubscription = subscriptionRepository.findByTenantId(tenantId);
        if (optionalSubscription.isEmpty()) {
            return;
        }

        SubscriptionEntity subscription = optionalSubscription.get();
        if (subscription.getStripeSubscriptionItemId() == null || subscription.getStripeSubscriptionItemId().isBlank()) {
            return;
        }

        try {
            SubscriptionItemUpdateParams params = SubscriptionItemUpdateParams.builder()
                .setQuantity(activeSeats)
                .build();
            SubscriptionItem stripeItem = SubscriptionItem.retrieve(subscription.getStripeSubscriptionItemId());
            stripeItem.update(params);

            subscription.setUpdatedAt(OffsetDateTime.now());
            subscriptionRepository.save(subscription);
            recordBillingAudit(tenantId, "SEAT_QUANTITY_SYNC", Map.of("activeSeats", activeSeats));
        } catch (StripeException ex) {
            meterRegistry.counter("stripe_webhook_seat_sync_failures_total").increment();
            throw new IllegalStateException("Failed to sync seat quantity", ex);
        }
    }

    private Event processEventPayload(String payload, String signatureHeader, boolean isReplay, boolean verifySignature) {
        if (isReplay) {
            try {
                Event replayEvent = Event.GSON.fromJson(payload, Event.class);
                if (replayEvent == null || replayEvent.getId() == null || replayEvent.getType() == null) {
                    throw new IllegalArgumentException("Stored webhook payload is invalid");
                }
                return replayEvent;
            } catch (RuntimeException ex) {
                throw new IllegalArgumentException("Stored webhook payload is invalid", ex);
            }
        }

        if (verifySignature && webhookSecret != null && !webhookSecret.isBlank()) {
            try {
                return Webhook.constructEvent(payload, signatureHeader, webhookSecret);
            } catch (SignatureVerificationException ex) {
                meterRegistry.counter("stripe_webhook_verify_failures_total").increment();
                throw new IllegalArgumentException("Stripe signature verification failed", ex);
            }
        }

        try {
            Event event = Event.GSON.fromJson(payload, Event.class);
            if (event == null || event.getId() == null || event.getType() == null) {
                throw new IllegalArgumentException("Webhook payload is invalid");
            }
            return event;
        } catch (RuntimeException ex) {
            if (verifySignature) {
                meterRegistry.counter("stripe_webhook_verify_failures_total").increment();
            }
            throw new IllegalArgumentException("Webhook payload is invalid", ex);
        }
    }

    private String toCompactError(Throwable throwable) {
        if (throwable == null) {
            return "unknown";
        }

        String message = throwable.getMessage() == null ? "" : ": " + throwable.getMessage();
        String compact = throwable.getClass().getSimpleName() + message;
        return compact.length() <= 1000 ? compact : compact.substring(0, 1000);
    }

    private void handleEvent(Event event) {
        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutSessionCompleted(event);
            case "customer.subscription.created", "customer.subscription.updated" -> handleSubscriptionUpsert(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.paid" -> handleInvoicePaid(event);
            case "invoice.payment_failed" -> handleInvoicePaymentFailed(event);
            default -> {
                // Ignore unsupported events for now.
            }
        }
    }

    private void handleCheckoutSessionCompleted(Event event) {
        Session session = deserialize(event, Session.class);
        if (session == null || session.getClientReferenceId() == null) {
            return;
        }

        UUID tenantId = UUID.fromString(session.getClientReferenceId());
        SubscriptionEntity subscription = subscriptionRepository.findByTenantId(tenantId).orElseGet(() -> {
            SubscriptionEntity s = new SubscriptionEntity();
            s.setId(UUID.randomUUID());
            s.setTenantId(tenantId);
            s.setPlanId("unknown");
            s.setBillingCycle("monthly");
            s.setStatus("INACTIVE");
            s.setCreatedAt(OffsetDateTime.now());
            return s;
        });

        subscription.setStripeCustomerId(session.getCustomer());
        subscription.setStripeSubscriptionId(session.getSubscription());
        subscription.setStatus("ACTIVE");
        subscription.setUpdatedAt(OffsetDateTime.now());
        subscriptionRepository.save(subscription);

        recordBillingAudit(tenantId, "CHECKOUT_COMPLETED", Map.of("sessionId", session.getId()));
    }

    private void handleSubscriptionUpsert(Event event) {
        Subscription stripeSubscription = deserialize(event, Subscription.class);
        if (stripeSubscription == null) {
            return;
        }

        SubscriptionEntity subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.getId())
            .or(() -> subscriptionRepository.findByStripeCustomerId(stripeSubscription.getCustomer()))
            .orElse(null);

        if (subscription == null) {
            return;
        }

        subscription.setStripeCustomerId(stripeSubscription.getCustomer());
        subscription.setStatus(stripeSubscription.getStatus().toUpperCase());
        Long currentPeriodEndEpoch = extractCurrentPeriodEndEpoch(stripeSubscription);
        if (currentPeriodEndEpoch != null) {
            subscription.setCurrentPeriodEnd(OffsetDateTime.ofInstant(
                java.time.Instant.ofEpochSecond(currentPeriodEndEpoch),
                ZoneOffset.UTC
            ));
        }

        if (stripeSubscription.getItems() != null
            && stripeSubscription.getItems().getData() != null
            && !stripeSubscription.getItems().getData().isEmpty()) {
            subscription.setStripeSubscriptionItemId(stripeSubscription.getItems().getData().get(0).getId());
        }

        subscription.setUpdatedAt(OffsetDateTime.now());
        subscriptionRepository.save(subscription);

        recordBillingAudit(subscription.getTenantId(), "SUBSCRIPTION_UPSERT", Map.of("status", subscription.getStatus()));
    }

    private void handleSubscriptionDeleted(Event event) {
        Subscription stripeSubscription = deserialize(event, Subscription.class);
        if (stripeSubscription == null) {
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.getId()).ifPresent(subscription -> {
            subscription.setStatus("CANCELED");
            subscription.setGraceUntil(OffsetDateTime.now());
            subscription.setUpdatedAt(OffsetDateTime.now());
            subscriptionRepository.save(subscription);

            upsertBillingEntitlement(subscription.getTenantId(), false);
            recordBillingAudit(subscription.getTenantId(), "SUBSCRIPTION_DELETED", Map.of("subscriptionId", stripeSubscription.getId()));
        });
    }

    private void handleInvoicePaid(Event event) {
        Invoice invoice = deserialize(event, Invoice.class);
        String subscriptionId = extractSubscriptionId(invoice);
        if (subscriptionId == null) {
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(subscription -> {
            subscription.setStatus("ACTIVE");
            subscription.setGraceUntil(null);
            subscription.setUpdatedAt(OffsetDateTime.now());
            subscriptionRepository.save(subscription);

            upsertBillingEntitlement(subscription.getTenantId(), true);
            recordBillingAudit(subscription.getTenantId(), "INVOICE_PAID", Map.of("invoiceId", invoice.getId()));
        });
    }

    private void handleInvoicePaymentFailed(Event event) {
        Invoice invoice = deserialize(event, Invoice.class);
        String subscriptionId = extractSubscriptionId(invoice);
        if (subscriptionId == null) {
            return;
        }

        subscriptionRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(subscription -> {
            subscription.setStatus("PAST_DUE");
            subscription.setGraceUntil(OffsetDateTime.now().plusDays(7));
            subscription.setUpdatedAt(OffsetDateTime.now());
            subscriptionRepository.save(subscription);

            upsertBillingEntitlement(subscription.getTenantId(), true);
            recordBillingAudit(subscription.getTenantId(), "INVOICE_PAYMENT_FAILED", Map.of("invoiceId", invoice.getId()));
        });
    }

    private <T> T deserialize(Event event, Class<T> clazz) {
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        return dataObjectDeserializer.getObject()
            .filter(clazz::isInstance)
            .map(clazz::cast)
            .orElse(null);
    }

    private Long extractCurrentPeriodEndEpoch(Subscription stripeSubscription) {
        if (stripeSubscription == null
            || stripeSubscription.getItems() == null
            || stripeSubscription.getItems().getData() == null
            || stripeSubscription.getItems().getData().isEmpty()) {
            return null;
        }

        SubscriptionItem firstItem = stripeSubscription.getItems().getData().get(0);
        return firstItem.getCurrentPeriodEnd();
    }

    private String extractSubscriptionId(Invoice invoice) {
        if (invoice == null
            || invoice.getParent() == null
            || invoice.getParent().getSubscriptionDetails() == null) {
            return null;
        }

        return invoice.getParent().getSubscriptionDetails().getSubscription();
    }

    private void upsertBillingEntitlement(UUID tenantId, boolean enabled) {
        EntitlementEntity entitlement = entitlementRepository.findByTenantId(tenantId).stream()
            .filter(e -> "billing.active".equals(e.getEntitlementKey()))
            .findFirst()
            .orElseGet(() -> {
                EntitlementEntity entity = new EntitlementEntity();
                entity.setId(UUID.randomUUID());
                entity.setTenantId(tenantId);
                entity.setEntitlementKey("billing.active");
                return entity;
            });

        entitlement.setEnabled(enabled);
        entitlementRepository.save(entitlement);
    }

    private void recordBillingAudit(UUID tenantId, String eventType, Map<String, Object> details) {
        try {
            BillingAuditLogEntity log = new BillingAuditLogEntity();
            log.setTenantId(tenantId);
            log.setEventType(eventType);
            log.setDetailsJson(objectMapper.writeValueAsString(new HashMap<>(details)));
            log.setCreatedAt(OffsetDateTime.now());
            billingAuditLogRepository.save(log);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to persist billing audit", ex);
        }
    }

    private String normalizeEventType(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return "unknown";
        }
        return eventType;
    }
}
