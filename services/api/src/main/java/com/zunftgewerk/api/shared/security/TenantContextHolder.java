package com.zunftgewerk.api.shared.security;

public final class TenantContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    private TenantContextHolder() {
    }

    public static TenantContext getRequired() {
        TenantContext tenantContext = CONTEXT.get();
        if (tenantContext == null) {
            throw new IllegalStateException("Tenant context is missing");
        }
        return tenantContext;
    }

    public static void set(TenantContext context) {
        CONTEXT.set(context);
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
