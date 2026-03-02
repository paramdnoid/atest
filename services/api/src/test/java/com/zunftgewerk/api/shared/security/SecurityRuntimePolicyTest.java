package com.zunftgewerk.api.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityRuntimePolicyTest {

    @Test
    void shouldTreatDefaultEnvironmentAsRelaxed() {
        MockEnvironment environment = new MockEnvironment();

        assertThat(SecurityRuntimePolicy.requiresStrictSecrets(environment)).isFalse();
    }

    @Test
    void shouldRequireStrictSecretsWhenEnvironmentIsProduction() {
        MockEnvironment environment = new MockEnvironment()
            .withProperty("ENVIRONMENT", "production");

        assertThat(SecurityRuntimePolicy.requiresStrictSecrets(environment)).isTrue();
    }

    @Test
    void shouldRequireStrictSecretsWhenEnvironmentIsUnknown() {
        MockEnvironment environment = new MockEnvironment()
            .withProperty("ENVIRONMENT", "qa");

        assertThat(SecurityRuntimePolicy.requiresStrictSecrets(environment)).isTrue();
    }

    @Test
    void shouldTreatLocalProfileAsRelaxed() {
        MockEnvironment environment = new MockEnvironment()
            .withProperty("ENVIRONMENT", "local");
        environment.setActiveProfiles("local");

        assertThat(SecurityRuntimePolicy.requiresStrictSecrets(environment)).isFalse();
    }

    @Test
    void shouldRequireStrictSecretsWhenProdProfileIsActive() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        assertThat(SecurityRuntimePolicy.requiresStrictSecrets(environment)).isTrue();
    }
}
