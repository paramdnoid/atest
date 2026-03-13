package com.zunftgewerk.api.modules.aufmass.service;

import com.zunftgewerk.api.modules.aufmass.entity.AufmassMappingEntity;
import com.zunftgewerk.api.modules.aufmass.entity.AufmassMeasurementEntity;
import com.zunftgewerk.api.modules.aufmass.entity.AufmassPositionEntity;
import com.zunftgewerk.api.modules.aufmass.entity.AufmassRecordEntity;
import com.zunftgewerk.api.modules.aufmass.entity.AufmassRoomEntity;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassMappingRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassMeasurementRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassPositionRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassRecordRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassRoomRepository;
import com.zunftgewerk.api.shared.audit.DomainMutationAuditLogger;
import com.zunftgewerk.api.shared.monitoring.DomainMutationMetrics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AufmassService {

    private final AufmassRecordRepository recordRepository;
    private final AufmassRoomRepository roomRepository;
    private final AufmassPositionRepository positionRepository;
    private final AufmassMeasurementRepository measurementRepository;
    private final AufmassMappingRepository mappingRepository;
    private final DomainMutationMetrics domainMutationMetrics;
    private final DomainMutationAuditLogger domainMutationAuditLogger;

    public AufmassService(
        AufmassRecordRepository recordRepository,
        AufmassRoomRepository roomRepository,
        AufmassPositionRepository positionRepository,
        AufmassMeasurementRepository measurementRepository,
        AufmassMappingRepository mappingRepository,
        DomainMutationMetrics domainMutationMetrics,
        DomainMutationAuditLogger domainMutationAuditLogger
    ) {
        this.recordRepository = recordRepository;
        this.roomRepository = roomRepository;
        this.positionRepository = positionRepository;
        this.measurementRepository = measurementRepository;
        this.mappingRepository = mappingRepository;
        this.domainMutationMetrics = domainMutationMetrics;
        this.domainMutationAuditLogger = domainMutationAuditLogger;
    }

    public List<AufmassRecordEntity> list(UUID tenantId, String status) {
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        return recordRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(r -> normalizedStatus == null || normalizedStatus.isBlank() || normalizedStatus.equals(r.getStatus()))
            .sorted(Comparator.comparing(AufmassRecordEntity::getUpdatedAt).reversed())
            .toList();
    }

    public AufmassRecordEntity get(UUID tenantId, UUID recordId) {
        return requireRecord(tenantId, recordId);
    }

    @Transactional
    public AufmassRecordEntity create(UUID tenantId, UUID actorUserId, CreateRecordInput input) {
        String number = requireText(input.number(), "number");
        if (recordRepository.existsByTenantIdAndNumber(tenantId, number)) {
            throw new IllegalArgumentException("Aufmaßnummer existiert bereits.");
        }
        OffsetDateTime now = OffsetDateTime.now();
        AufmassRecordEntity entity = new AufmassRecordEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setNumber(number);
        entity.setProjectName(requireText(input.projectName(), "projectName"));
        entity.setCustomerName(requireText(input.customerName(), "customerName"));
        entity.setSiteName(requireText(input.siteName(), "siteName"));
        entity.setCreatedBy(defaultText(input.createdBy(), actorUserId.toString()));
        entity.setDueDate(input.dueDate());
        entity.setStatus(defaultText(input.status(), "DRAFT"));
        entity.setVersion(input.version() != null ? input.version() : 1);
        entity.setRevisionOfId(input.revisionOfId());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        AufmassRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordCreate("aufmass");
        domainMutationAuditLogger.recordMutation("aufmass", "create", tenantId, actorUserId, saved.getId());
        return saved;
    }

    @Transactional
    public AufmassRecordEntity update(UUID tenantId, UUID recordId, UpdateRecordInput input) {
        AufmassRecordEntity entity = requireRecord(tenantId, recordId);
        if (input.projectName() != null && !input.projectName().isBlank()) {
            entity.setProjectName(input.projectName().trim());
        }
        if (input.customerName() != null && !input.customerName().isBlank()) {
            entity.setCustomerName(input.customerName().trim());
        }
        if (input.siteName() != null && !input.siteName().isBlank()) {
            entity.setSiteName(input.siteName().trim());
        }
        if (input.createdBy() != null && !input.createdBy().isBlank()) {
            entity.setCreatedBy(input.createdBy().trim());
        }
        if (input.dueDate() != null) {
            entity.setDueDate(input.dueDate());
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        if (input.version() != null) {
            entity.setVersion(input.version());
        }
        if (input.revisionOfId() != null) {
            entity.setRevisionOfId(input.revisionOfId());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        AufmassRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordUpdate("aufmass");
        return saved;
    }

    @Transactional
    public void delete(UUID tenantId, UUID recordId, UUID actorUserId, String reason) {
        AufmassRecordEntity entity = requireRecord(tenantId, recordId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        AufmassRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordDelete("aufmass");
        domainMutationAuditLogger.recordMutation("aufmass", "delete", tenantId, actorUserId, saved.getId());
    }

    @Transactional
    public AufmassRecordEntity restore(UUID tenantId, UUID recordId) {
        AufmassRecordEntity entity = recordRepository.findByTenantIdAndId(tenantId, recordId)
            .orElseThrow(() -> new IllegalArgumentException("Aufmaß nicht gefunden."));
        entity.setDeletedAt(null);
        entity.setDeletedBy(null);
        entity.setDeleteReason(null);
        entity.setUpdatedAt(OffsetDateTime.now());
        AufmassRecordEntity saved = recordRepository.save(entity);
        domainMutationMetrics.recordRestore("aufmass");
        return saved;
    }

    public List<AufmassRoomEntity> listRooms(UUID tenantId, UUID recordId) {
        requireRecord(tenantId, recordId);
        return roomRepository.findByTenantIdAndRecordIdAndDeletedAtIsNull(tenantId, recordId);
    }

    @Transactional
    public AufmassRoomEntity createRoom(UUID tenantId, UUID recordId, CreateRoomInput input) {
        requireRecord(tenantId, recordId);
        OffsetDateTime now = OffsetDateTime.now();
        AufmassRoomEntity entity = new AufmassRoomEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setRecordId(recordId);
        entity.setBuilding(defaultText(input.building(), "HAUPTGEBAEUDE"));
        entity.setLevelLabel(defaultText(input.levelLabel(), "EG"));
        entity.setName(requireText(input.name(), "name"));
        entity.setAreaM2(input.areaM2());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return roomRepository.save(entity);
    }

    @Transactional
    public AufmassRoomEntity updateRoom(UUID tenantId, UUID recordId, UUID roomId, UpdateRoomInput input) {
        AufmassRoomEntity entity = requireRoom(tenantId, recordId, roomId);
        if (input.building() != null && !input.building().isBlank()) {
            entity.setBuilding(input.building().trim());
        }
        if (input.levelLabel() != null && !input.levelLabel().isBlank()) {
            entity.setLevelLabel(input.levelLabel().trim());
        }
        if (input.name() != null && !input.name().isBlank()) {
            entity.setName(input.name().trim());
        }
        if (input.areaM2() != null) {
            entity.setAreaM2(input.areaM2());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return roomRepository.save(entity);
    }

    @Transactional
    public void deleteRoom(UUID tenantId, UUID recordId, UUID roomId, UUID actorUserId, String reason) {
        AufmassRoomEntity entity = requireRoom(tenantId, recordId, roomId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        roomRepository.save(entity);
    }

    public List<AufmassPositionEntity> listPositions(UUID tenantId, UUID recordId) {
        requireRecord(tenantId, recordId);
        return positionRepository.findByTenantIdAndRecordIdAndDeletedAtIsNull(tenantId, recordId);
    }

    @Transactional
    public AufmassPositionEntity createPosition(UUID tenantId, UUID recordId, CreatePositionInput input) {
        requireRecord(tenantId, recordId);
        OffsetDateTime now = OffsetDateTime.now();
        AufmassPositionEntity entity = new AufmassPositionEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setRecordId(recordId);
        entity.setCode(requireText(input.code(), "code"));
        entity.setTitle(requireText(input.title(), "title"));
        entity.setUnit(defaultText(input.unit(), "m2"));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return positionRepository.save(entity);
    }

    @Transactional
    public AufmassPositionEntity updatePosition(UUID tenantId, UUID recordId, UUID positionId, UpdatePositionInput input) {
        AufmassPositionEntity entity = requirePosition(tenantId, recordId, positionId);
        if (input.code() != null && !input.code().isBlank()) {
            entity.setCode(input.code().trim());
        }
        if (input.title() != null && !input.title().isBlank()) {
            entity.setTitle(input.title().trim());
        }
        if (input.unit() != null && !input.unit().isBlank()) {
            entity.setUnit(input.unit().trim());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return positionRepository.save(entity);
    }

    @Transactional
    public void deletePosition(UUID tenantId, UUID recordId, UUID positionId, UUID actorUserId, String reason) {
        AufmassPositionEntity entity = requirePosition(tenantId, recordId, positionId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        positionRepository.save(entity);
    }

    public List<AufmassMeasurementEntity> listMeasurements(UUID tenantId, UUID recordId) {
        requireRecord(tenantId, recordId);
        return measurementRepository.findByTenantIdAndRecordIdAndDeletedAtIsNull(tenantId, recordId);
    }

    @Transactional
    public AufmassMeasurementEntity createMeasurement(UUID tenantId, UUID recordId, CreateMeasurementInput input) {
        requireRecord(tenantId, recordId);
        requireRoom(tenantId, recordId, input.roomId());
        requirePosition(tenantId, recordId, input.positionId());

        OffsetDateTime now = OffsetDateTime.now();
        AufmassMeasurementEntity entity = new AufmassMeasurementEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setRecordId(recordId);
        entity.setRoomId(input.roomId());
        entity.setPositionId(input.positionId());
        entity.setLabel(requireText(input.label(), "label"));
        entity.setFormula(defaultText(input.formula(), "0"));
        entity.setFormulaAstJson(input.formulaAstJson());
        entity.setFormulaSource(input.formulaSource());
        entity.setFormulaMigrationStatus(input.formulaMigrationStatus());
        entity.setQuantity(input.quantity() != null ? input.quantity() : BigDecimal.ZERO);
        entity.setUnit(defaultText(input.unit(), "m2"));
        entity.setNote(input.note());
        entity.setPhotoCount(input.photoCount() != null ? input.photoCount() : 0);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return measurementRepository.save(entity);
    }

    @Transactional
    public AufmassMeasurementEntity updateMeasurement(
        UUID tenantId,
        UUID recordId,
        UUID measurementId,
        UpdateMeasurementInput input
    ) {
        AufmassMeasurementEntity entity = requireMeasurement(tenantId, recordId, measurementId);
        if (input.roomId() != null) {
            requireRoom(tenantId, recordId, input.roomId());
            entity.setRoomId(input.roomId());
        }
        if (input.positionId() != null) {
            requirePosition(tenantId, recordId, input.positionId());
            entity.setPositionId(input.positionId());
        }
        if (input.label() != null && !input.label().isBlank()) {
            entity.setLabel(input.label().trim());
        }
        if (input.formula() != null && !input.formula().isBlank()) {
            entity.setFormula(input.formula().trim());
        }
        if (input.formulaAstJson() != null) {
            entity.setFormulaAstJson(input.formulaAstJson().trim());
        }
        if (input.formulaSource() != null) {
            entity.setFormulaSource(input.formulaSource().trim());
        }
        if (input.formulaMigrationStatus() != null) {
            entity.setFormulaMigrationStatus(input.formulaMigrationStatus().trim());
        }
        if (input.quantity() != null) {
            entity.setQuantity(input.quantity());
        }
        if (input.unit() != null && !input.unit().isBlank()) {
            entity.setUnit(input.unit().trim());
        }
        if (input.note() != null) {
            entity.setNote(input.note().trim());
        }
        if (input.photoCount() != null) {
            entity.setPhotoCount(input.photoCount());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return measurementRepository.save(entity);
    }

    @Transactional
    public void deleteMeasurement(UUID tenantId, UUID recordId, UUID measurementId, UUID actorUserId, String reason) {
        AufmassMeasurementEntity entity = requireMeasurement(tenantId, recordId, measurementId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        measurementRepository.save(entity);
    }

    public List<AufmassMappingEntity> listMappings(UUID tenantId, UUID recordId) {
        requireRecord(tenantId, recordId);
        return mappingRepository.findByTenantIdAndRecordIdAndDeletedAtIsNull(tenantId, recordId);
    }

    @Transactional
    public AufmassMappingEntity createMapping(UUID tenantId, UUID recordId, CreateMappingInput input) {
        requireRecord(tenantId, recordId);
        requirePosition(tenantId, recordId, input.positionId());
        requireRoom(tenantId, recordId, input.roomId());

        AufmassMappingEntity entity = new AufmassMappingEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setRecordId(recordId);
        entity.setPositionId(input.positionId());
        entity.setRoomId(input.roomId());
        entity.setMappedBy(requireText(input.mappedBy(), "mappedBy"));
        entity.setMappedAt(input.mappedAt() != null ? input.mappedAt() : OffsetDateTime.now());
        return mappingRepository.save(entity);
    }

    @Transactional
    public AufmassMappingEntity updateMapping(UUID tenantId, UUID recordId, UUID mappingId, UpdateMappingInput input) {
        AufmassMappingEntity entity = requireMapping(tenantId, recordId, mappingId);
        if (input.positionId() != null) {
            requirePosition(tenantId, recordId, input.positionId());
            entity.setPositionId(input.positionId());
        }
        if (input.roomId() != null) {
            requireRoom(tenantId, recordId, input.roomId());
            entity.setRoomId(input.roomId());
        }
        if (input.mappedBy() != null && !input.mappedBy().isBlank()) {
            entity.setMappedBy(input.mappedBy().trim());
        }
        if (input.mappedAt() != null) {
            entity.setMappedAt(input.mappedAt());
        }
        return mappingRepository.save(entity);
    }

    @Transactional
    public void deleteMapping(UUID tenantId, UUID recordId, UUID mappingId, UUID actorUserId, String reason) {
        AufmassMappingEntity entity = requireMapping(tenantId, recordId, mappingId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        mappingRepository.save(entity);
    }

    private AufmassRecordEntity requireRecord(UUID tenantId, UUID recordId) {
        AufmassRecordEntity entity = recordRepository.findByTenantIdAndId(tenantId, recordId)
            .orElseThrow(() -> new IllegalArgumentException("Aufmaß nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Aufmaß wurde gelöscht.");
        }
        return entity;
    }

    private AufmassRoomEntity requireRoom(UUID tenantId, UUID recordId, UUID roomId) {
        if (roomId == null) {
            throw new IllegalArgumentException("roomId ist erforderlich.");
        }
        AufmassRoomEntity entity = roomRepository.findByTenantIdAndRecordIdAndId(tenantId, recordId, roomId)
            .orElseThrow(() -> new IllegalArgumentException("Raum nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Raum wurde gelöscht.");
        }
        return entity;
    }

    private AufmassPositionEntity requirePosition(UUID tenantId, UUID recordId, UUID positionId) {
        if (positionId == null) {
            throw new IllegalArgumentException("positionId ist erforderlich.");
        }
        AufmassPositionEntity entity = positionRepository.findByTenantIdAndRecordIdAndId(tenantId, recordId, positionId)
            .orElseThrow(() -> new IllegalArgumentException("Position nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Position wurde gelöscht.");
        }
        return entity;
    }

    private AufmassMeasurementEntity requireMeasurement(UUID tenantId, UUID recordId, UUID measurementId) {
        AufmassMeasurementEntity entity = measurementRepository.findByTenantIdAndRecordIdAndId(tenantId, recordId, measurementId)
            .orElseThrow(() -> new IllegalArgumentException("Messung nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Messung wurde gelöscht.");
        }
        return entity;
    }

    private AufmassMappingEntity requireMapping(UUID tenantId, UUID recordId, UUID mappingId) {
        AufmassMappingEntity entity = mappingRepository.findByTenantIdAndRecordIdAndId(tenantId, recordId, mappingId)
            .orElseThrow(() -> new IllegalArgumentException("Mapping nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Mapping wurde gelöscht.");
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

    public Map<String, Object> summarize(AufmassRecordEntity record) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", record.getId());
        summary.put("number", record.getNumber());
        summary.put("projectName", record.getProjectName());
        summary.put("customerName", record.getCustomerName());
        summary.put("siteName", record.getSiteName());
        summary.put("createdBy", record.getCreatedBy());
        summary.put("dueDate", record.getDueDate());
        summary.put("status", record.getStatus());
        summary.put("version", record.getVersion());
        summary.put("revisionOfId", record.getRevisionOfId());
        summary.put("createdAt", record.getCreatedAt());
        summary.put("updatedAt", record.getUpdatedAt());
        return summary;
    }

    public record CreateRecordInput(
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

    public record UpdateRecordInput(
        String projectName,
        String customerName,
        String siteName,
        String createdBy,
        OffsetDateTime dueDate,
        String status,
        Integer version,
        UUID revisionOfId
    ) {}

    public record CreateRoomInput(
        String building,
        String levelLabel,
        String name,
        BigDecimal areaM2
    ) {}

    public record UpdateRoomInput(
        String building,
        String levelLabel,
        String name,
        BigDecimal areaM2
    ) {}

    public record CreatePositionInput(
        String code,
        String title,
        String unit
    ) {}

    public record UpdatePositionInput(
        String code,
        String title,
        String unit
    ) {}

    public record CreateMeasurementInput(
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

    public record UpdateMeasurementInput(
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

    public record CreateMappingInput(
        UUID positionId,
        UUID roomId,
        String mappedBy,
        OffsetDateTime mappedAt
    ) {}

    public record UpdateMappingInput(
        UUID positionId,
        UUID roomId,
        String mappedBy,
        OffsetDateTime mappedAt
    ) {}
}
