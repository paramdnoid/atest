package com.zunftgewerk.api.modules.sync.model;

import java.util.Map;

public record ConflictResolutionResult(
    String clientOpId,
    String resolutionType,
    String resolvedPayloadJson,
    Map<String, Long> serverVectorClock,
    long serverVersion,
    String reason
) {
}
