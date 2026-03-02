package com.zunftgewerk.api.modules.tenant.repository;

import com.zunftgewerk.api.modules.tenant.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
}
