package com.zunftgewerk.api.modules.plan;

import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlanCatalogTest {

    @Test
    void shouldContainExpectedPlans() {
        assertThat(PlanCatalog.plans())
            .extracting(PlanCatalog.PlanDefinition::planId)
            .containsExactly("starter", "professional");
    }

    @Test
    void shouldHaveCorrectSeatLimits() {
        assertThat(PlanCatalog.plans())
            .allSatisfy(plan -> assertThat(plan.includedSeats()).isGreaterThan(0));
    }

    @Test
    void shouldHavePaidPlansWithPositiveCost() {
        assertThat(PlanCatalog.plans())
            .allSatisfy(plan -> assertThat(plan.amountCents()).isPositive());
    }

    @Test
    void shouldEnableTrialForAllPlans() {
        assertThat(PlanCatalog.plans())
            .allSatisfy(plan -> assertThat(plan.trialDays()).isPositive());
    }
}
