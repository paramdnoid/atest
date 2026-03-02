package com.zunftgewerk.api.shared.security;

public final class GrpcRequestContextHolder {

    private static final ThreadLocal<String> PEER_ADDRESS = new ThreadLocal<>();

    private GrpcRequestContextHolder() {
    }

    public static void setPeerAddress(String peerAddress) {
        PEER_ADDRESS.set(peerAddress);
    }

    public static String getPeerAddress() {
        return PEER_ADDRESS.get();
    }

    public static void clear() {
        PEER_ADDRESS.remove();
    }
}
