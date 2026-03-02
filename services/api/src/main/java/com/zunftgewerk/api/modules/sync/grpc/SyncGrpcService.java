package com.zunftgewerk.api.modules.sync.grpc;

import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import com.zunftgewerk.api.modules.sync.model.ConflictResolutionResult;
import com.zunftgewerk.api.modules.sync.model.PushResult;
import com.zunftgewerk.api.modules.sync.service.SyncEngineService;
import com.zunftgewerk.api.proto.v1.ChangeEvent;
import com.zunftgewerk.api.proto.v1.ConflictResolution;
import com.zunftgewerk.api.proto.v1.PullChangesRequest;
import com.zunftgewerk.api.proto.v1.PullChangesResponse;
import com.zunftgewerk.api.proto.v1.PushChangesRequest;
import com.zunftgewerk.api.proto.v1.PushChangesResponse;
import com.zunftgewerk.api.proto.v1.StreamChangesRequest;
import com.zunftgewerk.api.proto.v1.SyncServiceGrpc;
import com.zunftgewerk.api.proto.v1.VectorClockEntry;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@GrpcService
public class SyncGrpcService extends SyncServiceGrpc.SyncServiceImplBase {

    private final SyncEngineService syncEngineService;

    public SyncGrpcService(SyncEngineService syncEngineService) {
        this.syncEngineService = syncEngineService;
    }

    @Override
    public void pullChanges(PullChangesRequest request, StreamObserver<PullChangesResponse> responseObserver) {
        long sinceCursor = request.getSinceCursor().isBlank() ? 0L : Long.parseLong(request.getSinceCursor());
        UUID tenantId = UUID.fromString(request.getContext().getTenantId());

        List<ChangeLogEntity> changes = syncEngineService.pullChanges(tenantId, sinceCursor);

        PullChangesResponse.Builder response = PullChangesResponse.newBuilder();
        long nextCursor = sinceCursor;
        for (ChangeLogEntity change : changes) {
            response.addChanges(ChangeEvent.newBuilder()
                .setId(change.getId())
                .setEntityType(change.getEntityType())
                .setEntityId(change.getEntityId())
                .setOperation(change.getOperation())
                .setPayloadDeltaJson(change.getPayloadDelta())
                .setServerVersion(change.getServerVersion())
                .setOccurredAt(change.getOccurredAt().toString())
                .addAllResultVectorClock(toVectorEntries(change.getResultVectorJson()))
                .setConflict(change.isConflict())
                .build());
            nextCursor = change.getId();
        }
        response.setNextCursor(String.valueOf(nextCursor));

        responseObserver.onNext(response.build());
        responseObserver.onCompleted();
    }

    @Override
    public void pushChanges(PushChangesRequest request, StreamObserver<PushChangesResponse> responseObserver) {
        UUID tenantId = UUID.fromString(request.getContext().getTenantId());
        PushResult pushResult = syncEngineService.pushChanges(
            tenantId,
            request.getDeviceId(),
            request.getOperationsList(),
            request.getVectorClockList()
        );

        PushChangesResponse.Builder response = PushChangesResponse.newBuilder();
        response.addAllAcceptedOperationIds(pushResult.getAcceptedOperationIds());

        for (ConflictResolutionResult conflict : pushResult.getConflicts()) {
            response.addConflicts(ConflictResolution.newBuilder()
                .setClientOpId(conflict.clientOpId())
                .setResolutionType(conflict.resolutionType())
                .setResolvedPayloadJson(conflict.resolvedPayloadJson())
                .addAllServerVectorClock(toVectorEntries(conflict.serverVectorClock()))
                .setServerVersion(conflict.serverVersion())
                .setReason(conflict.reason())
                .build());
        }

        responseObserver.onNext(response.build());
        responseObserver.onCompleted();
    }

    @Override
    public void streamChanges(StreamChangesRequest request, StreamObserver<ChangeEvent> responseObserver) {
        long cursor = request.getCursor().isBlank() ? 0L : Long.parseLong(request.getCursor());
        UUID tenantId = UUID.fromString(request.getContext().getTenantId());

        List<ChangeLogEntity> changes = syncEngineService.pullChanges(tenantId, cursor);
        for (ChangeLogEntity change : changes) {
            responseObserver.onNext(ChangeEvent.newBuilder()
                .setId(change.getId())
                .setEntityType(change.getEntityType())
                .setEntityId(change.getEntityId())
                .setOperation(change.getOperation())
                .setPayloadDeltaJson(change.getPayloadDelta())
                .setServerVersion(change.getServerVersion())
                .setOccurredAt(change.getOccurredAt().toString())
                .addAllResultVectorClock(toVectorEntries(change.getResultVectorJson()))
                .setConflict(change.isConflict())
                .build());
        }
        responseObserver.onCompleted();
    }

    private List<VectorClockEntry> toVectorEntries(String json) {
        Map<String, Long> vector = parseVector(json);
        return toVectorEntries(vector);
    }

    private List<VectorClockEntry> toVectorEntries(Map<String, Long> vector) {
        return vector.entrySet().stream()
            .map(entry -> VectorClockEntry.newBuilder()
                .setNode(entry.getKey())
                .setCounter(entry.getValue())
                .build())
            .toList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Long> parseVector(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> raw = mapper.readValue(json, HashMap.class);
            Map<String, Long> normalized = new HashMap<>();
            for (Map.Entry<String, Object> entry : raw.entrySet()) {
                normalized.put(entry.getKey(), Long.parseLong(String.valueOf(entry.getValue())));
            }
            return normalized;
        } catch (Exception ex) {
            return Map.of();
        }
    }
}
