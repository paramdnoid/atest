package com.zunftgewerk.api.modules.tenant.repository;

import com.zunftgewerk.api.modules.tenant.entity.TeamInviteTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamInviteTokenRepository extends JpaRepository<TeamInviteTokenEntity, UUID> {

    Optional<TeamInviteTokenEntity> findByTokenHash(String tokenHash);

    List<TeamInviteTokenEntity> findByTenantIdAndInvitedEmail(UUID tenantId, String email);
}
