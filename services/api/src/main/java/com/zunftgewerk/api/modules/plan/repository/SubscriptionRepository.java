package com.zunftgewerk.api.modules.plan.repository;

import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, UUID> {
    Optional<SubscriptionEntity> findByTenantId(UUID tenantId);
    Optional<SubscriptionEntity> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<SubscriptionEntity> findByStripeCustomerId(String stripeCustomerId);
}
