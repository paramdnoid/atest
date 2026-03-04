package com.zunftgewerk.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .authorizeHttpRequests(authorize -> authorize
                // Infrastructure
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/.well-known/jwks.json").permitAll()
                // Stripe webhooks (signature-verified internally)
                .requestMatchers("/webhooks/stripe").permitAll()
                .requestMatchers("/internal/billing/stripe-webhooks/dead-letter/recover").permitAll()
                // Auth endpoints (public by design)
                .requestMatchers("/v1/auth/**").permitAll()
                .requestMatchers("/v1/onboarding/status").permitAll()
                // Cookie-authenticated endpoints — each controller validates the session
                // via RefreshTokenService.peekUser() and returns 401/403 on its own.
                // Listed explicitly to prevent accidental exposure of new endpoints.
                .requestMatchers("/v1/workspace/me", "/v1/workspace/me/address").permitAll()
                .requestMatchers("/v1/billing/summary", "/v1/billing/events", "/v1/billing/checkout", "/v1/billing/portal").permitAll()
                .requestMatchers("/v1/devices", "/v1/devices/registration-token", "/v1/devices/registration-token/renew", "/v1/devices/{id}", "/v1/devices/{id}/license").permitAll()
                .requestMatchers("/v1/team/members", "/v1/team/invite", "/v1/team/invites/accept").permitAll()
                .requestMatchers("/v1/admin/audit-export", "/v1/admin/flags").permitAll()
                .requestMatchers("/v1/account").permitAll()
                .requestMatchers("/v1/consent").permitAll()
                .requestMatchers("/v1/sync/push", "/v1/sync/pull").permitAll()
                .anyRequest().authenticated())
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
