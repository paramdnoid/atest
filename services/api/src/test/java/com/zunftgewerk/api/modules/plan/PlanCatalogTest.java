package com.zunftgewerk.api.modules.plan;

import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlanCatalogTest {

    @Test
    void shouldContainStarterBusinessAndEnterprisePlans() {
        assertThat(PlanCatalog.plans())
            .extracting(PlanCatalog.PlanDefinition::planId)
            .containsExactly("starter", "business", "enterprise");
    }
}
