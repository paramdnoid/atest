package com.zunftgewerk.api.modules.sync.repository;

import com.zunftgewerk.api.modules.sync.entity.EntitySyncStateEntity;
import com.zunftgewerk.api.modules.sync.entity.EntitySyncStateId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntitySyncStateRepository extends JpaRepository<EntitySyncStateEntity, EntitySyncStateId> {
}
