package com.zunftgewerk.api.modules.opsworkflow.service;

import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeRecordRepository;
import com.zunftgewerk.api.modules.angebote.repository.AngebotRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassRecordRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OpsWorkflowService {

    private final KundenRepository kundenRepository;
    private final AngebotRepository angebotRepository;
    private final AufmassRecordRepository aufmassRecordRepository;
    private final AbnahmeRecordRepository abnahmeRecordRepository;

    public OpsWorkflowService(
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

    public Map<String, Object> workflowOverview(UUID tenantId) {
        Map<String, Object> overview = new HashMap<>();
        overview.put("kunden", summarizeByStatus(kundenRepository.findByTenantIdAndDeletedAtIsNull(tenantId), k -> k.getStatus()));
        overview.put("angebote", summarizeByStatus(angebotRepository.findByTenantIdAndDeletedAtIsNull(tenantId), a -> a.getStatus()));
        overview.put("aufmass", summarizeByStatus(aufmassRecordRepository.findByTenantIdAndDeletedAtIsNull(tenantId), a -> a.getStatus()));
        overview.put("abnahmen", summarizeByStatus(abnahmeRecordRepository.findByTenantIdAndDeletedAtIsNull(tenantId), a -> a.getStatus()));
        return overview;
    }

    private <T> Map<String, Object> summarizeByStatus(Iterable<T> entities, Function<T, String> statusProvider) {
        var list = new java.util.ArrayList<T>();
        entities.forEach(list::add);
        var byStatus = list.stream()
            .collect(Collectors.groupingBy(
                entity -> {
                    String status = statusProvider.apply(entity);
                    return status == null || status.isBlank() ? "UNKNOWN" : status;
                },
                Collectors.counting()
            ));
        Map<String, Object> result = new HashMap<>();
        result.put("total", list.size());
        result.put("byStatus", byStatus);
        return result;
    }
}
