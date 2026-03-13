package com.zunftgewerk.api.modules.kunden.repository;

import com.zunftgewerk.api.modules.kunden.entity.KundenObjektEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KundenObjektRepository extends JpaRepository<KundenObjektEntity, UUID> {
    List<KundenObjektEntity> findByTenantIdAndKundenIdAndDeletedAtIsNull(UUID tenantId, UUID kundenId);
    Optional<KundenObjektEntity> findByTenantIdAndKundenIdAndId(UUID tenantId, UUID kundenId, UUID id);
}
