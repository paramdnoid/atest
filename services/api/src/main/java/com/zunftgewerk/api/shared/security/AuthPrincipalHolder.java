package com.zunftgewerk.api.shared.security;

public final class AuthPrincipalHolder {

    private static final ThreadLocal<JwtPrincipal> CONTEXT = new ThreadLocal<>();

    private AuthPrincipalHolder() {
    }

    public static void set(JwtPrincipal principal) {
        CONTEXT.set(principal);
    }

    public static JwtPrincipal get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
