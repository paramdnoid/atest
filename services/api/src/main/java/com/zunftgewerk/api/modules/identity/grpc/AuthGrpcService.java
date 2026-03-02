package com.zunftgewerk.api.modules.identity.grpc;

import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.MfaEnrollmentResult;
import com.zunftgewerk.api.modules.identity.model.MfaVerifyResult;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.model.RegisterResult;
import com.zunftgewerk.api.modules.identity.service.IdentityService;
import com.zunftgewerk.api.proto.v1.AuthServiceGrpc;
import com.zunftgewerk.api.proto.v1.AuthState;
import com.zunftgewerk.api.proto.v1.BeginPasskeyRequest;
import com.zunftgewerk.api.proto.v1.BeginPasskeyResponse;
import com.zunftgewerk.api.proto.v1.EnableMfaRequest;
import com.zunftgewerk.api.proto.v1.EnableMfaResponse;
import com.zunftgewerk.api.proto.v1.LoginRequest;
import com.zunftgewerk.api.proto.v1.LoginResponse;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import com.zunftgewerk.api.proto.v1.RefreshTokenRequest;
import com.zunftgewerk.api.proto.v1.RefreshTokenResponse;
import com.zunftgewerk.api.proto.v1.RegisterRequest;
import com.zunftgewerk.api.proto.v1.RegisterResponse;
import com.zunftgewerk.api.proto.v1.VerifyMfaRequest;
import com.zunftgewerk.api.proto.v1.VerifyMfaResponse;
import com.zunftgewerk.api.proto.v1.VerifyPasskeyRequest;
import com.zunftgewerk.api.proto.v1.VerifyPasskeyResponse;
import com.zunftgewerk.api.shared.security.AuthPrincipalHolder;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.UUID;

@GrpcService
public class AuthGrpcService extends AuthServiceGrpc.AuthServiceImplBase {

    private final IdentityService identityService;

    public AuthGrpcService(IdentityService identityService) {
        this.identityService = identityService;
    }

    @Override
    public void register(RegisterRequest request, StreamObserver<RegisterResponse> responseObserver) {
        try {
            RegisterResult result = identityService.register(request.getEmail(), request.getPassword(), request.getTenantName());
            responseObserver.onNext(RegisterResponse.newBuilder()
                .setUserId(result.userId().toString())
                .setTenantId(result.tenantId().toString())
                .build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void login(LoginRequest request, StreamObserver<LoginResponse> responseObserver) {
        try {
            LoginResult result = identityService.login(request.getEmail(), request.getPassword());

            LoginResponse.Builder response = LoginResponse.newBuilder()
                .setUserId(result.userId().toString())
                .setTenantId(result.tenantId().toString())
                .addAllRoles(result.roles())
                .setMfaRequired(result.mfaRequired());

            if (result.mfaRequired()) {
                response.setAuthState(AuthState.MFA_REQUIRED)
                    .setMfaToken(result.mfaToken());
            } else {
                response.setAuthState(AuthState.AUTHENTICATED)
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken())
                    .setExpiresAt(result.accessTokenExpiresAt().toString());
            }

            responseObserver.onNext(response.build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.UNAUTHENTICATED.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void beginPasskey(BeginPasskeyRequest request, StreamObserver<BeginPasskeyResponse> responseObserver) {
        try {
            PasskeyMode mode = request.getMode() == PasskeyMode.PASSKEY_MODE_UNSPECIFIED ? PasskeyMode.AUTHENTICATE : request.getMode();
            PasskeyBeginResult result = identityService.beginPasskey(request.getEmail(), mode);

            responseObserver.onNext(BeginPasskeyResponse.newBuilder()
                .setChallenge(result.challenge())
                .setChallengeId(result.challengeId())
                .setPublicKeyOptionsJson(result.optionsJson())
                .setMode(result.mode())
                .build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void verifyPasskey(VerifyPasskeyRequest request, StreamObserver<VerifyPasskeyResponse> responseObserver) {
        try {
            PasskeyMode mode = request.getMode() == PasskeyMode.PASSKEY_MODE_UNSPECIFIED ? PasskeyMode.AUTHENTICATE : request.getMode();
            LoginResult result = identityService.verifyPasskey(
                request.getEmail(),
                request.getChallengeId(),
                request.getCredential(),
                mode
            );

            VerifyPasskeyResponse.Builder response = VerifyPasskeyResponse.newBuilder()
                .setVerified(true)
                .setUserId(result.userId().toString())
                .setTenantId(result.tenantId().toString())
                .addAllRoles(result.roles())
                .setMfaRequired(result.mfaRequired());

            if (result.mfaRequired()) {
                response.setAuthState(AuthState.MFA_REQUIRED)
                    .setMfaToken(result.mfaToken());
            } else {
                response.setAuthState(AuthState.AUTHENTICATED)
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken());
            }

            responseObserver.onNext(response.build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.UNAUTHENTICATED.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void enableMfa(EnableMfaRequest request, StreamObserver<EnableMfaResponse> responseObserver) {
        try {
            UUID requestedUserId = UUID.fromString(request.getUserId());
            JwtPrincipal principal = AuthPrincipalHolder.get();
            if (principal == null || !principal.userId().equals(requestedUserId)) {
                throw new IllegalArgumentException("MFA enable requires matching authenticated user");
            }
            MfaEnrollmentResult result = identityService.enableMfa(requestedUserId);
            responseObserver.onNext(EnableMfaResponse.newBuilder()
                .setSecret(result.secret())
                .setProvisioningUri(result.provisioningUri())
                .addAllBackupCodes(result.backupCodes())
                .build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void verifyMfa(VerifyMfaRequest request, StreamObserver<VerifyMfaResponse> responseObserver) {
        try {
            MfaVerifyResult result = identityService.verifyMfa(
                UUID.fromString(request.getUserId()),
                request.getMfaToken(),
                request.getCode(),
                request.getBackupCode()
            );

            responseObserver.onNext(VerifyMfaResponse.newBuilder()
                .setVerified(result.verified())
                .setAccessToken(result.accessToken())
                .setRefreshToken(result.refreshToken())
                .setExpiresAt(result.accessTokenExpiresAt().toString())
                .build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.UNAUTHENTICATED.withDescription(ex.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void refreshToken(RefreshTokenRequest request, StreamObserver<RefreshTokenResponse> responseObserver) {
        try {
            RefreshResult result = identityService.refreshToken(request.getRefreshToken());
            responseObserver.onNext(RefreshTokenResponse.newBuilder()
                .setAccessToken(result.accessToken())
                .setRefreshToken(result.refreshToken())
                .setExpiresAt(result.accessTokenExpiresAt().toString())
                .build());
            responseObserver.onCompleted();
        } catch (Exception ex) {
            responseObserver.onError(Status.UNAUTHENTICATED.withDescription(ex.getMessage()).asRuntimeException());
        }
    }
}
