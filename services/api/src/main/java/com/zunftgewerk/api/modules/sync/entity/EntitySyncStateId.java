package com.zunftgewerk.api.modules.sync.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class EntitySyncStateId implements Serializable {

    private UUID tenantId;
    private String entityType;
    private String entityId;

    public EntitySyncStateId() {
    }

    public EntitySyncStateId(UUID tenantId, String entityType, String entityId) {
        this.tenantId = tenantId;
        this.entityType = entityType;
        this.entityId = entityId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof EntitySyncStateId that)) {
            return false;
        }
        return Objects.equals(tenantId, that.tenantId)
            && Objects.equals(entityType, that.entityType)
            && Objects.equals(entityId, that.entityId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, entityType, entityId);
    }
}
