package com.zunftgewerk.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Runtime feature flag configuration bound from {@code zunftgewerk.features.*} YAML properties.
 *
 * <p>Each flag can be overridden at deploy time via the corresponding environment variable
 * (e.g. {@code FEATURE_STRIPE_BILLING=false}). Defaults match the values in
 * {@code config/feature-flags.json} at the monorepo root.
 *
 * <p>Inject this bean via constructor injection wherever conditional feature behaviour is needed.
 *
 * @since Java 21 / Spring Boot 3.3.6
 */
@Component
@ConfigurationProperties(prefix = "zunftgewerk.features")
public class FeatureFlagProperties {

    /**
     * Enables the V1 sync engine for offline-first field client synchronisation.
     * Default: {@code true}.
     */
    private boolean syncEngineV1;

    /**
     * Enables Stripe-based billing flows (checkout, portal, webhooks).
     * Default: {@code true}.
     */
    private boolean stripeBilling;

    /**
     * Enables custom role definitions per tenant beyond the built-in owner/admin/member set.
     * Default: {@code true}.
     */
    private boolean customRoles;

    /**
     * Enables WebAuthn passkey authentication.
     * Default: {@code true}.
     */
    private boolean passkeyAuth;

    /**
     * Enforces MFA for admin and owner accounts.
     * Default: {@code false} — enable only after confirming all admins have enrolled.
     */
    private boolean mfaEnforcementAdmin;

    /**
     * Activates the v2 authentication pipeline.
     * Default: {@code true}.
     */
    private boolean authV2Enabled;

    /**
     * Enables the Stripe webhook ingest worker.
     * Default: {@code true}.
     */
    private boolean stripeWebhookEnabled;

    /**
     * Enables the vector-clock based conflict resolver in the sync engine.
     * Default: {@code true}.
     */
    private boolean syncVectorResolverEnabled;

    // --- Getters and setters (required by @ConfigurationProperties binding) ---

    public boolean isSyncEngineV1() {
        return syncEngineV1;
    }

    public void setSyncEngineV1(boolean syncEngineV1) {
        this.syncEngineV1 = syncEngineV1;
    }

    public boolean isStripeBilling() {
        return stripeBilling;
    }

    public void setStripeBilling(boolean stripeBilling) {
        this.stripeBilling = stripeBilling;
    }

    public boolean isCustomRoles() {
        return customRoles;
    }

    public void setCustomRoles(boolean customRoles) {
        this.customRoles = customRoles;
    }

    public boolean isPasskeyAuth() {
        return passkeyAuth;
    }

    public void setPasskeyAuth(boolean passkeyAuth) {
        this.passkeyAuth = passkeyAuth;
    }

    public boolean isMfaEnforcementAdmin() {
        return mfaEnforcementAdmin;
    }

    public void setMfaEnforcementAdmin(boolean mfaEnforcementAdmin) {
        this.mfaEnforcementAdmin = mfaEnforcementAdmin;
    }

    public boolean isAuthV2Enabled() {
        return authV2Enabled;
    }

    public void setAuthV2Enabled(boolean authV2Enabled) {
        this.authV2Enabled = authV2Enabled;
    }

    public boolean isStripeWebhookEnabled() {
        return stripeWebhookEnabled;
    }

    public void setStripeWebhookEnabled(boolean stripeWebhookEnabled) {
        this.stripeWebhookEnabled = stripeWebhookEnabled;
    }

    public boolean isSyncVectorResolverEnabled() {
        return syncVectorResolverEnabled;
    }

    public void setSyncVectorResolverEnabled(boolean syncVectorResolverEnabled) {
        this.syncVectorResolverEnabled = syncVectorResolverEnabled;
    }
}
