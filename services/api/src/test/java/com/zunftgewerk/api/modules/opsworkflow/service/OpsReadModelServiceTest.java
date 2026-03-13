package com.zunftgewerk.api.modules.opsworkflow.service;

import com.zunftgewerk.api.modules.abnahmen.repository.AbnahmeRecordRepository;
import com.zunftgewerk.api.modules.angebote.repository.AngebotRepository;
import com.zunftgewerk.api.modules.aufmass.repository.AufmassRecordRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OpsReadModelServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void shouldBuildNullSafeOverviewWithTotals() {
        KundenRepository kundenRepository = mock(KundenRepository.class);
        AngebotRepository angebotRepository = mock(AngebotRepository.class);
        AufmassRecordRepository aufmassRecordRepository = mock(AufmassRecordRepository.class);
        AbnahmeRecordRepository abnahmeRecordRepository = mock(AbnahmeRecordRepository.class);

        UUID tenantId = UUID.randomUUID();

        when(kundenRepository.countActiveByStatus(tenantId)).thenReturn(List.of(
            new Object[]{"AKTIV", 3L},
            new Object[]{null, 1L}
        ));
        when(angebotRepository.countActiveByStatus(tenantId)).thenReturn(List.<Object[]>of(
            new Object[]{"DRAFT", 2L}
        ));
        when(aufmassRecordRepository.countActiveByStatus(tenantId)).thenReturn(List.of());
        when(abnahmeRecordRepository.countActiveByStatus(tenantId)).thenReturn(List.of(
            new Object[]{"OPEN", 4L},
            new Object[]{"DONE", 2L}
        ));

        OpsReadModelService service = new OpsReadModelService(
            kundenRepository,
            angebotRepository,
            aufmassRecordRepository,
            abnahmeRecordRepository
        );

        Map<String, Object> overview = service.overview(tenantId);
        Map<String, Object> kunden = (Map<String, Object>) overview.get("kunden");
        Map<String, Long> kundenStatusSplit = (Map<String, Long>) kunden.get("statusSplit");
        assertThat(kunden.get("total")).isEqualTo(4L);
        assertThat(kundenStatusSplit.get("AKTIV")).isEqualTo(3L);
        assertThat(kundenStatusSplit.get("UNKNOWN")).isEqualTo(1L);

        Map<String, Object> aufmass = (Map<String, Object>) overview.get("aufmass");
        assertThat(aufmass.get("total")).isEqualTo(0L);
    }
}
