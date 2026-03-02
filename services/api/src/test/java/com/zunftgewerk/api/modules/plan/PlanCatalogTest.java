package com.zunftgewerk.api.modules.plan;

import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlanCatalogTest {

    @Test
    void shouldContainExpectedPlans() {
        assertThat(PlanCatalog.plans())
            .extracting(PlanCatalog.PlanDefinition::planId)
            .containsExactly("free", "starter", "professional");
    }

    @Test
    void shouldHaveCorrectSeatLimits() {
        assertThat(PlanCatalog.plans())
            .allSatisfy(plan -> assertThat(plan.includedSeats()).isGreaterThan(0));
    }

    @Test
    void shouldHaveFreeplanWithZeroCost() {
        PlanCatalog.PlanDefinition freePlan = PlanCatalog.plans().stream()
            .filter(p -> "free".equals(p.planId()))
            .findFirst()
            .orElseThrow();
        assertThat(freePlan.amountCents()).isZero();
    }

    @Test
    void shouldHavePaidPlansWithPositiveCost() {
        assertThat(PlanCatalog.plans().stream()
            .filter(p -> !"free".equals(p.planId())))
            .allSatisfy(plan -> assertThat(plan.amountCents()).isPositive());
    }
}
