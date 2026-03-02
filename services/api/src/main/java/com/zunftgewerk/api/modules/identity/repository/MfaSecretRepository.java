package com.zunftgewerk.api.modules.identity.repository;

import com.zunftgewerk.api.modules.identity.entity.MfaSecretEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MfaSecretRepository extends JpaRepository<MfaSecretEntity, UUID> {
}
