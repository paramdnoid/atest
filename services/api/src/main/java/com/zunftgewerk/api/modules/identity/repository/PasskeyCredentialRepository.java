package com.zunftgewerk.api.modules.identity.repository;

import com.zunftgewerk.api.modules.identity.entity.PasskeyCredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasskeyCredentialRepository extends JpaRepository<PasskeyCredentialEntity, UUID> {
    Optional<PasskeyCredentialEntity> findByUserIdAndCredentialId(UUID userId, String credentialId);
    List<PasskeyCredentialEntity> findByCredentialId(String credentialId);
    List<PasskeyCredentialEntity> findByUserId(UUID userId);
}
