package com.zunftgewerk.api.modules.sync.model;

import java.util.ArrayList;
import java.util.List;

public class PushResult {

    private final List<String> acceptedOperationIds = new ArrayList<>();
    private final List<ConflictResolutionResult> conflicts = new ArrayList<>();

    public List<String> getAcceptedOperationIds() {
        return acceptedOperationIds;
    }

    public List<ConflictResolutionResult> getConflicts() {
        return conflicts;
    }
}
