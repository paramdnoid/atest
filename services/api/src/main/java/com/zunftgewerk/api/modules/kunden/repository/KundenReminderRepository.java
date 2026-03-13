package com.zunftgewerk.api.modules.kunden.repository;

import com.zunftgewerk.api.modules.kunden.entity.KundenReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KundenReminderRepository extends JpaRepository<KundenReminderEntity, UUID> {
    List<KundenReminderEntity> findByTenantIdAndKundenIdAndDeletedAtIsNull(UUID tenantId, UUID kundenId);
    Optional<KundenReminderEntity> findByTenantIdAndKundenIdAndId(UUID tenantId, UUID kundenId, UUID id);
}
