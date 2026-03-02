package com.zunftgewerk.api.modules.billing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "stripe_webhook_events")
public class StripeWebhookEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "received_at", nullable = false)
    private OffsetDateTime receivedAt;

    @Column(name = "processed_at")
    private OffsetDateTime processedAt;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "payload", nullable = false)
    private String payload;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "next_retry_at")
    private OffsetDateTime nextRetryAt;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "last_failed_at")
    private OffsetDateTime lastFailedAt;

    @Column(name = "dead_lettered_at")
    private OffsetDateTime deadLetteredAt;

    @Column(name = "recovery_attempts", nullable = false)
    private int recoveryAttempts;

    public Long getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public OffsetDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(OffsetDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public OffsetDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(OffsetDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public OffsetDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(OffsetDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public OffsetDateTime getLastFailedAt() {
        return lastFailedAt;
    }

    public void setLastFailedAt(OffsetDateTime lastFailedAt) {
        this.lastFailedAt = lastFailedAt;
    }

    public OffsetDateTime getDeadLetteredAt() {
        return deadLetteredAt;
    }

    public void setDeadLetteredAt(OffsetDateTime deadLetteredAt) {
        this.deadLetteredAt = deadLetteredAt;
    }

    public int getRecoveryAttempts() {
        return recoveryAttempts;
    }

    public void setRecoveryAttempts(int recoveryAttempts) {
        this.recoveryAttempts = recoveryAttempts;
    }
}
