package com.zunftgewerk.api.modules.plan.service;

import java.util.List;

public final class PlanCatalog {

    private PlanCatalog() {
    }

    public static List<PlanDefinition> plans() {
        return List.of(
            new PlanDefinition("starter", "Starter", 5, "monthly", 4900),
            new PlanDefinition("business", "Business", 25, "monthly", 19900),
            new PlanDefinition("enterprise", "Enterprise", 9999, "yearly", 0)
        );
    }

    public record PlanDefinition(String planId, String displayName, int includedSeats, String billingCycle, long amountCents) {
    }
}
