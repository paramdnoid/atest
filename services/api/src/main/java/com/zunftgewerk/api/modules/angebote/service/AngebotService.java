package com.zunftgewerk.api.modules.angebote.service;

import com.zunftgewerk.api.modules.angebote.entity.AngebotEntity;
import com.zunftgewerk.api.modules.angebote.entity.AngebotOptionEntity;
import com.zunftgewerk.api.modules.angebote.entity.AngebotPositionEntity;
import com.zunftgewerk.api.modules.angebote.repository.AngebotOptionRepository;
import com.zunftgewerk.api.modules.angebote.repository.AngebotPositionRepository;
import com.zunftgewerk.api.modules.angebote.repository.AngebotRepository;
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
public class AngebotService {

    private final AngebotRepository angebotRepository;
    private final AngebotPositionRepository positionRepository;
    private final AngebotOptionRepository optionRepository;

    public AngebotService(
        AngebotRepository angebotRepository,
        AngebotPositionRepository positionRepository,
        AngebotOptionRepository optionRepository
    ) {
        this.angebotRepository = angebotRepository;
        this.positionRepository = positionRepository;
        this.optionRepository = optionRepository;
    }

    public List<AngebotEntity> list(UUID tenantId, String status) {
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        return angebotRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(a -> normalizedStatus == null || normalizedStatus.isBlank() || normalizedStatus.equals(a.getStatus()))
            .sorted(Comparator.comparing(AngebotEntity::getUpdatedAt).reversed())
            .toList();
    }

    public AngebotEntity get(UUID tenantId, UUID angebotId) {
        return requireAngebot(tenantId, angebotId);
    }

    @Transactional
    public AngebotEntity create(UUID tenantId, UUID actorUserId, CreateAngebotInput input) {
        String number = requireText(input.number(), "number");
        if (angebotRepository.existsByTenantIdAndNumber(tenantId, number)) {
            throw new IllegalArgumentException("Angebotsnummer existiert bereits.");
        }
        OffsetDateTime now = OffsetDateTime.now();
        AngebotEntity entity = new AngebotEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setNumber(number);
        entity.setCustomerName(requireText(input.customerName(), "customerName"));
        entity.setProjectName(requireText(input.projectName(), "projectName"));
        entity.setTradeLabel(defaultText(input.tradeLabel(), "GENERAL"));
        entity.setPriority(defaultText(input.priority(), "MEDIUM"));
        entity.setOwnerUserId(input.ownerUserId() != null ? input.ownerUserId() : actorUserId);
        entity.setStatus(defaultText(input.status(), "DRAFT"));
        entity.setValidUntil(input.validUntil() != null ? input.validUntil() : now.plusDays(14));
        entity.setNote(input.note());
        entity.setSelectedOptionId(input.selectedOptionId());
        entity.setConvertedOrderNumber(input.convertedOrderNumber());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return angebotRepository.save(entity);
    }

    @Transactional
    public AngebotEntity update(UUID tenantId, UUID angebotId, UpdateAngebotInput input) {
        AngebotEntity entity = requireAngebot(tenantId, angebotId);
        if (input.customerName() != null && !input.customerName().isBlank()) {
            entity.setCustomerName(input.customerName().trim());
        }
        if (input.projectName() != null && !input.projectName().isBlank()) {
            entity.setProjectName(input.projectName().trim());
        }
        if (input.tradeLabel() != null && !input.tradeLabel().isBlank()) {
            entity.setTradeLabel(input.tradeLabel().trim().toUpperCase(Locale.ROOT));
        }
        if (input.priority() != null && !input.priority().isBlank()) {
            entity.setPriority(input.priority().trim().toUpperCase(Locale.ROOT));
        }
        if (input.ownerUserId() != null) {
            entity.setOwnerUserId(input.ownerUserId());
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        if (input.validUntil() != null) {
            entity.setValidUntil(input.validUntil());
        }
        if (input.note() != null) {
            entity.setNote(input.note().trim());
        }
        if (input.selectedOptionId() != null) {
            entity.setSelectedOptionId(input.selectedOptionId());
        }
        if (input.convertedOrderNumber() != null) {
            entity.setConvertedOrderNumber(input.convertedOrderNumber().trim());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return angebotRepository.save(entity);
    }

    @Transactional
    public AngebotEntity delete(UUID tenantId, UUID angebotId, UUID actorUserId, String reason) {
        AngebotEntity entity = requireAngebot(tenantId, angebotId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        return angebotRepository.save(entity);
    }

    @Transactional
    public AngebotEntity restore(UUID tenantId, UUID angebotId) {
        AngebotEntity entity = angebotRepository.findByTenantIdAndId(tenantId, angebotId)
            .orElseThrow(() -> new IllegalArgumentException("Angebot nicht gefunden."));
        entity.setDeletedAt(null);
        entity.setDeletedBy(null);
        entity.setDeleteReason(null);
        entity.setUpdatedAt(OffsetDateTime.now());
        return angebotRepository.save(entity);
    }

    public List<AngebotPositionEntity> listPositionen(UUID tenantId, UUID angebotId) {
        requireAngebot(tenantId, angebotId);
        return positionRepository.findByTenantIdAndQuoteIdAndDeletedAtIsNull(tenantId, angebotId);
    }

    @Transactional
    public AngebotPositionEntity createPosition(UUID tenantId, UUID angebotId, CreatePositionInput input) {
        requireAngebot(tenantId, angebotId);
        OffsetDateTime now = OffsetDateTime.now();
        AngebotPositionEntity entity = new AngebotPositionEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setQuoteId(angebotId);
        entity.setTitle(requireText(input.title(), "title"));
        entity.setDescription(input.description());
        entity.setUnit(defaultText(input.unit(), "m2"));
        entity.setQuantity(input.quantity() != null ? input.quantity() : BigDecimal.ONE);
        entity.setUnitPriceNet(input.unitPriceNet() != null ? input.unitPriceNet() : BigDecimal.ZERO);
        entity.setMaterialCostNet(input.materialCostNet() != null ? input.materialCostNet() : BigDecimal.ZERO);
        entity.setLaborCostNet(input.laborCostNet() != null ? input.laborCostNet() : BigDecimal.ZERO);
        entity.setDiscountPercent(input.discountPercent());
        entity.setOptional(input.optional() != null ? input.optional() : Boolean.FALSE);
        entity.setTemplateKey(input.templateKey());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return positionRepository.save(entity);
    }

    @Transactional
    public AngebotPositionEntity updatePosition(UUID tenantId, UUID angebotId, UUID positionId, UpdatePositionInput input) {
        AngebotPositionEntity entity = requirePosition(tenantId, angebotId, positionId);
        if (input.title() != null && !input.title().isBlank()) {
            entity.setTitle(input.title().trim());
        }
        if (input.description() != null) {
            entity.setDescription(input.description().trim());
        }
        if (input.unit() != null && !input.unit().isBlank()) {
            entity.setUnit(input.unit().trim());
        }
        if (input.quantity() != null) {
            entity.setQuantity(input.quantity());
        }
        if (input.unitPriceNet() != null) {
            entity.setUnitPriceNet(input.unitPriceNet());
        }
        if (input.materialCostNet() != null) {
            entity.setMaterialCostNet(input.materialCostNet());
        }
        if (input.laborCostNet() != null) {
            entity.setLaborCostNet(input.laborCostNet());
        }
        if (input.discountPercent() != null) {
            entity.setDiscountPercent(input.discountPercent());
        }
        if (input.optional() != null) {
            entity.setOptional(input.optional());
        }
        if (input.templateKey() != null) {
            entity.setTemplateKey(input.templateKey().trim());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return positionRepository.save(entity);
    }

    @Transactional
    public void deletePosition(UUID tenantId, UUID angebotId, UUID positionId, UUID actorUserId, String reason) {
        AngebotPositionEntity entity = requirePosition(tenantId, angebotId, positionId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        positionRepository.save(entity);
    }

    public List<AngebotOptionEntity> listOptionen(UUID tenantId, UUID angebotId) {
        requireAngebot(tenantId, angebotId);
        return optionRepository.findByTenantIdAndQuoteIdAndDeletedAtIsNull(tenantId, angebotId);
    }

    @Transactional
    public AngebotOptionEntity createOption(UUID tenantId, UUID angebotId, CreateOptionInput input) {
        requireAngebot(tenantId, angebotId);
        OffsetDateTime now = OffsetDateTime.now();
        AngebotOptionEntity entity = new AngebotOptionEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setQuoteId(angebotId);
        entity.setTier(defaultText(input.tier(), "STANDARD"));
        entity.setLabel(requireText(input.label(), "label"));
        entity.setDescription(defaultText(input.description(), "-"));
        entity.setIncludedPositionIdsJson(defaultText(input.includedPositionIdsJson(), "[]"));
        entity.setRecommended(input.recommended() != null ? input.recommended() : Boolean.FALSE);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return optionRepository.save(entity);
    }

    @Transactional
    public AngebotOptionEntity updateOption(UUID tenantId, UUID angebotId, UUID optionId, UpdateOptionInput input) {
        AngebotOptionEntity entity = requireOption(tenantId, angebotId, optionId);
        if (input.tier() != null && !input.tier().isBlank()) {
            entity.setTier(input.tier().trim().toUpperCase(Locale.ROOT));
        }
        if (input.label() != null && !input.label().isBlank()) {
            entity.setLabel(input.label().trim());
        }
        if (input.description() != null) {
            entity.setDescription(input.description().trim());
        }
        if (input.includedPositionIdsJson() != null) {
            entity.setIncludedPositionIdsJson(input.includedPositionIdsJson().trim());
        }
        if (input.recommended() != null) {
            entity.setRecommended(input.recommended());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return optionRepository.save(entity);
    }

    @Transactional
    public void deleteOption(UUID tenantId, UUID angebotId, UUID optionId, UUID actorUserId, String reason) {
        AngebotOptionEntity entity = requireOption(tenantId, angebotId, optionId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        optionRepository.save(entity);
    }

    private AngebotEntity requireAngebot(UUID tenantId, UUID angebotId) {
        AngebotEntity entity = angebotRepository.findByTenantIdAndId(tenantId, angebotId)
            .orElseThrow(() -> new IllegalArgumentException("Angebot nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Angebot wurde gelöscht.");
        }
        return entity;
    }

    private AngebotPositionEntity requirePosition(UUID tenantId, UUID angebotId, UUID positionId) {
        AngebotPositionEntity entity = positionRepository.findByTenantIdAndQuoteIdAndId(tenantId, angebotId, positionId)
            .orElseThrow(() -> new IllegalArgumentException("Position nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Position wurde gelöscht.");
        }
        return entity;
    }

    private AngebotOptionEntity requireOption(UUID tenantId, UUID angebotId, UUID optionId) {
        AngebotOptionEntity entity = optionRepository.findByTenantIdAndQuoteIdAndId(tenantId, angebotId, optionId)
            .orElseThrow(() -> new IllegalArgumentException("Option nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Option wurde gelöscht.");
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

    public Map<String, Object> summarize(AngebotEntity angebot) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", angebot.getId());
        summary.put("number", angebot.getNumber());
        summary.put("customerName", angebot.getCustomerName());
        summary.put("projectName", angebot.getProjectName());
        summary.put("tradeLabel", angebot.getTradeLabel());
        summary.put("priority", angebot.getPriority());
        summary.put("ownerUserId", angebot.getOwnerUserId());
        summary.put("status", angebot.getStatus());
        summary.put("validUntil", angebot.getValidUntil());
        summary.put("note", angebot.getNote());
        summary.put("selectedOptionId", angebot.getSelectedOptionId());
        summary.put("convertedOrderNumber", angebot.getConvertedOrderNumber());
        summary.put("createdAt", angebot.getCreatedAt());
        summary.put("updatedAt", angebot.getUpdatedAt());
        return summary;
    }

    public record CreateAngebotInput(
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

    public record UpdateAngebotInput(
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

    public record CreatePositionInput(
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

    public record UpdatePositionInput(
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

    public record CreateOptionInput(
        String tier,
        String label,
        String description,
        String includedPositionIdsJson,
        Boolean recommended
    ) {}

    public record UpdateOptionInput(
        String tier,
        String label,
        String description,
        String includedPositionIdsJson,
        Boolean recommended
    ) {}
}
