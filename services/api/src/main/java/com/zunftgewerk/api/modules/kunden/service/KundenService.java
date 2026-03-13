package com.zunftgewerk.api.modules.kunden.service;

import com.zunftgewerk.api.modules.kunden.entity.KundenAnsprechpartnerEntity;
import com.zunftgewerk.api.modules.kunden.entity.KundenEntity;
import com.zunftgewerk.api.modules.kunden.entity.KundenObjektEntity;
import com.zunftgewerk.api.modules.kunden.entity.KundenReminderEntity;
import com.zunftgewerk.api.modules.kunden.repository.KundenAnsprechpartnerRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenObjektRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenReminderRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenRepository;
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
public class KundenService {

    private final KundenRepository kundenRepository;
    private final KundenObjektRepository objektRepository;
    private final KundenAnsprechpartnerRepository ansprechpartnerRepository;
    private final KundenReminderRepository reminderRepository;

    public KundenService(
        KundenRepository kundenRepository,
        KundenObjektRepository objektRepository,
        KundenAnsprechpartnerRepository ansprechpartnerRepository,
        KundenReminderRepository reminderRepository
    ) {
        this.kundenRepository = kundenRepository;
        this.objektRepository = objektRepository;
        this.ansprechpartnerRepository = ansprechpartnerRepository;
        this.reminderRepository = reminderRepository;
    }

    public List<KundenEntity> listKunden(UUID tenantId, String search, String status) {
        String normalizedSearch = search == null ? null : search.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);

        return kundenRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
            .filter(k -> normalizedStatus == null || normalizedStatus.isBlank() || normalizedStatus.equals(k.getStatus()))
            .filter(k -> normalizedSearch == null || normalizedSearch.isBlank() || matchesSearch(k, normalizedSearch))
            .sorted(Comparator.comparing(KundenEntity::getUpdatedAt).reversed())
            .toList();
    }

    public KundenEntity getKunde(UUID tenantId, UUID kundenId) {
        return requireKunde(tenantId, kundenId);
    }

    @Transactional
    public KundenEntity createKunde(UUID tenantId, UUID actorUserId, CreateKundeInput input) {
        String number = requireText(input.number(), "number");
        if (kundenRepository.existsByTenantIdAndNumber(tenantId, number)) {
            throw new IllegalArgumentException("Kundennummer existiert bereits.");
        }

        OffsetDateTime now = OffsetDateTime.now();
        KundenEntity entity = new KundenEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setNumber(number);
        entity.setName(requireText(input.name(), "name"));
        entity.setBranche(defaultText(input.branche(), "UNBEKANNT"));
        entity.setSegment(defaultText(input.segment(), "STANDARD"));
        entity.setStatus(defaultText(input.status(), "AKTIV"));
        entity.setOwnerUserId(input.ownerUserId() != null ? input.ownerUserId() : actorUserId);
        entity.setScore(input.score() != null ? input.score() : 0);
        entity.setConsentState(defaultText(input.consentState(), "UNBEKANNT"));
        entity.setRetentionClass(defaultText(input.retentionClass(), "STANDARD"));
        entity.setRegion(defaultText(input.region(), "DE"));
        entity.setNextFollowUpAt(input.nextFollowUpAt());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return kundenRepository.save(entity);
    }

    @Transactional
    public KundenEntity updateKunde(UUID tenantId, UUID kundenId, UpdateKundeInput input) {
        KundenEntity entity = requireKunde(tenantId, kundenId);
        if (input.name() != null && !input.name().isBlank()) {
            entity.setName(input.name().trim());
        }
        if (input.branche() != null && !input.branche().isBlank()) {
            entity.setBranche(input.branche().trim().toUpperCase(Locale.ROOT));
        }
        if (input.segment() != null && !input.segment().isBlank()) {
            entity.setSegment(input.segment().trim().toUpperCase(Locale.ROOT));
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        if (input.ownerUserId() != null) {
            entity.setOwnerUserId(input.ownerUserId());
        }
        if (input.score() != null) {
            entity.setScore(input.score());
        }
        if (input.consentState() != null && !input.consentState().isBlank()) {
            entity.setConsentState(input.consentState().trim().toUpperCase(Locale.ROOT));
        }
        if (input.retentionClass() != null && !input.retentionClass().isBlank()) {
            entity.setRetentionClass(input.retentionClass().trim().toUpperCase(Locale.ROOT));
        }
        if (input.region() != null && !input.region().isBlank()) {
            entity.setRegion(input.region().trim().toUpperCase(Locale.ROOT));
        }
        if (input.nextFollowUpAt() != null) {
            entity.setNextFollowUpAt(input.nextFollowUpAt());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return kundenRepository.save(entity);
    }

    @Transactional
    public KundenEntity softDeleteKunde(UUID tenantId, UUID kundenId, UUID actorUserId, String reason) {
        KundenEntity entity = requireKunde(tenantId, kundenId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        return kundenRepository.save(entity);
    }

    @Transactional
    public KundenEntity restoreKunde(UUID tenantId, UUID kundenId) {
        KundenEntity entity = kundenRepository.findByTenantIdAndId(tenantId, kundenId)
            .orElseThrow(() -> new IllegalArgumentException("Kunde nicht gefunden."));
        entity.setDeletedAt(null);
        entity.setDeletedBy(null);
        entity.setDeleteReason(null);
        entity.setUpdatedAt(OffsetDateTime.now());
        return kundenRepository.save(entity);
    }

    public List<KundenObjektEntity> listObjekte(UUID tenantId, UUID kundenId) {
        requireKunde(tenantId, kundenId);
        return objektRepository.findByTenantIdAndKundenIdAndDeletedAtIsNull(tenantId, kundenId);
    }

    @Transactional
    public KundenObjektEntity createObjekt(UUID tenantId, UUID kundenId, CreateObjektInput input) {
        requireKunde(tenantId, kundenId);
        OffsetDateTime now = OffsetDateTime.now();
        KundenObjektEntity entity = new KundenObjektEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setKundenId(kundenId);
        entity.setName(requireText(input.name(), "name"));
        entity.setObjektTyp(defaultText(input.objektTyp(), "SONSTIGES"));
        entity.setAdresse(requireText(input.adresse(), "adresse"));
        entity.setRegion(defaultText(input.region(), "DE"));
        entity.setServiceIntervalDays(input.serviceIntervalDays() != null ? input.serviceIntervalDays() : 30);
        entity.setZugangshinweise(input.zugangshinweise());
        entity.setRiskClass(defaultText(input.riskClass(), "LOW"));
        entity.setStatus(defaultText(input.status(), "AKTIV"));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return objektRepository.save(entity);
    }

    @Transactional
    public KundenObjektEntity updateObjekt(UUID tenantId, UUID kundenId, UUID objektId, UpdateObjektInput input) {
        KundenObjektEntity entity = requireObjekt(tenantId, kundenId, objektId);
        if (input.name() != null && !input.name().isBlank()) {
            entity.setName(input.name().trim());
        }
        if (input.objektTyp() != null && !input.objektTyp().isBlank()) {
            entity.setObjektTyp(input.objektTyp().trim().toUpperCase(Locale.ROOT));
        }
        if (input.adresse() != null && !input.adresse().isBlank()) {
            entity.setAdresse(input.adresse().trim());
        }
        if (input.region() != null && !input.region().isBlank()) {
            entity.setRegion(input.region().trim().toUpperCase(Locale.ROOT));
        }
        if (input.serviceIntervalDays() != null) {
            entity.setServiceIntervalDays(input.serviceIntervalDays());
        }
        if (input.zugangshinweise() != null) {
            entity.setZugangshinweise(input.zugangshinweise().trim());
        }
        if (input.riskClass() != null && !input.riskClass().isBlank()) {
            entity.setRiskClass(input.riskClass().trim().toUpperCase(Locale.ROOT));
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return objektRepository.save(entity);
    }

    @Transactional
    public void deleteObjekt(UUID tenantId, UUID kundenId, UUID objektId, UUID actorUserId, String reason) {
        KundenObjektEntity entity = requireObjekt(tenantId, kundenId, objektId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        objektRepository.save(entity);
    }

    public List<KundenAnsprechpartnerEntity> listAnsprechpartner(UUID tenantId, UUID kundenId) {
        requireKunde(tenantId, kundenId);
        return ansprechpartnerRepository.findByTenantIdAndKundenIdAndDeletedAtIsNull(tenantId, kundenId);
    }

    @Transactional
    public KundenAnsprechpartnerEntity createAnsprechpartner(UUID tenantId, UUID kundenId, CreateAnsprechpartnerInput input) {
        requireKunde(tenantId, kundenId);
        OffsetDateTime now = OffsetDateTime.now();
        KundenAnsprechpartnerEntity entity = new KundenAnsprechpartnerEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setKundenId(kundenId);
        entity.setName(requireText(input.name(), "name"));
        entity.setRolle(defaultText(input.rolle(), "ANSPRECHPARTNER"));
        entity.setEmail(defaultText(input.email(), "unknown@example.com"));
        entity.setTelefon(defaultText(input.telefon(), "n/a"));
        entity.setBevorzugterKanal(defaultText(input.bevorzugterKanal(), "email"));
        entity.setDsgvoConsent(defaultText(input.dsgvoConsent(), "UNBEKANNT"));
        entity.setStatus(defaultText(input.status(), "NEU"));
        entity.setIsPrimary(input.isPrimary() != null ? input.isPrimary() : Boolean.FALSE);
        entity.setLastContactAt(input.lastContactAt());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return ansprechpartnerRepository.save(entity);
    }

    @Transactional
    public KundenAnsprechpartnerEntity updateAnsprechpartner(
        UUID tenantId,
        UUID kundenId,
        UUID ansprechpartnerId,
        UpdateAnsprechpartnerInput input
    ) {
        KundenAnsprechpartnerEntity entity = requireAnsprechpartner(tenantId, kundenId, ansprechpartnerId);
        if (input.name() != null && !input.name().isBlank()) {
            entity.setName(input.name().trim());
        }
        if (input.rolle() != null && !input.rolle().isBlank()) {
            entity.setRolle(input.rolle().trim());
        }
        if (input.email() != null && !input.email().isBlank()) {
            entity.setEmail(input.email().trim().toLowerCase(Locale.ROOT));
        }
        if (input.telefon() != null && !input.telefon().isBlank()) {
            entity.setTelefon(input.telefon().trim());
        }
        if (input.bevorzugterKanal() != null && !input.bevorzugterKanal().isBlank()) {
            entity.setBevorzugterKanal(input.bevorzugterKanal().trim());
        }
        if (input.dsgvoConsent() != null && !input.dsgvoConsent().isBlank()) {
            entity.setDsgvoConsent(input.dsgvoConsent().trim().toUpperCase(Locale.ROOT));
        }
        if (input.status() != null && !input.status().isBlank()) {
            entity.setStatus(input.status().trim().toUpperCase(Locale.ROOT));
        }
        if (input.isPrimary() != null) {
            entity.setIsPrimary(input.isPrimary());
        }
        if (input.lastContactAt() != null) {
            entity.setLastContactAt(input.lastContactAt());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return ansprechpartnerRepository.save(entity);
    }

    @Transactional
    public void deleteAnsprechpartner(UUID tenantId, UUID kundenId, UUID ansprechpartnerId, UUID actorUserId, String reason) {
        KundenAnsprechpartnerEntity entity = requireAnsprechpartner(tenantId, kundenId, ansprechpartnerId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        ansprechpartnerRepository.save(entity);
    }

    public List<KundenReminderEntity> listReminder(UUID tenantId, UUID kundenId) {
        requireKunde(tenantId, kundenId);
        return reminderRepository.findByTenantIdAndKundenIdAndDeletedAtIsNull(tenantId, kundenId);
    }

    @Transactional
    public KundenReminderEntity createReminder(UUID tenantId, UUID kundenId, CreateReminderInput input) {
        requireKunde(tenantId, kundenId);
        OffsetDateTime now = OffsetDateTime.now();
        KundenReminderEntity entity = new KundenReminderEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setKundenId(kundenId);
        entity.setScope(defaultText(input.scope(), "KUNDE"));
        entity.setTargetId(input.targetId());
        entity.setTitle(requireText(input.title(), "title"));
        entity.setPriority(defaultText(input.priority(), "MEDIUM"));
        entity.setStartAt(input.startAt() != null ? input.startAt() : now);
        entity.setDueAt(input.dueAt() != null ? input.dueAt() : now.plusDays(7));
        entity.setBreachState(defaultText(input.breachState(), "ON_TRACK"));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        return reminderRepository.save(entity);
    }

    @Transactional
    public KundenReminderEntity updateReminder(UUID tenantId, UUID kundenId, UUID reminderId, UpdateReminderInput input) {
        KundenReminderEntity entity = requireReminder(tenantId, kundenId, reminderId);
        if (input.scope() != null && !input.scope().isBlank()) {
            entity.setScope(input.scope().trim().toUpperCase(Locale.ROOT));
        }
        if (input.targetId() != null) {
            entity.setTargetId(input.targetId());
        }
        if (input.title() != null && !input.title().isBlank()) {
            entity.setTitle(input.title().trim());
        }
        if (input.priority() != null && !input.priority().isBlank()) {
            entity.setPriority(input.priority().trim().toUpperCase(Locale.ROOT));
        }
        if (input.startAt() != null) {
            entity.setStartAt(input.startAt());
        }
        if (input.dueAt() != null) {
            entity.setDueAt(input.dueAt());
        }
        if (input.breachState() != null && !input.breachState().isBlank()) {
            entity.setBreachState(input.breachState().trim().toUpperCase(Locale.ROOT));
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return reminderRepository.save(entity);
    }

    @Transactional
    public void deleteReminder(UUID tenantId, UUID kundenId, UUID reminderId, UUID actorUserId, String reason) {
        KundenReminderEntity entity = requireReminder(tenantId, kundenId, reminderId);
        entity.setDeletedAt(OffsetDateTime.now());
        entity.setDeletedBy(actorUserId);
        entity.setDeleteReason(defaultText(reason, "MANUAL_DELETE"));
        entity.setUpdatedAt(OffsetDateTime.now());
        reminderRepository.save(entity);
    }

    private boolean matchesSearch(KundenEntity entity, String search) {
        return entity.getName().toLowerCase(Locale.ROOT).contains(search)
            || entity.getNumber().toLowerCase(Locale.ROOT).contains(search)
            || entity.getRegion().toLowerCase(Locale.ROOT).contains(search);
    }

    private KundenEntity requireKunde(UUID tenantId, UUID kundenId) {
        KundenEntity entity = kundenRepository.findByTenantIdAndId(tenantId, kundenId)
            .orElseThrow(() -> new IllegalArgumentException("Kunde nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Kunde wurde gelöscht.");
        }
        return entity;
    }

    private KundenObjektEntity requireObjekt(UUID tenantId, UUID kundenId, UUID objektId) {
        KundenObjektEntity entity = objektRepository.findByTenantIdAndKundenIdAndId(tenantId, kundenId, objektId)
            .orElseThrow(() -> new IllegalArgumentException("Objekt nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Objekt wurde gelöscht.");
        }
        return entity;
    }

    private KundenAnsprechpartnerEntity requireAnsprechpartner(UUID tenantId, UUID kundenId, UUID ansprechpartnerId) {
        KundenAnsprechpartnerEntity entity = ansprechpartnerRepository.findByTenantIdAndKundenIdAndId(
                tenantId,
                kundenId,
                ansprechpartnerId
            )
            .orElseThrow(() -> new IllegalArgumentException("Ansprechpartner nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Ansprechpartner wurde gelöscht.");
        }
        return entity;
    }

    private KundenReminderEntity requireReminder(UUID tenantId, UUID kundenId, UUID reminderId) {
        KundenReminderEntity entity = reminderRepository.findByTenantIdAndKundenIdAndId(tenantId, kundenId, reminderId)
            .orElseThrow(() -> new IllegalArgumentException("Reminder nicht gefunden."));
        if (entity.getDeletedAt() != null) {
            throw new IllegalArgumentException("Reminder wurde gelöscht.");
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

    public record CreateKundeInput(
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

    public record UpdateKundeInput(
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

    public record CreateObjektInput(
        String name,
        String objektTyp,
        String adresse,
        String region,
        Integer serviceIntervalDays,
        String zugangshinweise,
        String riskClass,
        String status
    ) {}

    public record UpdateObjektInput(
        String name,
        String objektTyp,
        String adresse,
        String region,
        Integer serviceIntervalDays,
        String zugangshinweise,
        String riskClass,
        String status
    ) {}

    public record CreateAnsprechpartnerInput(
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

    public record UpdateAnsprechpartnerInput(
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

    public record CreateReminderInput(
        String scope,
        UUID targetId,
        String title,
        String priority,
        OffsetDateTime startAt,
        OffsetDateTime dueAt,
        String breachState
    ) {}

    public record UpdateReminderInput(
        String scope,
        UUID targetId,
        String title,
        String priority,
        OffsetDateTime startAt,
        OffsetDateTime dueAt,
        String breachState
    ) {}

    public Map<String, Object> summarizeKunde(KundenEntity kunde) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", kunde.getId());
        summary.put("number", kunde.getNumber());
        summary.put("name", kunde.getName());
        summary.put("branche", kunde.getBranche());
        summary.put("segment", kunde.getSegment());
        summary.put("status", kunde.getStatus());
        summary.put("ownerUserId", kunde.getOwnerUserId());
        summary.put("score", kunde.getScore());
        summary.put("consentState", kunde.getConsentState());
        summary.put("retentionClass", kunde.getRetentionClass());
        summary.put("region", kunde.getRegion());
        summary.put("nextFollowUpAt", kunde.getNextFollowUpAt());
        summary.put("createdAt", kunde.getCreatedAt());
        summary.put("updatedAt", kunde.getUpdatedAt());
        return summary;
    }
}
