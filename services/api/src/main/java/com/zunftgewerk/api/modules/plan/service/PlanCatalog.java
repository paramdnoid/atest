package com.zunftgewerk.api.modules.plan.service;

import java.util.List;

public final class PlanCatalog {

    private PlanCatalog() {
    }

    public static List<PlanDefinition> plans() {
        return List.of(
            new PlanDefinition("free", "Free", 5, "monthly", 0),
            new PlanDefinition("starter", "Starter", 5, "monthly", 19900),
            new PlanDefinition("professional", "Professional", 10, "monthly", 39900)
        );
    }

    public record PlanDefinition(String planId, String displayName, int includedSeats, String billingCycle, long amountCents) {
    }
}
