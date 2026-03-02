package com.zunftgewerk.api.modules.sync.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import com.zunftgewerk.api.modules.sync.entity.ClientOperationEntity;
import com.zunftgewerk.api.modules.sync.entity.EntitySyncStateEntity;
import com.zunftgewerk.api.modules.sync.entity.EntitySyncStateId;
import com.zunftgewerk.api.modules.sync.model.ConflictResolutionResult;
import com.zunftgewerk.api.modules.sync.model.PushResult;
import com.zunftgewerk.api.modules.sync.repository.ChangeLogRepository;
import com.zunftgewerk.api.modules.sync.repository.ClientOperationRepository;
import com.zunftgewerk.api.modules.sync.repository.EntitySyncStateRepository;
import com.zunftgewerk.api.proto.v1.ClientOperation;
import com.zunftgewerk.api.proto.v1.VectorClockEntry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SyncEngineService {

    private final ChangeLogRepository changeLogRepository;
    private final ClientOperationRepository clientOperationRepository;
    private final EntitySyncStateRepository entitySyncStateRepository;
    private final ObjectMapper objectMapper;

    public SyncEngineService(
        ChangeLogRepository changeLogRepository,
        ClientOperationRepository clientOperationRepository,
        EntitySyncStateRepository entitySyncStateRepository,
        ObjectMapper objectMapper
    ) {
        this.changeLogRepository = changeLogRepository;
        this.clientOperationRepository = clientOperationRepository;
        this.entitySyncStateRepository = entitySyncStateRepository;
        this.objectMapper = objectMapper;
    }

    public List<ChangeLogEntity> pullChanges(UUID tenantId, long sinceCursor) {
        return changeLogRepository.findByTenantIdAndIdGreaterThanOrderByIdAsc(tenantId, sinceCursor);
    }

    @Transactional
    public PushResult pushChanges(
        UUID tenantId,
        String deviceId,
        List<ClientOperation> operations,
        List<VectorClockEntry> requestVectorClock
    ) {
        PushResult result = new PushResult();

        for (ClientOperation operation : operations) {
            Optional<ClientOperationEntity> replayedOperation = clientOperationRepository.findById(operation.getClientOpId());
            if (replayedOperation.isPresent()) {
                replayResult(result, replayedOperation.get());
                continue;
            }

            Map<String, Long> operationVector = resolveOperationVector(operation, requestVectorClock);
            String operationVectorJson = toJson(operationVector);

            EntitySyncStateId syncStateId = new EntitySyncStateId(tenantId, operation.getEntityType(), operation.getEntityId());
            EntitySyncStateEntity syncState = entitySyncStateRepository.findById(syncStateId)
                .orElseGet(() -> createInitialSyncState(tenantId, operation.getEntityType(), operation.getEntityId()));

            Map<String, Long> serverVector = fromJson(syncState.getVectorClockJson());
            VectorComparison comparison = compareVectors(operationVector, serverVector);

            OffsetDateTime occurredAt = parseOccurredAt(operation.getOccurredAt());
            String normalizedOperation = operation.getOperation().toLowerCase();
            Optional<ChangeLogEntity> latestEntityChange = changeLogRepository
                .findTopByTenantIdAndEntityTypeAndEntityIdOrderByIdDesc(tenantId, operation.getEntityType(), operation.getEntityId());

            ConflictReason conflictReason = determineConflictReason(
                syncState,
                normalizedOperation,
                comparison,
                occurredAt,
                deviceId,
                latestEntityChange.orElse(null)
            );

            if (conflictReason != ConflictReason.NONE) {
                String resolvedPayload = latestEntityChange.map(ChangeLogEntity::getPayloadDelta).orElse("{}");
                recordConflict(
                    result,
                    operation,
                    tenantId,
                    deviceId,
                    operationVectorJson,
                    syncState,
                    serverVector,
                    conflictReason,
                    resolvedPayload
                );
                continue;
            }

            Map<String, Long> mergedVector = mergeVectors(serverVector, operationVector);
            mergedVector.put(deviceId, Math.max(mergedVector.getOrDefault(deviceId, 0L), operationVector.getOrDefault(deviceId, 0L)) + 1);

            syncState.setServerVersion(syncState.getServerVersion() + 1);
            syncState.setVectorClockJson(toJson(mergedVector));
            syncState.setUpdatedAt(OffsetDateTime.now());

            boolean isDelete = "delete".equals(normalizedOperation);
            syncState.setDeleted(isDelete);
            syncState.setTombstonedAt(isDelete ? OffsetDateTime.now() : null);
            entitySyncStateRepository.save(syncState);

            ChangeLogEntity change = new ChangeLogEntity();
            change.setTenantId(tenantId);
            change.setEntityType(operation.getEntityType());
            change.setEntityId(operation.getEntityId());
            change.setOperation(normalizedOperation);
            change.setPayloadDelta(operation.getPayloadDeltaJson());
            change.setDeviceId(deviceId);
            change.setOperationVectorJson(operationVectorJson);
            change.setResultVectorJson(toJson(mergedVector));
            change.setConflict(false);
            change.setServerVersion(syncState.getServerVersion());
            change.setOccurredAt(occurredAt);
            changeLogRepository.save(change);

            ClientOperationEntity opEntity = new ClientOperationEntity();
            opEntity.setClientOpId(operation.getClientOpId());
            opEntity.setTenantId(tenantId);
            opEntity.setDeviceId(deviceId);
            opEntity.setAppliedStatus("APPLIED");
            opEntity.setResolution("NONE");
            opEntity.setOperationVectorJson(operationVectorJson);
            opEntity.setServerVectorJson(toJson(mergedVector));
            opEntity.setServerVersion(syncState.getServerVersion());
            opEntity.setCreatedAt(OffsetDateTime.now());
            clientOperationRepository.save(opEntity);

            result.getAcceptedOperationIds().add(operation.getClientOpId());
        }

        return result;
    }

    private void replayResult(PushResult result, ClientOperationEntity replayedOperation) {
        if ("CONFLICT".equalsIgnoreCase(replayedOperation.getAppliedStatus())) {
            result.getConflicts().add(new ConflictResolutionResult(
                replayedOperation.getClientOpId(),
                replayedOperation.getResolution(),
                replayedOperation.getResolvedPayloadJson() == null ? "{}" : replayedOperation.getResolvedPayloadJson(),
                fromJson(replayedOperation.getServerVectorJson()),
                replayedOperation.getServerVersion(),
                replayedOperation.getConflictType() == null ? "REPLAY_CONFLICT" : replayedOperation.getConflictType()
            ));
            return;
        }

        result.getAcceptedOperationIds().add(replayedOperation.getClientOpId());
    }

    private ConflictReason determineConflictReason(
        EntitySyncStateEntity syncState,
        String operation,
        VectorComparison comparison,
        OffsetDateTime occurredAt,
        String deviceId,
        ChangeLogEntity latestEntityChange
    ) {
        if ("delete".equals(operation)) {
            return ConflictReason.NONE;
        }

        if (syncState.isDeleted()) {
            return ConflictReason.DELETE_WINS_TOMBSTONE;
        }

        if (comparison == VectorComparison.IS_DOMINATED) {
            return ConflictReason.STALE_VECTOR;
        }

        if (comparison == VectorComparison.CONCURRENT) {
            OffsetDateTime serverOccurredAt = latestEntityChange != null && latestEntityChange.getOccurredAt() != null
                ? latestEntityChange.getOccurredAt()
                : (syncState.getUpdatedAt() == null ? OffsetDateTime.MIN : syncState.getUpdatedAt());
            String serverDevice = latestEntityChange != null && latestEntityChange.getDeviceId() != null
                ? latestEntityChange.getDeviceId()
                : "server";

            if (occurredAt.isBefore(serverOccurredAt)) {
                return ConflictReason.CONCURRENT_SERVER_WINS;
            }
            if (occurredAt.isEqual(serverOccurredAt) && deviceId.compareTo(serverDevice) <= 0) {
                return ConflictReason.CONCURRENT_SERVER_WINS;
            }
        }

        return ConflictReason.NONE;
    }

    private void recordConflict(
        PushResult result,
        ClientOperation operation,
        UUID tenantId,
        String deviceId,
        String operationVectorJson,
        EntitySyncStateEntity syncState,
        Map<String, Long> serverVector,
        ConflictReason reason,
        String resolvedPayload
    ) {
        ClientOperationEntity opEntity = new ClientOperationEntity();
        opEntity.setClientOpId(operation.getClientOpId());
        opEntity.setTenantId(tenantId);
        opEntity.setDeviceId(deviceId);
        opEntity.setAppliedStatus("CONFLICT");
        opEntity.setResolution("SERVER_PATCH");
        opEntity.setConflictType(reason.reason());
        opEntity.setResolvedPayloadJson(resolvedPayload);
        opEntity.setOperationVectorJson(operationVectorJson);
        opEntity.setServerVectorJson(toJson(serverVector));
        opEntity.setServerVersion(syncState.getServerVersion());
        opEntity.setCreatedAt(OffsetDateTime.now());
        clientOperationRepository.save(opEntity);

        result.getConflicts().add(new ConflictResolutionResult(
            operation.getClientOpId(),
            "SERVER_PATCH",
            resolvedPayload,
            serverVector,
            syncState.getServerVersion(),
            reason.reason()
        ));
    }

    private EntitySyncStateEntity createInitialSyncState(UUID tenantId, String entityType, String entityId) {
        EntitySyncStateEntity entity = new EntitySyncStateEntity();
        entity.setTenantId(tenantId);
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setServerVersion(0);
        entity.setVectorClockJson("{}");
        entity.setDeleted(false);
        entity.setUpdatedAt(OffsetDateTime.now());
        return entity;
    }

    private OffsetDateTime parseOccurredAt(String occurredAt) {
        if (occurredAt == null || occurredAt.isBlank()) {
            return OffsetDateTime.now();
        }
        try {
            return OffsetDateTime.parse(occurredAt);
        } catch (DateTimeParseException ex) {
            return OffsetDateTime.now();
        }
    }

    private Map<String, Long> resolveOperationVector(ClientOperation operation, List<VectorClockEntry> fallback) {
        List<VectorClockEntry> source = operation.getVectorClockCount() > 0 ? operation.getVectorClockList() : fallback;
        Map<String, Long> map = new HashMap<>();
        for (VectorClockEntry entry : source) {
            map.put(entry.getNode(), Math.max(entry.getCounter(), map.getOrDefault(entry.getNode(), 0L)));
        }
        return map;
    }

    private Map<String, Long> mergeVectors(Map<String, Long> left, Map<String, Long> right) {
        Map<String, Long> merged = new HashMap<>(left);
        for (Map.Entry<String, Long> entry : right.entrySet()) {
            merged.put(entry.getKey(), Math.max(entry.getValue(), merged.getOrDefault(entry.getKey(), 0L)));
        }
        return merged;
    }

    private VectorComparison compareVectors(Map<String, Long> incoming, Map<String, Long> server) {
        boolean greater = false;
        boolean lower = false;

        Map<String, Long> keys = new HashMap<>();
        incoming.forEach(keys::put);
        server.forEach(keys::putIfAbsent);

        for (String key : keys.keySet()) {
            long incomingValue = incoming.getOrDefault(key, 0L);
            long serverValue = server.getOrDefault(key, 0L);
            if (incomingValue > serverValue) {
                greater = true;
            }
            if (incomingValue < serverValue) {
                lower = true;
            }
        }

        if (greater && lower) {
            return VectorComparison.CONCURRENT;
        }
        if (greater) {
            return VectorComparison.DOMINATES;
        }
        if (lower) {
            return VectorComparison.IS_DOMINATED;
        }
        return VectorComparison.EQUAL;
    }

    private String toJson(Map<String, Long> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize vector clock", ex);
        }
    }

    private Map<String, Long> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }

        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            return new HashMap<>();
        }
    }

    private enum VectorComparison {
        DOMINATES,
        IS_DOMINATED,
        CONCURRENT,
        EQUAL
    }

    private enum ConflictReason {
        NONE("NONE"),
        STALE_VECTOR("STALE_VECTOR"),
        CONCURRENT_SERVER_WINS("CONCURRENT_SERVER_WINS"),
        DELETE_WINS_TOMBSTONE("DELETE_WINS_TOMBSTONE");

        private final String reason;

        ConflictReason(String reason) {
            this.reason = reason;
        }

        public String reason() {
            return reason;
        }
    }
}
