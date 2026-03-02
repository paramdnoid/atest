package com.zunftgewerk.api.modules.tenant.grpc;

import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.service.TenantService;
import com.zunftgewerk.api.proto.v1.AssignRoleRequest;
import com.zunftgewerk.api.proto.v1.AssignRoleResponse;
import com.zunftgewerk.api.proto.v1.CreateTenantRequest;
import com.zunftgewerk.api.proto.v1.CreateTenantResponse;
import com.zunftgewerk.api.proto.v1.InviteMemberRequest;
import com.zunftgewerk.api.proto.v1.InviteMemberResponse;
import com.zunftgewerk.api.proto.v1.ListMembersRequest;
import com.zunftgewerk.api.proto.v1.ListMembersResponse;
import com.zunftgewerk.api.proto.v1.Member;
import com.zunftgewerk.api.proto.v1.PaginationResponse;
import com.zunftgewerk.api.proto.v1.TenantServiceGrpc;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;
import java.util.UUID;

@GrpcService
public class TenantGrpcService extends TenantServiceGrpc.TenantServiceImplBase {

    private final TenantService tenantService;

    public TenantGrpcService(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @Override
    public void createTenant(CreateTenantRequest request, StreamObserver<CreateTenantResponse> responseObserver) {
        UUID tenantId = tenantService.createTenant(request.getName(), UUID.fromString(request.getOwnerUserId()));
        responseObserver.onNext(CreateTenantResponse.newBuilder().setTenantId(tenantId.toString()).build());
        responseObserver.onCompleted();
    }

    @Override
    public void inviteMember(InviteMemberRequest request, StreamObserver<InviteMemberResponse> responseObserver) {
        UUID invitationId = tenantService.inviteMember(UUID.fromString(request.getContext().getTenantId()), request.getEmail());
        responseObserver.onNext(InviteMemberResponse.newBuilder().setInvitationId(invitationId.toString()).build());
        responseObserver.onCompleted();
    }

    @Override
    public void assignRole(AssignRoleRequest request, StreamObserver<AssignRoleResponse> responseObserver) {
        boolean assigned = tenantService.assignRole(
            UUID.fromString(request.getContext().getTenantId()),
            UUID.fromString(request.getUserId()),
            request.getRoleKey()
        );

        responseObserver.onNext(AssignRoleResponse.newBuilder().setAssigned(assigned).build());
        responseObserver.onCompleted();
    }

    @Override
    public void listMembers(ListMembersRequest request, StreamObserver<ListMembersResponse> responseObserver) {
        List<MembershipEntity> memberships = tenantService.listMembers(UUID.fromString(request.getContext().getTenantId()));

        ListMembersResponse.Builder builder = ListMembersResponse.newBuilder();
        for (MembershipEntity membership : memberships) {
            builder.addMembers(Member.newBuilder()
                .setUserId(membership.getUserId().toString())
                .setEmail("user+" + membership.getUserId() + "@placeholder.local")
                .addRoles(membership.getRoleKey())
                .build());
        }

        builder.setPagination(PaginationResponse.newBuilder().setNextPageToken(""));

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }
}
