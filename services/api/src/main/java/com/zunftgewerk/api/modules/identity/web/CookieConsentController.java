package com.zunftgewerk.api.modules.identity.web;

import com.zunftgewerk.api.modules.identity.entity.CookieConsentEntity;
import com.zunftgewerk.api.modules.identity.repository.CookieConsentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
public class CookieConsentController {

    private static final Set<String> VALID_CONSENT_VALUES = Set.of("all", "necessary");

    private final CookieConsentRepository cookieConsentRepository;

    public CookieConsentController(CookieConsentRepository cookieConsentRepository) {
        this.cookieConsentRepository = cookieConsentRepository;
    }

    @PostMapping("/v1/consent")
    public ResponseEntity<?> recordConsent(
        @RequestBody ConsentRequest body,
        @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
        @RequestHeader(value = "User-Agent", required = false) String userAgent,
        HttpServletRequest request
    ) {
        if (body.consent() == null || !VALID_CONSENT_VALUES.contains(body.consent())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid consent value"));
        }

        if (body.visitorId() == null || body.visitorId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing visitorId"));
        }

        String ipAddress = resolveIpAddress(forwardedFor, request);

        CookieConsentEntity entity = new CookieConsentEntity();
        entity.setId(UUID.randomUUID());
        entity.setVisitorId(body.visitorId());
        entity.setConsentValue(body.consent());
        entity.setIpAddress(ipAddress);
        entity.setUserAgent(userAgent);
        entity.setCreatedAt(OffsetDateTime.now());

        cookieConsentRepository.save(entity);

        return ResponseEntity.noContent().build();
    }

    private String resolveIpAddress(String forwardedFor, HttpServletRequest request) {
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] values = forwardedFor.split(",");
            for (int i = values.length - 1; i >= 0; i--) {
                String ip = values[i].trim();
                if (!ip.isBlank()) {
                    return ip;
                }
            }
        }
        return request.getRemoteAddr();
    }

    public record ConsentRequest(String consent, String visitorId) {}
}
