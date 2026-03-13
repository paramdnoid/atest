package com.zunftgewerk.api.modules.abnahmen.service;

import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeDefectEntity;
import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeEvidenceEntity;
import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeParticipantEntity;
import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeProtocolEntity;
import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeRecordEntity;
import com.zunftgewerk.api.modules.abnahmen.entity.AbnahmeReworkEntity;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeDefectRepository;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeEvidenceRepository;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeParticipantRepository;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeProtocolRepository;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeRecordRepository;
import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeReworkRepository;
import com.zunftgewerk.api.shared.audit.DomainMutationAuditLogger;
import com.zunftgewerk.api.shared.monitoring.DomainMutationMetrics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AbnahmeService {

    private final AbnahmeRecordRepository recordRepository;
    private final AbnahmeProtocolRepository protocolRepository;
    private final AbnahmeParticipantRepository participantRepository;
    private final AbnahmeDefectRepository defectRepository;
    private final AbnahmeReworkRepository reworkRepository;
    private final AbnahmeEvidenceRepository evidenceRepository;
    private final DomainMutationMetrics domainMutationMetrics;
    private final DomainMutationAuditLogger domainMutationAuditLogger;

    public AbnahmeService(
        AbnahmeRecordRepository recordRepository,
        AbnahmeProtocolRepository protocolRepository,
        AbnahmeParticipantRepository participantRepository,
        AbnahmeDefectRepository defectRepository,
        AbnahmeReworkRepository reworkRepository,
        AbnahmeEvidenceRepository evidenceRepository,
        DomainMutationMetrics domainMutationMetrics,
        DomainMutationAuditLogger domainMutationAuditLogger
    ) {
        this.recordRepository = recordRepository;
        this.protocolRepository = protocolRepository;
        this.participantRepository = participantRepository;
        this.defectRepository = defectRepository;
        this.reworkRepository = reworkRepository;
        this.evidenceRepository = evidenceRepository;
        this.domainMutationMetrics = domainMutationMetrics;
        this.domainMutationAuditLogger = domainMutationAuditLogger;
    }

    public List<AbnahmeRecordEntity> list(UUID tenantId, String status) {
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        return recordRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(r -> normalizedStatus == null || normalizedStatus.isBlank() || normalizedStatus.equals(r.getStatus()))
            .sorted(Comparator.comparing(AbnahmeRecordEntity::getUpdatedAt).reversed())
            .toList();
    }

    public AbnahmeRecordEntity get(UUID tenantId, UUID abnahmeId) {
        return requireRecord(tenantId, abnahmeId);
    }

    @Transactional
    public AbnahmeRecordEntity create(UUID tenantId, UUID actorUserId, CreateRecordInput input) {
        String number = requireText(input.number(), "number");
        if (recordRepository.existsByTenantIdAndNumber(tenantId, number)) {
            throw new IllegalArgumentException("Abnahmenummer existiert bereits.");
        }
        OffsetDateTime now = OffsetDateTime.now();
        AbnahmeRecordEntity entity = new AbnahmeRecordEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setNumber(number);
        entity.setProjectName(requireText(input.projectName(), "projectName"));
        entity.setCustomerName(requireText(input.customerName(), "customerName"));
        entity.setSiteName(requireText(input.siteName(), "siteName"));
        entity.setTradeLabel(requireText(input.tradeLabel(), "tradeLabel"));
        entity.setCreatedBy(defaultText(input.createdBy(), actorUserId.toString()));
        entity.setStatus(defaultText(input.status(), "DRAFT").toUpperCase(Locale.ROOT));
        entity.setNextInspectionDate(input.nextInspectionDate());
        entity.setOverdue(Boolean.TRUE.equals(input.overdue()));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        AbnahmeRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordCreate("abnahmen");
        domainMutationAuditLogger.recordMutation("abnahmen", "create", tenantId, actorUserId, saved.getId());
        return saved;
    }

    @Transactional
    public AbnahmeRecordEntity update(UUID tenantId, UUID abnahmeId, UpdateRecordInput input) {
        AbnahmeRecordEntity entity = requireRecord(tenantId, abnahmeId);
        if (input.projectName() != null && !input.projectName().isBlank()) {
            entity.setProjectName(input.projectName().trim());
        }
        if (input.customerName() != null && !input.customerName().isBlank()) {
            entity.setCustomerName(input.customerName().trim());
        }
        if (input.siteName() != null && !input.siteName().isBlank()) {
            entity.setSiteName(input.siteName().trim());
        }
        if (input.tradeLabel() != null && !input.tradeLabel().isBlank()) {
            entity.setTradeLabel(input.tradeLabel().trim());
        }
        if (input.createdBy() != null && !input.createdBy().isBlank()) {
            entity.setCreatedBy(input.createdBy().trim());
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        if (input.nextInspectionDate() != null) {
            entity.setNextInspectionDate(input.nextInspectionDate());
        }
        if (input.overdue() != null) {
            entity.setOverdue(input.overdue());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        AbnahmeRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordUpdate("abnahmen");
        return saved;
    }

    @Transactional
    public void delete(UUID tenantId, UUID abnahmeId, UUID actorUserId, String reason) {
        AbnahmeRecordEntity entity = requireRecord(tenantId, abnahmeId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        AbnahmeRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordDelete("abnahmen");
        domainMutationAuditLogger.recordMutation("abnahmen", "delete", tenantId, actorUserId, saved.getId());
    }

    @Transactional
    public AbnahmeRecordEntity restore(UUID tenantId, UUID abnahmeId) {
        AbnahmeRecordEntity entity = recordRepository.findByTenantIdAndId(tenantId, abnahmeId)
            .orElseThrow(() -> new IllegalArgumentException("Abnahme nicht gefunden."));
        entity.setDeletedAt(null);
        entity.setDeletedBy(null);
        entity.setDeleteReason(null);
        entity.setUpdatedAt(OffsetDateTime.now());
        AbnahmeRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordRestore("abnahmen");
        return saved;
    }

    public AbnahmeProtocolEntity getProtocol(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        return protocolRepository.findByTenantIdAndAbnahmeId(tenantId, abnahmeId).orElse(null);
    }

    @Transactional
    public AbnahmeProtocolEntity upsertProtocol(UUID tenantId, UUID abnahmeId, UpsertProtocolInput input) {
        requireRecord(tenantId, abnahmeId);
        OffsetDateTime now = OffsetDateTime.now();
        AbnahmeProtocolEntity entity = protocolRepository.findByTenantIdAndAbnahmeId(tenantId, abnahmeId).orElse(null);
        if (entity == null) {
            entity = new AbnahmeProtocolEntity();
            entity.setId(UUID.randomUUID());
            entity.setTenantId(tenantId);
            entity.setAbnahmeId(abnahmeId);
            entity.setAcceptanceType(defaultText(input.acceptanceType(), "TEILABNAHME"));
            entity.setSignoffStatus(defaultText(input.signoffStatus(), "unsigned"));
            entity.setCreatedAt(now);
        } else {
            if (input.acceptanceType() != null && !input.acceptanceType().isBlank()) {
                entity.setAcceptanceType(input.acceptanceType().trim());
            }
            if (input.signoffStatus() != null && !input.signoffStatus().isBlank()) {
                entity.setSignoffStatus(input.signoffStatus().trim());
            }
        }
        if (input.inspectionDate() != null) {
            entity.setInspectionDate(input.inspectionDate());
        }
        if (input.appointmentDate() != null) {
            entity.setAppointmentDate(input.appointmentDate());
        }
        if (input.place() != null) {
            entity.setPlace(input.place().trim());
        }
        if (input.reservationText() != null) {
            entity.setReservationText(input.reservationText().trim());
        }
        if (input.signedAt() != null) {
            entity.setSignedAt(input.signedAt());
        }
        entity.setUpdatedAt(now);
        return protocolRepository.save(entity);
    }

    @Transactional
    public void deleteProtocol(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        AbnahmeProtocolEntity entity = protocolRepository.findByTenantIdAndAbnahmeId(tenantId, abnahmeId)
            .orElseThrow(() -> new IllegalArgumentException("Protokoll nicht gefunden."));
        protocolRepository.delete(entity);
    }

    public List<AbnahmeParticipantEntity> listParticipants(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        return participantRepository.findByTenantIdAndAbnahmeId(tenantId, abnahmeId);
    }

    @Transactional
    public AbnahmeParticipantEntity createParticipant(UUID tenantId, UUID abnahmeId, CreateParticipantInput input) {
        requireRecord(tenantId, abnahmeId);
        AbnahmeParticipantEntity entity = new AbnahmeParticipantEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setAbnahmeId(abnahmeId);
        entity.setName(requireText(input.name(), "name"));
        entity.setRoleLabel(requireText(input.roleLabel(), "roleLabel"));
        entity.setCompany(input.company());
        entity.setPresent(Boolean.TRUE.equals(input.present()));
        entity.setCreatedAt(OffsetDateTime.now());
        return participantRepository.save(entity);
    }

    @Transactional
    public AbnahmeParticipantEntity updateParticipant(UUID tenantId, UUID abnahmeId, UUID participantId, UpdateParticipantInput input) {
        AbnahmeParticipantEntity entity = requireParticipant(tenantId, abnahmeId, participantId);
        if (input.name() != null && !input.name().isBlank()) {
            entity.setName(input.name().trim());
        }
        if (input.roleLabel() != null && !input.roleLabel().isBlank()) {
            entity.setRoleLabel(input.roleLabel().trim());
        }
        if (input.company() != null) {
            entity.setCompany(input.company().trim());
        }
        if (input.present() != null) {
            entity.setPresent(input.present());
        }
        return participantRepository.save(entity);
    }

    @Transactional
    public void deleteParticipant(UUID tenantId, UUID abnahmeId, UUID participantId) {
        AbnahmeParticipantEntity entity = requireParticipant(tenantId, abnahmeId, participantId);
        participantRepository.delete(entity);
    }

    public List<AbnahmeDefectEntity> listDefects(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        return defectRepository.findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(tenantId, abnahmeId);
    }

    @Transactional
    public AbnahmeDefectEntity createDefect(UUID tenantId, UUID abnahmeId, CreateDefectInput input) {
        requireRecord(tenantId, abnahmeId);
        OffsetDateTime now = OffsetDateTime.now();
        AbnahmeDefectEntity entity = new AbnahmeDefectEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setAbnahmeId(abnahmeId);
        entity.setRef(requireText(input.ref(), "ref"));
        entity.setTitle(requireText(input.title(), "title"));
        entity.setDescription(requireText(input.description(), "description"));
        entity.setCategory(defaultText(input.category(), "GENERAL"));
        entity.setSeverity(defaultText(input.severity(), "MEDIUM"));
        entity.setStatus(defaultText(input.status(), "OPEN"));
        entity.setLocationText(requireText(input.locationText(), "locationText"));
        entity.setRoomLabel(input.roomLabel());
        entity.setAssignedTo(input.assignedTo());
        entity.setDueDate(input.dueDate());
        entity.setReopenCount(input.reopenCount() != null ? input.reopenCount() : 0);
        entity.setResolutionNote(input.resolutionNote());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return defectRepository.save(entity);
    }

    @Transactional
    public AbnahmeDefectEntity updateDefect(UUID tenantId, UUID abnahmeId, UUID defectId, UpdateDefectInput input) {
        AbnahmeDefectEntity entity = requireDefect(tenantId, abnahmeId, defectId);
        if (input.ref() != null && !input.ref().isBlank()) {
            entity.setRef(input.ref().trim());
        }
        if (input.title() != null && !input.title().isBlank()) {
            entity.setTitle(input.title().trim());
        }
        if (input.description() != null && !input.description().isBlank()) {
            entity.setDescription(input.description().trim());
        }
        if (input.category() != null && !input.category().isBlank()) {
            entity.setCategory(input.category().trim());
        }
        if (input.severity() != null && !input.severity().isBlank()) {
            entity.setSeverity(input.severity().trim());
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim());
        }
        if (input.locationText() != null && !input.locationText().isBlank()) {
            entity.setLocationText(input.locationText().trim());
        }
        if (input.roomLabel() != null) {
            entity.setRoomLabel(input.roomLabel().trim());
        }
        if (input.assignedTo() != null) {
            entity.setAssignedTo(input.assignedTo().trim());
        }
        if (input.dueDate() != null) {
            entity.setDueDate(input.dueDate());
        }
        if (input.reopenCount() != null) {
            entity.setReopenCount(input.reopenCount());
        }
        if (input.resolutionNote() != null) {
            entity.setResolutionNote(input.resolutionNote().trim());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return defectRepository.save(entity);
    }

    @Transactional
    public void deleteDefect(UUID tenantId, UUID abnahmeId, UUID defectId, UUID actorUserId, String reason) {
        AbnahmeDefectEntity entity = requireDefect(tenantId, abnahmeId, defectId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        defectRepository.save(entity);
    }

    public List<AbnahmeReworkEntity> listReworks(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        return reworkRepository.findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(tenantId, abnahmeId);
    }

    @Transactional
    public AbnahmeReworkEntity createRework(UUID tenantId, UUID abnahmeId, CreateReworkInput input) {
        requireRecord(tenantId, abnahmeId);
        requireDefect(tenantId, abnahmeId, input.defectId());
        OffsetDateTime now = OffsetDateTime.now();
        AbnahmeReworkEntity entity = new AbnahmeReworkEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setAbnahmeId(abnahmeId);
        entity.setDefectId(input.defectId());
        entity.setStatus(defaultText(input.status(), "OPEN"));
        entity.setOwner(requireText(input.owner(), "owner"));
        entity.setStartedAt(input.startedAt());
        entity.setFinishedAt(input.finishedAt());
        entity.setApprovedAt(input.approvedAt());
        entity.setNotesJson(defaultText(input.notesJson(), "[]"));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return reworkRepository.save(entity);
    }

    @Transactional
    public AbnahmeReworkEntity updateRework(UUID tenantId, UUID abnahmeId, UUID reworkId, UpdateReworkInput input) {
        AbnahmeReworkEntity entity = requireRework(tenantId, abnahmeId, reworkId);
        if (input.defectId() != null) {
            requireDefect(tenantId, abnahmeId, input.defectId());
            entity.setDefectId(input.defectId());
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim());
        }
        if (input.owner() != null && !input.owner().isBlank()) {
            entity.setOwner(input.owner().trim());
        }
        if (input.startedAt() != null) {
            entity.setStartedAt(input.startedAt());
        }
        if (input.finishedAt() != null) {
            entity.setFinishedAt(input.finishedAt());
        }
        if (input.approvedAt() != null) {
            entity.setApprovedAt(input.approvedAt());
        }
        if (input.notesJson() != null) {
            entity.setNotesJson(input.notesJson().trim());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return reworkRepository.save(entity);
    }

    @Transactional
    public void deleteRework(UUID tenantId, UUID abnahmeId, UUID reworkId, UUID actorUserId, String reason) {
        AbnahmeReworkEntity entity = requireRework(tenantId, abnahmeId, reworkId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        reworkRepository.save(entity);
    }

    public List<AbnahmeEvidenceEntity> listEvidence(UUID tenantId, UUID abnahmeId) {
        requireRecord(tenantId, abnahmeId);
        return evidenceRepository.findByTenantIdAndAbnahmeIdAndDeletedAtIsNull(tenantId, abnahmeId);
    }

    @Transactional
    public AbnahmeEvidenceEntity createEvidence(UUID tenantId, UUID abnahmeId, CreateEvidenceInput input) {
        requireRecord(tenantId, abnahmeId);
        if (input.defectId() != null) {
            requireDefect(tenantId, abnahmeId, input.defectId());
        }
        AbnahmeEvidenceEntity entity = new AbnahmeEvidenceEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setAbnahmeId(abnahmeId);
        entity.setDefectId(input.defectId());
        entity.setLabel(requireText(input.label(), "label"));
        entity.setUrl(requireText(input.url(), "url"));
        entity.setCreatedBy(requireText(input.createdBy(), "createdBy"));
        entity.setHasPeople(Boolean.TRUE.equals(input.hasPeople()));
        entity.setHasLicensePlate(Boolean.TRUE.equals(input.hasLicensePlate()));
        entity.setRedacted(Boolean.TRUE.equals(input.redacted()));
        entity.setLegalBasis(input.legalBasis());
        entity.setGeoLat(input.geoLat());
        entity.setGeoLng(input.geoLng());
        entity.setCreatedAt(OffsetDateTime.now());
        return evidenceRepository.save(entity);
    }

    @Transactional
    public AbnahmeEvidenceEntity updateEvidence(UUID tenantId, UUID abnahmeId, UUID evidenceId, UpdateEvidenceInput input) {
        AbnahmeEvidenceEntity entity = requireEvidence(tenantId, abnahmeId, evidenceId);
        if (input.defectId() != null) {
            requireDefect(tenantId, abnahmeId, input.defectId());
            entity.setDefectId(input.defectId());
        }
        if (input.label() != null && !input.label().isBlank()) {
            entity.setLabel(input.label().trim());
        }
        if (input.url() != null && !input.url().isBlank()) {
            entity.setUrl(input.url().trim());
        }
        if (input.createdBy() != null && !input.createdBy().isBlank()) {
            entity.setCreatedBy(input.createdBy().trim());
        }
        if (input.hasPeople() != null) {
            entity.setHasPeople(input.hasPeople());
        }
        if (input.hasLicensePlate() != null) {
            entity.setHasLicensePlate(input.hasLicensePlate());
        }
        if (input.redacted() != null) {
            entity.setRedacted(input.redacted());
        }
        if (input.legalBasis() != null) {
            entity.setLegalBasis(input.legalBasis().trim());
        }
        if (input.geoLat() != null) {
            entity.setGeoLat(input.geoLat());
        }
        if (input.geoLng() != null) {
            entity.setGeoLng(input.geoLng());
        }
        return evidenceRepository.save(entity);
    }

    @Transactional
    public void deleteEvidence(UUID tenantId, UUID abnahmeId, UUID evidenceId, UUID actorUserId, String reason) {
        AbnahmeEvidenceEntity entity = requireEvidence(tenantId, abnahmeId, evidenceId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        evidenceRepository.save(entity);
    }

    private AbnahmeRecordEntity requireRecord(UUID tenantId, UUID abnahmeId) {
        AbnahmeRecordEntity entity = recordRepository.findByTenantIdAndId(tenantId, abnahmeId)
            .orElseThrow(() -> new IllegalArgumentException("Abnahme nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Abnahme wurde gelöscht.");
        }
        return entity;
    }

    private AbnahmeParticipantEntity requireParticipant(UUID tenantId, UUID abnahmeId, UUID participantId) {
        return participantRepository.findByTenantIdAndAbnahmeIdAndId(tenantId, abnahmeId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Teilnehmer nicht gefunden."));
    }

    private AbnahmeDefectEntity requireDefect(UUID tenantId, UUID abnahmeId, UUID defectId) {
        if (defectId == null) {
            throw new IllegalArgumentException("defectId ist erforderlich.");
        }
        AbnahmeDefectEntity entity = defectRepository.findByTenantIdAndAbnahmeIdAndId(tenantId, abnahmeId, defectId)
            .orElseThrow(() -> new IllegalArgumentException("Mangel nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Mangel wurde gelöscht.");
        }
        return entity;
    }

    private AbnahmeReworkEntity requireRework(UUID tenantId, UUID abnahmeId, UUID reworkId) {
        AbnahmeReworkEntity entity = reworkRepository.findByTenantIdAndAbnahmeIdAndId(tenantId, abnahmeId, reworkId)
            .orElseThrow(() -> new IllegalArgumentException("Nacharbeit nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Nacharbeit wurde gelöscht.");
        }
        return entity;
    }

    private AbnahmeEvidenceEntity requireEvidence(UUID tenantId, UUID abnahmeId, UUID evidenceId) {
        AbnahmeEvidenceEntity entity = evidenceRepository.findByTenantIdAndAbnahmeIdAndId(tenantId, abnahmeId, evidenceId)
            .orElseThrow(() -> new IllegalArgumentException("Nachweis nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Nachweis wurde gelöscht.");
        }
        return entity;
    }

    private String defaultText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Feld '" + field + "' ist erforderlich.");
        }
        return value.trim();
    }

    public Map<String, Object> summarize(AbnahmeRecordEntity record) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", record.getId());
        summary.put("number", record.getNumber());
        summary.put("projectName", record.getProjectName());
        summary.put("customerName", record.getCustomerName());
        summary.put("siteName", record.getSiteName());
        summary.put("tradeLabel", record.getTradeLabel());
        summary.put("createdBy", record.getCreatedBy());
        summary.put("status", record.getStatus());
        summary.put("nextInspectionDate", record.getNextInspectionDate());
        summary.put("isOverdue", record.isOverdue());
        summary.put("createdAt", record.getCreatedAt());
        summary.put("updatedAt", record.getUpdatedAt());
        return summary;
    }

    public record CreateRecordInput(
        String number,
        String projectName,
        String customerName,
        String siteName,
        String tradeLabel,
        String createdBy,
        String status,
        OffsetDateTime nextInspectionDate,
        Boolean overdue
    ) {}

    public record UpdateRecordInput(
        String projectName,
        String customerName,
        String siteName,
        String tradeLabel,
        String createdBy,
        String status,
        OffsetDateTime nextInspectionDate,
        Boolean overdue
    ) {}

    public record UpsertProtocolInput(
        String acceptanceType,
        OffsetDateTime inspectionDate,
        OffsetDateTime appointmentDate,
        String place,
        String reservationText,
        String signoffStatus,
        OffsetDateTime signedAt
    ) {}

    public record CreateParticipantInput(
        String name,
        String roleLabel,
        String company,
        Boolean present
    ) {}

    public record UpdateParticipantInput(
        String name,
        String roleLabel,
        String company,
        Boolean present
    ) {}

    public record CreateDefectInput(
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

    public record UpdateDefectInput(
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

    public record CreateReworkInput(
        UUID defectId,
        String status,
        String owner,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt,
        OffsetDateTime approvedAt,
        String notesJson
    ) {}

    public record UpdateReworkInput(
        UUID defectId,
        String status,
        String owner,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt,
        OffsetDateTime approvedAt,
        String notesJson
    ) {}

    public record CreateEvidenceInput(
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

    public record UpdateEvidenceInput(
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
}
