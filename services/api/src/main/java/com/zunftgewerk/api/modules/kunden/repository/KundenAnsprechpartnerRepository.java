package com.zunftgewerk.api.modules.kunden.repository;

import com.zunftgewerk.api.modules.kunden.entity.KundenAnsprechpartnerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KundenAnsprechpartnerRepository extends JpaRepository<KundenAnsprechpartnerEntity, UUID> {
    List<KundenAnsprechpartnerEntity> findByTenantIdAndKundenIdAndDeletedAtIsNull(UUID tenantId, UUID kundenId);
    Optional<KundenAnsprechpartnerEntity> findByTenantIdAndKundenIdAndId(UUID tenantId, UUID kundenId, UUID id);
}
