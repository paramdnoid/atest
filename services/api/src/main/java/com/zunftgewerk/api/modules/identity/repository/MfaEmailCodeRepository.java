package com.zunftgewerk.api.modules.identity.repository;

import com.zunftgewerk.api.modules.identity.entity.MfaEmailCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MfaEmailCodeRepository extends JpaRepository<MfaEmailCodeEntity, UUID> {

    Optional<MfaEmailCodeEntity> findByCodeHash(String codeHash);

    List<MfaEmailCodeEntity> findByUserIdAndUsedAtIsNull(UUID userId);
}
