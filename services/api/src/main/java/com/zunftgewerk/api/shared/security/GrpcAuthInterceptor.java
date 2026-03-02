package com.zunftgewerk.api.shared.security;

import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@GrpcGlobalServerInterceptor
public class GrpcAuthInterceptor implements ServerInterceptor {

    private static final Metadata.Key<String> AUTHORIZATION = Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    private static final Set<String> PUBLIC_METHODS = Set.of(
        "zunftgewerk.v1.AuthService/Register",
        "zunftgewerk.v1.AuthService/Login",
        "zunftgewerk.v1.AuthService/BeginPasskey",
        "zunftgewerk.v1.AuthService/VerifyPasskey",
        "zunftgewerk.v1.AuthService/VerifyMfa",
        "zunftgewerk.v1.AuthService/RefreshToken"
    );

    private final JwtService jwtService;

    public GrpcAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next
    ) {
        String method = call.getMethodDescriptor().getFullMethodName();
        if (PUBLIC_METHODS.contains(method)) {
            return next.startCall(call, headers);
        }

        String authorization = headers.get(AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            call.close(Status.UNAUTHENTICATED.withDescription("Missing bearer token"), new Metadata());
            return new ServerCall.Listener<>() {
            };
        }

        try {
            JwtPrincipal principal = jwtService.verifyAccessToken(authorization.substring("Bearer ".length()));
            AuthPrincipalHolder.set(principal);
            return new ForwardingServerCallListener<>(next.startCall(call, headers));
        } catch (Exception ex) {
            call.close(Status.UNAUTHENTICATED.withDescription("Invalid token"), new Metadata());
            return new ServerCall.Listener<>() {
            };
        }
    }

    private static class ForwardingServerCallListener<ReqT> extends ServerCall.Listener<ReqT> {

        private final ServerCall.Listener<ReqT> delegate;

        private ForwardingServerCallListener(ServerCall.Listener<ReqT> delegate) {
            this.delegate = delegate;
        }

        @Override
        public void onHalfClose() {
            delegate.onHalfClose();
        }

        @Override
        public void onCancel() {
            AuthPrincipalHolder.clear();
            delegate.onCancel();
        }

        @Override
        public void onComplete() {
            AuthPrincipalHolder.clear();
            delegate.onComplete();
        }

        @Override
        public void onReady() {
            delegate.onReady();
        }

        @Override
        public void onMessage(ReqT message) {
            delegate.onMessage(message);
        }
    }
}
