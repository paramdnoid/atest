package com.zunftgewerk.api.modules.plan.service;

import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PlanService {

    private final SubscriptionRepository subscriptionRepository;

    public PlanService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public List<PlanCatalog.PlanDefinition> listPlans() {
        return PlanCatalog.plans();
    }

    public void changePlan(UUID tenantId, String planId, String billingCycle) {
        SubscriptionEntity subscription = subscriptionRepository.findByTenantId(tenantId)
            .orElseGet(() -> {
                SubscriptionEntity entity = new SubscriptionEntity();
                entity.setId(UUID.randomUUID());
                entity.setTenantId(tenantId);
                entity.setStatus("INACTIVE");
                entity.setCreatedAt(OffsetDateTime.now());
                return entity;
            });

        subscription.setPlanId(planId);
        subscription.setBillingCycle(billingCycle);
        subscription.setUpdatedAt(OffsetDateTime.now());
        subscriptionRepository.save(subscription);
    }

    public long previewInvoiceAmount(String planId) {
        return PlanCatalog.plans().stream()
            .filter(plan -> plan.planId().equals(planId))
            .findFirst()
            .map(PlanCatalog.PlanDefinition::amountCents)
            .orElse(0L);
    }
}
