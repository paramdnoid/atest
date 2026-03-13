package com.zunftgewerk.api.modules.kunden.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.kunden.service.KundenService;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/kunden")
public class KundenController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final KundenService kundenService;

    public KundenController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        KundenService kundenService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.kundenService = kundenService;
    }

    @GetMapping
    public ResponseEntity<?> listKunden(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(value = "q", required = false) String query,
        @RequestParam(value = "status", required = false) String status
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        var kunden = kundenService.listKunden(session.tenantId(), query, status)
            .stream()
            .map(kundenService::summarizeKunde)
            .toList();
        return ResponseEntity.ok(Map.of("items", kunden));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getKunde(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        var kunde = kundenService.getKunde(session.tenantId(), kundenId);
        return ResponseEntity.ok(kundenService.summarizeKunde(kunde));
    }

    @PostMapping
    public ResponseEntity<?> createKunde(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody CreateKundeRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var created = kundenService.createKunde(
            session.tenantId(),
            session.userId(),
            new KundenService.CreateKundeInput(
                body.number(),
                body.name(),
                body.branche(),
                body.segment(),
                body.status(),
                body.ownerUserId(),
                body.score(),
                body.consentState(),
                body.retentionClass(),
                body.region(),
                body.nextFollowUpAt()
            )
        );
        return ResponseEntity.ok(Map.of("item", kundenService.summarizeKunde(created)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateKunde(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @RequestBody UpdateKundeRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var updated = kundenService.updateKunde(
            session.tenantId(),
            kundenId,
            new KundenService.UpdateKundeInput(
                body.name(),
                body.branche(),
                body.segment(),
                body.status(),
                body.ownerUserId(),
                body.score(),
                body.consentState(),
                body.retentionClass(),
                body.region(),
                body.nextFollowUpAt()
            )
        );
        return ResponseEntity.ok(Map.of("item", kundenService.summarizeKunde(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKunde(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        kundenService.softDeleteKunde(
            session.tenantId(),
            kundenId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreKunde(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var restored = kundenService.restoreKunde(session.tenantId(), kundenId);
        return ResponseEntity.ok(Map.of("item", kundenService.summarizeKunde(restored)));
    }

    @GetMapping("/{id}/objekte")
    public ResponseEntity<?> listObjekte(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(Map.of("items", kundenService.listObjekte(session.tenantId(), kundenId)));
    }

    @PostMapping("/{id}/objekte")
    public ResponseEntity<?> createObjekt(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @RequestBody CreateObjektRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.createObjekt(
            session.tenantId(),
            kundenId,
            new KundenService.CreateObjektInput(
                body.name(),
                body.objektTyp(),
                body.adresse(),
                body.region(),
                body.serviceIntervalDays(),
                body.zugangshinweise(),
                body.riskClass(),
                body.status()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/objekte/{objektId}")
    public ResponseEntity<?> updateObjekt(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("objektId") UUID objektId,
        @RequestBody UpdateObjektRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.updateObjekt(
            session.tenantId(),
            kundenId,
            objektId,
            new KundenService.UpdateObjektInput(
                body.name(),
                body.objektTyp(),
                body.adresse(),
                body.region(),
                body.serviceIntervalDays(),
                body.zugangshinweise(),
                body.riskClass(),
                body.status()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/objekte/{objektId}")
    public ResponseEntity<?> deleteObjekt(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("objektId") UUID objektId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        kundenService.deleteObjekt(
            session.tenantId(),
            kundenId,
            objektId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/ansprechpartner")
    public ResponseEntity<?> listAnsprechpartner(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(Map.of("items", kundenService.listAnsprechpartner(session.tenantId(), kundenId)));
    }

    @PostMapping("/{id}/ansprechpartner")
    public ResponseEntity<?> createAnsprechpartner(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @RequestBody CreateAnsprechpartnerRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.createAnsprechpartner(
            session.tenantId(),
            kundenId,
            new KundenService.CreateAnsprechpartnerInput(
                body.name(),
                body.rolle(),
                body.email(),
                body.telefon(),
                body.bevorzugterKanal(),
                body.dsgvoConsent(),
                body.status(),
                body.isPrimary(),
                body.lastContactAt()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/ansprechpartner/{ansprechpartnerId}")
    public ResponseEntity<?> updateAnsprechpartner(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("ansprechpartnerId") UUID ansprechpartnerId,
        @RequestBody UpdateAnsprechpartnerRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.updateAnsprechpartner(
            session.tenantId(),
            kundenId,
            ansprechpartnerId,
            new KundenService.UpdateAnsprechpartnerInput(
                body.name(),
                body.rolle(),
                body.email(),
                body.telefon(),
                body.bevorzugterKanal(),
                body.dsgvoConsent(),
                body.status(),
                body.isPrimary(),
                body.lastContactAt()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/ansprechpartner/{ansprechpartnerId}")
    public ResponseEntity<?> deleteAnsprechpartner(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("ansprechpartnerId") UUID ansprechpartnerId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        kundenService.deleteAnsprechpartner(
            session.tenantId(),
            kundenId,
            ansprechpartnerId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/reminder")
    public ResponseEntity<?> listReminder(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(Map.of("items", kundenService.listReminder(session.tenantId(), kundenId)));
    }

    @PostMapping("/{id}/reminder")
    public ResponseEntity<?> createReminder(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @RequestBody CreateReminderRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.createReminder(
            session.tenantId(),
            kundenId,
            new KundenService.CreateReminderInput(
                body.scope(),
                body.targetId(),
                body.title(),
                body.priority(),
                body.startAt(),
                body.dueAt(),
                body.breachState()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/reminder/{reminderId}")
    public ResponseEntity<?> updateReminder(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("reminderId") UUID reminderId,
        @RequestBody UpdateReminderRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        var item = kundenService.updateReminder(
            session.tenantId(),
            kundenId,
            reminderId,
            new KundenService.UpdateReminderInput(
                body.scope(),
                body.targetId(),
                body.title(),
                body.priority(),
                body.startAt(),
                body.dueAt(),
                body.breachState()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/reminder/{reminderId}")
    public ResponseEntity<?> deleteReminder(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID kundenId,
        @PathVariable("reminderId") UUID reminderId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return unauthorized();
        }
        if (!canWrite(session)) {
            return forbidden();
        }
        kundenService.deleteReminder(
            session.tenantId(),
            kundenId,
            reminderId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    private RefreshTokenService.PeekedSession resolveSession(String cookieHeader) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;
        return refreshTokenService.peekUser(rawRefreshToken).orElse(null);
    }

    private String extractCookie(String cookieHeader, String cookieName) {
        for (String part : cookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring(cookieName.length() + 1);
            }
        }
        return null;
    }

    private boolean canWrite(RefreshTokenService.PeekedSession session) {
        List<String> roleKeys = membershipRepository.findByTenantIdAndUserId(session.tenantId(), session.userId())
            .stream()
            .map(membership -> membership.getRoleKey() != null ? membership.getRoleKey().toLowerCase() : "")
            .toList();
        return roleKeys.contains("owner") || roleKeys.contains("admin") || roleKeys.contains("dispo");
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
    }

    record CreateKundeRequest(
        String number,
        String name,
        String branche,
        String segment,
        String status,
        UUID ownerUserId,
        Integer score,
        String consentState,
        String retentionClass,
        String region,
        OffsetDateTime nextFollowUpAt
    ) {}

    record UpdateKundeRequest(
        String name,
        String branche,
        String segment,
        String status,
        UUID ownerUserId,
        Integer score,
        String consentState,
        String retentionClass,
        String region,
        OffsetDateTime nextFollowUpAt
    ) {}

    record CreateObjektRequest(
        String name,
        String objektTyp,
        String adresse,
        String region,
        Integer serviceIntervalDays,
        String zugangshinweise,
        String riskClass,
        String status
    ) {}

    record UpdateObjektRequest(
        String name,
        String objektTyp,
        String adresse,
        String region,
        Integer serviceIntervalDays,
        String zugangshinweise,
        String riskClass,
        String status
    ) {}

    record CreateAnsprechpartnerRequest(
        String name,
        String rolle,
        String email,
        String telefon,
        String bevorzugterKanal,
        String dsgvoConsent,
        String status,
        Boolean isPrimary,
        OffsetDateTime lastContactAt
    ) {}

    record UpdateAnsprechpartnerRequest(
        String name,
        String rolle,
        String email,
        String telefon,
        String bevorzugterKanal,
        String dsgvoConsent,
        String status,
        Boolean isPrimary,
        OffsetDateTime lastContactAt
    ) {}

    record CreateReminderRequest(
        String scope,
        UUID targetId,
        String title,
        String priority,
        OffsetDateTime startAt,
        OffsetDateTime dueAt,
        String breachState
    ) {}

    record UpdateReminderRequest(
        String scope,
        UUID targetId,
        String title,
        String priority,
        OffsetDateTime startAt,
        OffsetDateTime dueAt,
        String breachState
    ) {}

    record DeleteRequest(String reason) {}
}
