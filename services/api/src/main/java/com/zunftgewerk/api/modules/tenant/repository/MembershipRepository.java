package com.zunftgewerk.api.modules.tenant.repository;

import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<MembershipEntity, UUID> {
    List<MembershipEntity> findByTenantId(UUID tenantId);
    List<MembershipEntity> findByUserId(UUID userId);
    List<MembershipEntity> findByTenantIdAndUserId(UUID tenantId, UUID userId);
}
