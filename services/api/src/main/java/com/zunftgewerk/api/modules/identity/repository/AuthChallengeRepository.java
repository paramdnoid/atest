package com.zunftgewerk.api.modules.identity.repository;

import com.zunftgewerk.api.modules.identity.entity.AuthChallengeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AuthChallengeRepository extends JpaRepository<AuthChallengeEntity, UUID> {
    Optional<AuthChallengeEntity> findByIdAndUsedAtIsNull(UUID id);
    void deleteByExpiresAtBefore(OffsetDateTime cutoff);
}
