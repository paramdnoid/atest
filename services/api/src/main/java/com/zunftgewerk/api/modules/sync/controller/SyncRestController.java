package com.zunftgewerk.api.modules.sync.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zunftgewerk.api.modules.sync.entity.ChangeLogEntity;
import com.zunftgewerk.api.modules.sync.model.ConflictResolutionResult;
import com.zunftgewerk.api.modules.sync.model.PushResult;
import com.zunftgewerk.api.modules.sync.service.SyncEngineService;
import com.zunftgewerk.api.proto.v1.ClientOperation;
import com.zunftgewerk.api.proto.v1.VectorClockEntry;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/sync")
public class SyncRestController {

    private final SyncEngineService syncEngineService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public SyncRestController(
        SyncEngineService syncEngineService,
        JwtService jwtService,
        ObjectMapper objectMapper
    ) {
        this.syncEngineService = syncEngineService;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/push")
    public ResponseEntity<?> pushChanges(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody PushHttpRequest body
    ) {
        JwtPrincipal principal = resolveBearer(authorization);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Bearer-Token fehlt"));
        }

        UUID tenantId = principal.tenantId();

        List<ClientOperation> protoOperations = new ArrayList<>();
        if (body.operations() != null) {
            for (OperationHttpRequest op : body.operations()) {
                ClientOperation.Builder builder = ClientOperation.newBuilder()
                    .setClientOpId(op.clientOpId())
                    .setEntityType(op.entityType())
                    .setEntityId(op.entityId())
                    .setOperation(op.operation())
                    .setPayloadDeltaJson(toJson(op.payloadDelta()))
                    .setBaseVersion(op.baseVersion())
                    .setOccurredAt(op.occurredAt() != null ? op.occurredAt() : "");

                if (op.vectorClock() != null) {
                    for (Map.Entry<String, Long> entry : op.vectorClock().entrySet()) {
                        builder.addVectorClock(VectorClockEntry.newBuilder()
                            .setNode(entry.getKey())
                            .setCounter(entry.getValue())
                            .build());
                    }
                }

                protoOperations.add(builder.build());
            }
        }

        List<VectorClockEntry> requestVectorClock = new ArrayList<>();
        if (body.vectorClock() != null) {
            for (Map.Entry<String, Long> entry : body.vectorClock().entrySet()) {
                requestVectorClock.add(VectorClockEntry.newBuilder()
                    .setNode(entry.getKey())
                    .setCounter(entry.getValue())
                    .build());
            }
        }

        PushResult pushResult = syncEngineService.pushChanges(
            tenantId,
            body.deviceId(),
            protoOperations,
            requestVectorClock
        );

        List<Map<String, Object>> conflictMaps = new ArrayList<>();
        for (ConflictResolutionResult conflict : pushResult.getConflicts()) {
            Map<String, Object> conflictMap = new HashMap<>();
            conflictMap.put("clientOpId", conflict.clientOpId());
            conflictMap.put("resolutionType", conflict.resolutionType());
            conflictMap.put("resolvedPayloadJson", conflict.resolvedPayloadJson());
            conflictMap.put("serverVectorClock", conflict.serverVectorClock());
            conflictMap.put("serverVersion", conflict.serverVersion());
            conflictMap.put("reason", conflict.reason());
            conflictMaps.add(conflictMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("acceptedOperationIds", pushResult.getAcceptedOperationIds());
        response.put("conflicts", conflictMaps);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pull")
    public ResponseEntity<?> pullChanges(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(defaultValue = "0") String sinceCursor,
        @RequestParam(required = false) String deviceId
    ) {
        JwtPrincipal principal = resolveBearer(authorization);
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Bearer-Token fehlt"));
        }

        UUID tenantId = principal.tenantId();
        long cursor;
        try {
            cursor = Long.parseLong(sinceCursor);
        } catch (NumberFormatException ex) {
            cursor = 0L;
        }

        List<ChangeLogEntity> changes = syncEngineService.pullChanges(tenantId, cursor);

        long nextCursor = cursor;
        List<Map<String, Object>> changeMaps = new ArrayList<>();
        for (ChangeLogEntity change : changes) {
            Map<String, Object> changeMap = new HashMap<>();
            changeMap.put("id", change.getId());
            changeMap.put("entityType", change.getEntityType());
            changeMap.put("entityId", change.getEntityId());
            changeMap.put("operation", change.getOperation());
            changeMap.put("payloadDeltaJson", change.getPayloadDelta());
            changeMap.put("serverVersion", change.getServerVersion());
            changeMap.put("occurredAt", change.getOccurredAt() != null ? change.getOccurredAt().toString() : null);
            changeMap.put("resultVectorClock", parseVectorJson(change.getResultVectorJson()));
            changeMap.put("conflict", change.isConflict());
            changeMaps.add(changeMap);
            nextCursor = change.getId();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("changes", changeMaps);
        response.put("nextCursor", String.valueOf(nextCursor));
        return ResponseEntity.ok(response);
    }

    private JwtPrincipal resolveBearer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        try {
            return jwtService.verifyAccessToken(authorization.substring("Bearer ".length()));
        } catch (Exception ex) {
            return null;
        }
    }

    private String toJson(Object value) {
        if (value == null) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private Map<String, Long> parseVectorJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<>() {});
            Map<String, Long> normalized = new HashMap<>();
            for (Map.Entry<String, Object> entry : raw.entrySet()) {
                normalized.put(entry.getKey(), Long.parseLong(String.valueOf(entry.getValue())));
            }
            return normalized;
        } catch (Exception ex) {
            return Map.of();
        }
    }

    public record PushHttpRequest(
        String deviceId,
        List<OperationHttpRequest> operations,
        Map<String, Long> vectorClock
    ) {}

    public record OperationHttpRequest(
        String clientOpId,
        String entityType,
        String entityId,
        String operation,
        Map<String, Object> payloadDelta,
        long baseVersion,
        String occurredAt,
        Map<String, Long> vectorClock
    ) {}
}
