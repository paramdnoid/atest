package com.zunftgewerk.api.modules.angebote.web;

import com.zunftgewerk.api.modules.angebote.service.AngebotService;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/angebote")
public class AngebotController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final AngebotService angebotService;

    public AngebotController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        AngebotService angebotService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.angebotService = angebotService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(value = "status", required = false) String status
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        var items = angebotService.list(session.tenantId(), status).stream().map(angebotService::summarize).toList();
        return ResponseEntity.ok(Map.of("items", items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(angebotService.summarize(angebotService.get(session.tenantId(), angebotId)));
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody CreateAngebotRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.create(
            session.tenantId(),
            session.userId(),
            new AngebotService.CreateAngebotInput(
                body.number(),
                body.customerName(),
                body.projectName(),
                body.tradeLabel(),
                body.priority(),
                body.ownerUserId(),
                body.status(),
                body.validUntil(),
                body.note(),
                body.selectedOptionId(),
                body.convertedOrderNumber()
            )
        );
        return ResponseEntity.ok(Map.of("item", angebotService.summarize(item)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @RequestBody UpdateAngebotRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.update(
            session.tenantId(),
            angebotId,
            new AngebotService.UpdateAngebotInput(
                body.customerName(),
                body.projectName(),
                body.tradeLabel(),
                body.priority(),
                body.ownerUserId(),
                body.status(),
                body.validUntil(),
                body.note(),
                body.selectedOptionId(),
                body.convertedOrderNumber()
            )
        );
        return ResponseEntity.ok(Map.of("item", angebotService.summarize(item)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        angebotService.delete(session.tenantId(), angebotId, session.userId(), body != null ? body.reason() : "MANUAL_DELETE");
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restore(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.restore(session.tenantId(), angebotId);
        return ResponseEntity.ok(Map.of("item", angebotService.summarize(item)));
    }

    @GetMapping("/{id}/positionen")
    public ResponseEntity<?> listPositionen(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", angebotService.listPositionen(session.tenantId(), angebotId)));
    }

    @PostMapping("/{id}/positionen")
    public ResponseEntity<?> createPosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @RequestBody CreatePositionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.createPosition(
            session.tenantId(),
            angebotId,
            new AngebotService.CreatePositionInput(
                body.title(),
                body.description(),
                body.unit(),
                body.quantity(),
                body.unitPriceNet(),
                body.materialCostNet(),
                body.laborCostNet(),
                body.discountPercent(),
                body.optional(),
                body.templateKey()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/positionen/{positionId}")
    public ResponseEntity<?> updatePosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @PathVariable("positionId") UUID positionId,
        @RequestBody UpdatePositionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.updatePosition(
            session.tenantId(),
            angebotId,
            positionId,
            new AngebotService.UpdatePositionInput(
                body.title(),
                body.description(),
                body.unit(),
                body.quantity(),
                body.unitPriceNet(),
                body.materialCostNet(),
                body.laborCostNet(),
                body.discountPercent(),
                body.optional(),
                body.templateKey()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/positionen/{positionId}")
    public ResponseEntity<?> deletePosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @PathVariable("positionId") UUID positionId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        angebotService.deletePosition(
            session.tenantId(),
            angebotId,
            positionId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/optionen")
    public ResponseEntity<?> listOptionen(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", angebotService.listOptionen(session.tenantId(), angebotId)));
    }

    @PostMapping("/{id}/optionen")
    public ResponseEntity<?> createOption(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @RequestBody CreateOptionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.createOption(
            session.tenantId(),
            angebotId,
            new AngebotService.CreateOptionInput(
                body.tier(),
                body.label(),
                body.description(),
                body.includedPositionIdsJson(),
                body.recommended()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/optionen/{optionId}")
    public ResponseEntity<?> updateOption(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @PathVariable("optionId") UUID optionId,
        @RequestBody UpdateOptionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = angebotService.updateOption(
            session.tenantId(),
            angebotId,
            optionId,
            new AngebotService.UpdateOptionInput(
                body.tier(),
                body.label(),
                body.description(),
                body.includedPositionIdsJson(),
                body.recommended()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/optionen/{optionId}")
    public ResponseEntity<?> deleteOption(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID angebotId,
        @PathVariable("optionId") UUID optionId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        angebotService.deleteOption(
            session.tenantId(),
            angebotId,
            optionId,
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

    record CreateAngebotRequest(
        String number,
        String customerName,
        String projectName,
        String tradeLabel,
        String priority,
        UUID ownerUserId,
        String status,
        OffsetDateTime validUntil,
        String note,
        UUID selectedOptionId,
        String convertedOrderNumber
    ) {}

    record UpdateAngebotRequest(
        String customerName,
        String projectName,
        String tradeLabel,
        String priority,
        UUID ownerUserId,
        String status,
        OffsetDateTime validUntil,
        String note,
        UUID selectedOptionId,
        String convertedOrderNumber
    ) {}

    record CreatePositionRequest(
        String title,
        String description,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPriceNet,
        BigDecimal materialCostNet,
        BigDecimal laborCostNet,
        BigDecimal discountPercent,
        Boolean optional,
        String templateKey
    ) {}

    record UpdatePositionRequest(
        String title,
        String description,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPriceNet,
        BigDecimal materialCostNet,
        BigDecimal laborCostNet,
        BigDecimal discountPercent,
        Boolean optional,
        String templateKey
    ) {}

    record CreateOptionRequest(
        String tier,
        String label,
        String description,
        String includedPositionIdsJson,
        Boolean recommended
    ) {}

    record UpdateOptionRequest(
        String tier,
        String label,
        String description,
        String includedPositionIdsJson,
        Boolean recommended
    ) {}

    record DeleteRequest(String reason) {}
}
