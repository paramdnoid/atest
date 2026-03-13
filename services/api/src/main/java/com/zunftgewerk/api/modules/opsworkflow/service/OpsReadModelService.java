package com.zunftgewerk.api.modules.opsworkflow.service;

import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeRecordRepository;
import com.zunftgewerk.api.modules.angebote.repository.AngebotRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassRecordRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class OpsReadModelService {

    private static final List<String> KUNDEN_STATUSES = List.of("AKTIV", "INAKTIV", "LEAD");
    private static final List<String> ANGEBOT_STATUSES = List.of("DRAFT", "SENT", "ACCEPTED", "REJECTED");
    private static final List<String> AUFMASS_STATUSES = List.of("DRAFT", "IN_REVIEW", "APPROVED");
    private static final List<String> ABNAHME_STATUSES = List.of("DRAFT", "OPEN", "IN_PROGRESS", "DONE");

    private final KundenRepository kundenRepository;
    private final AngebotRepository angebotRepository;
    private final AufmassRecordRepository aufmassRecordRepository;
    private final AbnahmeRecordRepository abnahmeRecordRepository;

    public OpsReadModelService(
        KundenRepository kundenRepository,
        AngebotRepository angebotRepository,
        AufmassRecordRepository aufmassRecordRepository,
        AbnahmeRecordRepository abnahmeRecordRepository
    ) {
        this.kundenRepository = kundenRepository;
        this.angebotRepository = angebotRepository;
        this.aufmassRecordRepository = aufmassRecordRepository;
        this.abnahmeRecordRepository = abnahmeRecordRepository;
    }

    public Map<String, Object> overview(UUID tenantId) {
        Map<String, Object> overview = new HashMap<>();
        overview.put("generatedAt", OffsetDateTime.now());
        overview.put("kunden", buildDomainSummary(kundenRepository.countActiveByStatus(tenantId), KUNDEN_STATUSES));
        overview.put("angebote", buildDomainSummary(angebotRepository.countActiveByStatus(tenantId), ANGEBOT_STATUSES));
        overview.put("aufmass", buildDomainSummary(aufmassRecordRepository.countActiveByStatus(tenantId), AUFMASS_STATUSES));
        overview.put("abnahmen", buildDomainSummary(abnahmeRecordRepository.countActiveByStatus(tenantId), ABNAHME_STATUSES));
        return overview;
    }

    private Map<String, Object> buildDomainSummary(List<Object[]> rawStatusCounts, List<String> relevantStatuses) {
        Map<String, Long> statusSplit = new HashMap<>();
        for (Object[] row : rawStatusCounts) {
            String rawStatus = row != null && row.length > 0 && row[0] != null ? row[0].toString() : null;
            Number rawCount = row != null && row.length > 1 && row[1] instanceof Number ? (Number) row[1] : 0L;
            String normalizedStatus = normalizeStatus(rawStatus);
            statusSplit.merge(normalizedStatus, rawCount.longValue(), Long::sum);
        }

        long total = statusSplit.values().stream().mapToLong(Long::longValue).sum();
        Map<String, Long> relevantSplit = new HashMap<>();
        for (String relevantStatus : relevantStatuses) {
            relevantSplit.put(relevantStatus, statusSplit.getOrDefault(relevantStatus, 0L));
        }
        long coveredByRelevant = relevantSplit.values().stream().mapToLong(Long::longValue).sum();
        relevantSplit.put("UNKNOWN", Math.max(0L, total - coveredByRelevant));

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", total);
        summary.put("statusSplit", statusSplit);
        summary.put("relevantStatusSplit", relevantSplit);
        return summary;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "UNKNOWN";
        }
        return status.trim().toUpperCase(Locale.ROOT);
    }
}
