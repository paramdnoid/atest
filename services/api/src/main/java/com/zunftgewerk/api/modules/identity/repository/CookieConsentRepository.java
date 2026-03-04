package com.zunftgewerk.api.modules.identity.repository;

import com.zunftgewerk.api.modules.identity.entity.CookieConsentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CookieConsentRepository extends JpaRepository<CookieConsentEntity, UUID> {
    List<CookieConsentEntity> findByVisitorId(String visitorId);
}
