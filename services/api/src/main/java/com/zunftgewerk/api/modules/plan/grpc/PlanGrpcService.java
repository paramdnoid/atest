package com.zunftgewerk.api.modules.plan.grpc;

import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import com.zunftgewerk.api.modules.plan.service.PlanService;
import com.zunftgewerk.api.proto.v1.ChangePlanRequest;
import com.zunftgewerk.api.proto.v1.ChangePlanResponse;
import com.zunftgewerk.api.proto.v1.ListPlansRequest;
import com.zunftgewerk.api.proto.v1.ListPlansResponse;
import com.zunftgewerk.api.proto.v1.Plan;
import com.zunftgewerk.api.proto.v1.PlanServiceGrpc;
import com.zunftgewerk.api.proto.v1.PreviewInvoiceRequest;
import com.zunftgewerk.api.proto.v1.PreviewInvoiceResponse;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.UUID;

@GrpcService
public class PlanGrpcService extends PlanServiceGrpc.PlanServiceImplBase {

    private final PlanService planService;

    public PlanGrpcService(PlanService planService) {
        this.planService = planService;
    }

    @Override
    public void listPlans(ListPlansRequest request, StreamObserver<ListPlansResponse> responseObserver) {
        ListPlansResponse.Builder builder = ListPlansResponse.newBuilder();
        for (PlanCatalog.PlanDefinition plan : planService.listPlans()) {
            builder.addPlans(Plan.newBuilder()
                .setPlanId(plan.planId())
                .setDisplayName(plan.displayName())
                .setIncludedSeats(plan.includedSeats())
                .setBillingCycle(plan.billingCycle())
                .build());
        }
        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void changePlan(ChangePlanRequest request, StreamObserver<ChangePlanResponse> responseObserver) {
        planService.changePlan(UUID.fromString(request.getContext().getTenantId()), request.getPlanId(), request.getBillingCycle());
        responseObserver.onNext(ChangePlanResponse.newBuilder().setChanged(true).build());
        responseObserver.onCompleted();
    }

    @Override
    public void previewInvoice(PreviewInvoiceRequest request, StreamObserver<PreviewInvoiceResponse> responseObserver) {
        long amountCents = planService.previewInvoiceAmount(request.getPlanId());
        responseObserver.onNext(PreviewInvoiceResponse.newBuilder().setAmountCents(amountCents).setCurrency("EUR").build());
        responseObserver.onCompleted();
    }
}
