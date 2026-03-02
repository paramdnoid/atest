package com.zunftgewerk.api.shared.security;

import org.springframework.core.env.Environment;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

public final class SecurityRuntimePolicy {

    private static final Set<String> RELAXED_ENVIRONMENTS = Set.of("", "local", "test", "ci", "dev", "development");
    private static final Set<String> STRICT_ENVIRONMENTS = Set.of("prod", "production", "stage", "staging");

    private SecurityRuntimePolicy() {
    }

    public static boolean requiresStrictSecrets(Environment environment) {
        String environmentName = normalize(environment.getProperty("ENVIRONMENT", ""));
        if (STRICT_ENVIRONMENTS.contains(environmentName)) {
            return true;
        }
        if (!RELAXED_ENVIRONMENTS.contains(environmentName)) {
            return true;
        }

        return Arrays.stream(environment.getActiveProfiles())
            .map(SecurityRuntimePolicy::normalize)
            .anyMatch(profile -> STRICT_ENVIRONMENTS.contains(profile) || !RELAXED_ENVIRONMENTS.contains(profile));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
