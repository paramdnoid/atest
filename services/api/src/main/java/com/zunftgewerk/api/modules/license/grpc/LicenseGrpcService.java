package com.zunftgewerk.api.modules.license.grpc;

import com.zunftgewerk.api.modules.license.entity.EntitlementEntity;
import com.zunftgewerk.api.modules.license.entity.SeatLicenseEntity;
import com.zunftgewerk.api.modules.license.service.LicenseService;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.proto.v1.AssignSeatRequest;
import com.zunftgewerk.api.proto.v1.AssignSeatResponse;
import com.zunftgewerk.api.proto.v1.Entitlement;
import com.zunftgewerk.api.proto.v1.ListEntitlementsRequest;
import com.zunftgewerk.api.proto.v1.ListEntitlementsResponse;
import com.zunftgewerk.api.proto.v1.ListSeatsRequest;
import com.zunftgewerk.api.proto.v1.ListSeatsResponse;
import com.zunftgewerk.api.proto.v1.LicenseServiceGrpc;
import com.zunftgewerk.api.proto.v1.RevokeSeatRequest;
import com.zunftgewerk.api.proto.v1.RevokeSeatResponse;
import com.zunftgewerk.api.proto.v1.SeatLicense;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;
import java.util.UUID;

@GrpcService
public class LicenseGrpcService extends LicenseServiceGrpc.LicenseServiceImplBase {

    private final LicenseService licenseService;

    public LicenseGrpcService(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    @Override
    public void listSeats(ListSeatsRequest request, StreamObserver<ListSeatsResponse> responseObserver) {
        UUID tenantId = UUID.fromString(request.getContext().getTenantId());
        List<SeatLicenseEntity> seats = licenseService.listSeats(tenantId);

        ListSeatsResponse.Builder builder = ListSeatsResponse.newBuilder();
        for (SeatLicenseEntity seat : seats) {
            builder.addSeats(SeatLicense.newBuilder()
                .setSeatId(seat.getId().toString())
                .setUserId(seat.getUserId().toString())
                .setStatus(seat.getStatus())
                .setUpdatedAt(seat.getUpdatedAt().toString())
                .build());
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void assignSeat(AssignSeatRequest request, StreamObserver<AssignSeatResponse> responseObserver) {
        try {
            UUID seatId = licenseService.assignSeat(
                UUID.fromString(request.getContext().getTenantId()),
                UUID.fromString(request.getUserId())
            );
            responseObserver.onNext(AssignSeatResponse.newBuilder().setSeatId(seatId.toString()).build());
            responseObserver.onCompleted();
        } catch (SeatLicenseManagementService.SeatPolicyException ex) {
            responseObserver.onError(
                Status.FAILED_PRECONDITION
                    .withDescription(ex.code() + ":" + ex.getMessage())
                    .asRuntimeException()
            );
        } catch (IllegalStateException ex) {
            responseObserver.onError(
                Status.FAILED_PRECONDITION
                    .withDescription(ex.getMessage())
                    .asRuntimeException()
            );
        }
    }

    @Override
    public void revokeSeat(RevokeSeatRequest request, StreamObserver<RevokeSeatResponse> responseObserver) {
        try {
            boolean revoked = licenseService.revokeSeat(
                UUID.fromString(request.getContext().getTenantId()),
                UUID.fromString(request.getSeatId())
            );
            responseObserver.onNext(RevokeSeatResponse.newBuilder().setRevoked(revoked).build());
            responseObserver.onCompleted();
        } catch (SeatLicenseManagementService.SeatPolicyException ex) {
            responseObserver.onError(
                Status.FAILED_PRECONDITION
                    .withDescription(ex.code() + ":" + ex.getMessage())
                    .asRuntimeException()
            );
        }
    }

    @Override
    public void listEntitlements(ListEntitlementsRequest request, StreamObserver<ListEntitlementsResponse> responseObserver) {
        UUID tenantId = UUID.fromString(request.getContext().getTenantId());
        List<EntitlementEntity> entitlements = licenseService.listEntitlements(tenantId);

        ListEntitlementsResponse.Builder builder = ListEntitlementsResponse.newBuilder();
        for (EntitlementEntity entitlement : entitlements) {
            builder.addEntitlements(Entitlement.newBuilder()
                .setKey(entitlement.getEntitlementKey())
                .setEnabled(entitlement.isEnabled())
                .build());
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }
}
