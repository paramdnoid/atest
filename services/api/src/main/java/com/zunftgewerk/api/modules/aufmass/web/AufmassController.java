package com.zunftgewerk.api.modules.aufmass.web;

import com.zunftgewerk.api.modules.aufmass.service.AufmassService;
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
@RequestMapping("/v1/aufmass")
public class AufmassController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final AufmassService aufmassService;

    public AufmassController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        AufmassService aufmassService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.aufmassService = aufmassService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(value = "status", required = false) String status
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        var items = aufmassService.list(session.tenantId(), status).stream().map(aufmassService::summarize).toList();
        return ResponseEntity.ok(Map.of("items", items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(aufmassService.summarize(aufmassService.get(session.tenantId(), recordId)));
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody CreateRecordRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.create(
            session.tenantId(),
            session.userId(),
            new AufmassService.CreateRecordInput(
                body.number(),
                body.projectName(),
                body.customerName(),
                body.siteName(),
                body.createdBy(),
                body.dueDate(),
                body.status(),
                body.version(),
                body.revisionOfId()
            )
        );
        return ResponseEntity.ok(Map.of("item", aufmassService.summarize(item)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody UpdateRecordRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.update(
            session.tenantId(),
            recordId,
            new AufmassService.UpdateRecordInput(
                body.projectName(),
                body.customerName(),
                body.siteName(),
                body.createdBy(),
                body.dueDate(),
                body.status(),
                body.version(),
                body.revisionOfId()
            )
        );
        return ResponseEntity.ok(Map.of("item", aufmassService.summarize(item)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        aufmassService.delete(session.tenantId(), recordId, session.userId(), body != null ? body.reason() : "MANUAL_DELETE");
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restore(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.restore(session.tenantId(), recordId);
        return ResponseEntity.ok(Map.of("item", aufmassService.summarize(item)));
    }

    @GetMapping("/{id}/room")
    public ResponseEntity<?> listRooms(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", aufmassService.listRooms(session.tenantId(), recordId)));
    }

    @PostMapping("/{id}/room")
    public ResponseEntity<?> createRoom(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody CreateRoomRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.createRoom(
            session.tenantId(),
            recordId,
            new AufmassService.CreateRoomInput(body.building(), body.levelLabel(), body.name(), body.areaM2())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/room/{roomId}")
    public ResponseEntity<?> updateRoom(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("roomId") UUID roomId,
        @RequestBody UpdateRoomRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.updateRoom(
            session.tenantId(),
            recordId,
            roomId,
            new AufmassService.UpdateRoomInput(body.building(), body.levelLabel(), body.name(), body.areaM2())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/room/{roomId}")
    public ResponseEntity<?> deleteRoom(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("roomId") UUID roomId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        aufmassService.deleteRoom(
            session.tenantId(),
            recordId,
            roomId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/position")
    public ResponseEntity<?> listPositions(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", aufmassService.listPositions(session.tenantId(), recordId)));
    }

    @PostMapping("/{id}/position")
    public ResponseEntity<?> createPosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody CreatePositionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.createPosition(
            session.tenantId(),
            recordId,
            new AufmassService.CreatePositionInput(body.code(), body.title(), body.unit())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/position/{positionId}")
    public ResponseEntity<?> updatePosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("positionId") UUID positionId,
        @RequestBody UpdatePositionRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.updatePosition(
            session.tenantId(),
            recordId,
            positionId,
            new AufmassService.UpdatePositionInput(body.code(), body.title(), body.unit())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/position/{positionId}")
    public ResponseEntity<?> deletePosition(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("positionId") UUID positionId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        aufmassService.deletePosition(
            session.tenantId(),
            recordId,
            positionId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/measurement")
    public ResponseEntity<?> listMeasurements(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", aufmassService.listMeasurements(session.tenantId(), recordId)));
    }

    @PostMapping("/{id}/measurement")
    public ResponseEntity<?> createMeasurement(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody CreateMeasurementRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.createMeasurement(
            session.tenantId(),
            recordId,
            new AufmassService.CreateMeasurementInput(
                body.roomId(),
                body.positionId(),
                body.label(),
                body.formula(),
                body.formulaAstJson(),
                body.formulaSource(),
                body.formulaMigrationStatus(),
                body.quantity(),
                body.unit(),
                body.note(),
                body.photoCount()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/measurement/{measurementId}")
    public ResponseEntity<?> updateMeasurement(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("measurementId") UUID measurementId,
        @RequestBody UpdateMeasurementRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.updateMeasurement(
            session.tenantId(),
            recordId,
            measurementId,
            new AufmassService.UpdateMeasurementInput(
                body.roomId(),
                body.positionId(),
                body.label(),
                body.formula(),
                body.formulaAstJson(),
                body.formulaSource(),
                body.formulaMigrationStatus(),
                body.quantity(),
                body.unit(),
                body.note(),
                body.photoCount()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/measurement/{measurementId}")
    public ResponseEntity<?> deleteMeasurement(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("measurementId") UUID measurementId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        aufmassService.deleteMeasurement(
            session.tenantId(),
            recordId,
            measurementId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/mapping")
    public ResponseEntity<?> listMappings(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", aufmassService.listMappings(session.tenantId(), recordId)));
    }

    @PostMapping("/{id}/mapping")
    public ResponseEntity<?> createMapping(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @RequestBody CreateMappingRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.createMapping(
            session.tenantId(),
            recordId,
            new AufmassService.CreateMappingInput(body.positionId(), body.roomId(), body.mappedBy(), body.mappedAt())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/mapping/{mappingId}")
    public ResponseEntity<?> updateMapping(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("mappingId") UUID mappingId,
        @RequestBody UpdateMappingRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = aufmassService.updateMapping(
            session.tenantId(),
            recordId,
            mappingId,
            new AufmassService.UpdateMappingInput(body.positionId(), body.roomId(), body.mappedBy(), body.mappedAt())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/mapping/{mappingId}")
    public ResponseEntity<?> deleteMapping(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID recordId,
        @PathVariable("mappingId") UUID mappingId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        aufmassService.deleteMapping(
            session.tenantId(),
            recordId,
            mappingId,
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

    record CreateRecordRequest(
        String number,
        String projectName,
        String customerName,
        String siteName,
        String createdBy,
        OffsetDateTime dueDate,
        String status,
        Integer version,
        UUID revisionOfId
    ) {}

    record UpdateRecordRequest(
        String projectName,
        String customerName,
        String siteName,
        String createdBy,
        OffsetDateTime dueDate,
        String status,
        Integer version,
        UUID revisionOfId
    ) {}

    record CreateRoomRequest(
        String building,
        String levelLabel,
        String name,
        BigDecimal areaM2
    ) {}

    record UpdateRoomRequest(
        String building,
        String levelLabel,
        String name,
        BigDecimal areaM2
    ) {}

    record CreatePositionRequest(
        String code,
        String title,
        String unit
    ) {}

    record UpdatePositionRequest(
        String code,
        String title,
        String unit
    ) {}

    record CreateMeasurementRequest(
        UUID roomId,
        UUID positionId,
        String label,
        String formula,
        String formulaAstJson,
        String formulaSource,
        String formulaMigrationStatus,
        BigDecimal quantity,
        String unit,
        String note,
        Integer photoCount
    ) {}

    record UpdateMeasurementRequest(
        UUID roomId,
        UUID positionId,
        String label,
        String formula,
        String formulaAstJson,
        String formulaSource,
        String formulaMigrationStatus,
        BigDecimal quantity,
        String unit,
        String note,
        Integer photoCount
    ) {}

    record CreateMappingRequest(
        UUID positionId,
        UUID roomId,
        String mappedBy,
        OffsetDateTime mappedAt
    ) {}

    record UpdateMappingRequest(
        UUID positionId,
        UUID roomId,
        String mappedBy,
        OffsetDateTime mappedAt
    ) {}

    record DeleteRequest(String reason) {}
}
