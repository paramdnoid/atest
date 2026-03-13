package com.zunftgewerk.api.modules.abnahmen.web;

import com.zunftgewerk.api.modules.abnahmen.service.AbnahmeService;
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

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/abnahmen")
public class AbnahmeController {

    private final RefreshTokenService refreshTokenService;
    private final MembershipRepository membershipRepository;
    private final AbnahmeService abnahmeService;

    public AbnahmeController(
        RefreshTokenService refreshTokenService,
        MembershipRepository membershipRepository,
        AbnahmeService abnahmeService
    ) {
        this.refreshTokenService = refreshTokenService;
        this.membershipRepository = membershipRepository;
        this.abnahmeService = abnahmeService;
    }

    @GetMapping
    public ResponseEntity<?> list(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(value = "status", required = false) String status
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        var items = abnahmeService.list(session.tenantId(), status).stream().map(abnahmeService::summarize).toList();
        return ResponseEntity.ok(Map.of("items", items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(abnahmeService.summarize(abnahmeService.get(session.tenantId(), abnahmeId)));
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody CreateAbnahmeRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.create(
            session.tenantId(),
            session.userId(),
            new AbnahmeService.CreateRecordInput(
                body.number(),
                body.projectName(),
                body.customerName(),
                body.siteName(),
                body.tradeLabel(),
                body.createdBy(),
                body.status(),
                body.nextInspectionDate(),
                body.isOverdue()
            )
        );
        return ResponseEntity.ok(Map.of("item", abnahmeService.summarize(item)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody UpdateAbnahmeRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.update(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.UpdateRecordInput(
                body.projectName(),
                body.customerName(),
                body.siteName(),
                body.tradeLabel(),
                body.createdBy(),
                body.status(),
                body.nextInspectionDate(),
                body.isOverdue()
            )
        );
        return ResponseEntity.ok(Map.of("item", abnahmeService.summarize(item)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.delete(session.tenantId(), abnahmeId, session.userId(), body != null ? body.reason() : "MANUAL_DELETE");
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restore(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.restore(session.tenantId(), abnahmeId);
        return ResponseEntity.ok(Map.of("item", abnahmeService.summarize(item)));
    }

    @GetMapping("/{id}/protocol")
    public ResponseEntity<?> getProtocol(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        Map<String, Object> response = new HashMap<>();
        response.put("item", abnahmeService.getProtocol(session.tenantId(), abnahmeId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/protocol")
    public ResponseEntity<?> upsertProtocolCreate(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody UpsertProtocolRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.upsertProtocol(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.UpsertProtocolInput(
                body.acceptanceType(),
                body.inspectionDate(),
                body.appointmentDate(),
                body.place(),
                body.reservationText(),
                body.signoffStatus(),
                body.signedAt()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/protocol")
    public ResponseEntity<?> upsertProtocolUpdate(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody UpsertProtocolRequest body
    ) {
        return upsertProtocolCreate(cookieHeader, abnahmeId, body);
    }

    @DeleteMapping("/{id}/protocol")
    public ResponseEntity<?> deleteProtocol(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.deleteProtocol(session.tenantId(), abnahmeId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/participant")
    public ResponseEntity<?> listParticipants(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", abnahmeService.listParticipants(session.tenantId(), abnahmeId)));
    }

    @PostMapping("/{id}/participant")
    public ResponseEntity<?> createParticipant(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody CreateParticipantRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.createParticipant(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.CreateParticipantInput(body.name(), body.roleLabel(), body.company(), body.present())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/participant/{participantId}")
    public ResponseEntity<?> updateParticipant(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("participantId") UUID participantId,
        @RequestBody UpdateParticipantRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.updateParticipant(
            session.tenantId(),
            abnahmeId,
            participantId,
            new AbnahmeService.UpdateParticipantInput(body.name(), body.roleLabel(), body.company(), body.present())
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/participant/{participantId}")
    public ResponseEntity<?> deleteParticipant(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("participantId") UUID participantId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.deleteParticipant(session.tenantId(), abnahmeId, participantId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/defect")
    public ResponseEntity<?> listDefects(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", abnahmeService.listDefects(session.tenantId(), abnahmeId)));
    }

    @PostMapping("/{id}/defect")
    public ResponseEntity<?> createDefect(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody CreateDefectRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.createDefect(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.CreateDefectInput(
                body.ref(),
                body.title(),
                body.description(),
                body.category(),
                body.severity(),
                body.status(),
                body.locationText(),
                body.roomLabel(),
                body.assignedTo(),
                body.dueDate(),
                body.reopenCount(),
                body.resolutionNote()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/defect/{defectId}")
    public ResponseEntity<?> updateDefect(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("defectId") UUID defectId,
        @RequestBody UpdateDefectRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.updateDefect(
            session.tenantId(),
            abnahmeId,
            defectId,
            new AbnahmeService.UpdateDefectInput(
                body.ref(),
                body.title(),
                body.description(),
                body.category(),
                body.severity(),
                body.status(),
                body.locationText(),
                body.roomLabel(),
                body.assignedTo(),
                body.dueDate(),
                body.reopenCount(),
                body.resolutionNote()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/defect/{defectId}")
    public ResponseEntity<?> deleteDefect(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("defectId") UUID defectId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.deleteDefect(
            session.tenantId(),
            abnahmeId,
            defectId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/rework")
    public ResponseEntity<?> listReworks(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", abnahmeService.listReworks(session.tenantId(), abnahmeId)));
    }

    @PostMapping("/{id}/rework")
    public ResponseEntity<?> createRework(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody CreateReworkRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.createRework(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.CreateReworkInput(
                body.defectId(),
                body.status(),
                body.owner(),
                body.startedAt(),
                body.finishedAt(),
                body.approvedAt(),
                body.notesJson()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/rework/{reworkId}")
    public ResponseEntity<?> updateRework(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("reworkId") UUID reworkId,
        @RequestBody UpdateReworkRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.updateRework(
            session.tenantId(),
            abnahmeId,
            reworkId,
            new AbnahmeService.UpdateReworkInput(
                body.defectId(),
                body.status(),
                body.owner(),
                body.startedAt(),
                body.finishedAt(),
                body.approvedAt(),
                body.notesJson()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/rework/{reworkId}")
    public ResponseEntity<?> deleteRework(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("reworkId") UUID reworkId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.deleteRework(
            session.tenantId(),
            abnahmeId,
            reworkId,
            session.userId(),
            body != null ? body.reason() : "MANUAL_DELETE"
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<?> listEvidence(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        return ResponseEntity.ok(Map.of("items", abnahmeService.listEvidence(session.tenantId(), abnahmeId)));
    }

    @PostMapping("/{id}/evidence")
    public ResponseEntity<?> createEvidence(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @RequestBody CreateEvidenceRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.createEvidence(
            session.tenantId(),
            abnahmeId,
            new AbnahmeService.CreateEvidenceInput(
                body.defectId(),
                body.label(),
                body.url(),
                body.createdBy(),
                body.hasPeople(),
                body.hasLicensePlate(),
                body.redacted(),
                body.legalBasis(),
                body.geoLat(),
                body.geoLng()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @PatchMapping("/{id}/evidence/{evidenceId}")
    public ResponseEntity<?> updateEvidence(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("evidenceId") UUID evidenceId,
        @RequestBody UpdateEvidenceRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        var item = abnahmeService.updateEvidence(
            session.tenantId(),
            abnahmeId,
            evidenceId,
            new AbnahmeService.UpdateEvidenceInput(
                body.defectId(),
                body.label(),
                body.url(),
                body.createdBy(),
                body.hasPeople(),
                body.hasLicensePlate(),
                body.redacted(),
                body.legalBasis(),
                body.geoLat(),
                body.geoLng()
            )
        );
        return ResponseEntity.ok(Map.of("item", item));
    }

    @DeleteMapping("/{id}/evidence/{evidenceId}")
    public ResponseEntity<?> deleteEvidence(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @PathVariable("id") UUID abnahmeId,
        @PathVariable("evidenceId") UUID evidenceId,
        @RequestBody(required = false) DeleteRequest body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) return unauthorized();
        if (!canWrite(session)) return forbidden();
        abnahmeService.deleteEvidence(
            session.tenantId(),
            abnahmeId,
            evidenceId,
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

    record CreateAbnahmeRequest(
        String number,
        String projectName,
        String customerName,
        String siteName,
        String tradeLabel,
        String createdBy,
        String status,
        OffsetDateTime nextInspectionDate,
        Boolean isOverdue
    ) {}

    record UpdateAbnahmeRequest(
        String projectName,
        String customerName,
        String siteName,
        String tradeLabel,
        String createdBy,
        String status,
        OffsetDateTime nextInspectionDate,
        Boolean isOverdue
    ) {}

    record UpsertProtocolRequest(
        String acceptanceType,
        OffsetDateTime inspectionDate,
        OffsetDateTime appointmentDate,
        String place,
        String reservationText,
        String signoffStatus,
        OffsetDateTime signedAt
    ) {}

    record CreateParticipantRequest(
        String name,
        String roleLabel,
        String company,
        Boolean present
    ) {}

    record UpdateParticipantRequest(
        String name,
        String roleLabel,
        String company,
        Boolean present
    ) {}

    record CreateDefectRequest(
        String ref,
        String title,
        String description,
        String category,
        String severity,
        String status,
        String locationText,
        String roomLabel,
        String assignedTo,
        OffsetDateTime dueDate,
        Integer reopenCount,
        String resolutionNote
    ) {}

    record UpdateDefectRequest(
        String ref,
        String title,
        String description,
        String category,
        String severity,
        String status,
        String locationText,
        String roomLabel,
        String assignedTo,
        OffsetDateTime dueDate,
        Integer reopenCount,
        String resolutionNote
    ) {}

    record CreateReworkRequest(
        UUID defectId,
        String status,
        String owner,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt,
        OffsetDateTime approvedAt,
        String notesJson
    ) {}

    record UpdateReworkRequest(
        UUID defectId,
        String status,
        String owner,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt,
        OffsetDateTime approvedAt,
        String notesJson
    ) {}

    record CreateEvidenceRequest(
        UUID defectId,
        String label,
        String url,
        String createdBy,
        Boolean hasPeople,
        Boolean hasLicensePlate,
        Boolean redacted,
        String legalBasis,
        Double geoLat,
        Double geoLng
    ) {}

    record UpdateEvidenceRequest(
        UUID defectId,
        String label,
        String url,
        String createdBy,
        Boolean hasPeople,
        Boolean hasLicensePlate,
        Boolean redacted,
        String legalBasis,
        Double geoLat,
        Double geoLng
    ) {}

    record DeleteRequest(String reason) {}
}
