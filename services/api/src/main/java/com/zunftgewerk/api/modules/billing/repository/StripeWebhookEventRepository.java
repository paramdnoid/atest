package com.zunftgewerk.api.modules.billing.repository;

import com.zunftgewerk.api.modules.billing.entity.StripeWebhookEventEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEventEntity, Long> {
    Optional<StripeWebhookEventEntity> findByEventId(String eventId);

    Optional<StripeWebhookEventEntity> findByEventIdAndStatus(String eventId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT event
        FROM StripeWebhookEventEntity event
        WHERE event.status = :status
          AND event.nextRetryAt <= :dueAt
        ORDER BY event.nextRetryAt ASC
        """)
    List<StripeWebhookEventEntity> findDueByStatusAndNextRetryAtBefore(
        @Param("status") String status,
        @Param("dueAt") OffsetDateTime dueAt,
        Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT event
        FROM StripeWebhookEventEntity event
        WHERE event.status = :status
          AND event.deadLetteredAt <= :dueAt
        ORDER BY event.deadLetteredAt ASC
        """)
    List<StripeWebhookEventEntity> findDueByStatusAndDeadLetteredAtBefore(
        @Param("status") String status,
        @Param("dueAt") OffsetDateTime dueAt,
        Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT event
        FROM StripeWebhookEventEntity event
        WHERE event.status = :status
        ORDER BY event.deadLetteredAt ASC
        """)
    List<StripeWebhookEventEntity> findByStatusOrderByDeadLetteredAtAsc(
        @Param("status") String status,
        Pageable pageable
    );
}
