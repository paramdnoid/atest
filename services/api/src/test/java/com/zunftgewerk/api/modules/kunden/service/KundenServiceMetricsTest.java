package com.zunftgewerk.api.modules.kunden.service;

import com.zunftgewerk.api.modules.kunden.entity.KundenEntity;
import com.zunftgewerk.api.modules.kunden.repository.KundenAnsprechpartnerRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenObjektRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenReminderRepository;
import com.zunftgewerk.api.modules.kunden.repository.KundenRepository;
import com.zunftgewerk.api.shared.audit.DomainMutationAuditLogger;
import com.zunftgewerk.api.shared.monitoring.DomainMutationMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KundenServiceMetricsTest {

    @Test
    void shouldIncrementCreateCounterWhenKundeCreated() {
        KundenRepository kundenRepository = mock(KundenRepository.class);
        KundenObjektRepository objektRepository = mock(KundenObjektRepository.class);
        KundenAnsprechpartnerRepository ansprechpartnerRepository = mock(KundenAnsprechpartnerRepository.class);
        KundenReminderRepository reminderRepository = mock(KundenReminderRepository.class);
        DomainMutationAuditLogger auditLogger = mock(DomainMutationAuditLogger.class);

        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        DomainMutationMetrics metrics = new DomainMutationMetrics(meterRegistry);

        when(kundenRepository.existsByTenantIdAndNumber(any(), any())).thenReturn(false);
        when(kundenRepository.save(any(KundenEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KundenService service = new KundenService(
            kundenRepository,
            objektRepository,
            ansprechpartnerRepository,
            reminderRepository,
            metrics,
            auditLogger
        );

        UUID tenantId = UUID.randomUUID();
        UUID actorUserId = UUID.randomUUID();
        service.createKunde(
            tenantId,
            actorUserId,
            new KundenService.CreateKundeInput(
                "K-100",
                "Muster GmbH",
                "MALER",
                "STANDARD",
                "AKTIV",
                null,
                10,
                "ERTEILT",
                "STANDARD",
                "DE",
                null
            )
        );

        double counterValue = meterRegistry.get("zg_domain_mutation_total")
            .tag("domain", "kunden")
            .tag("operation", "create")
            .counter()
            .count();
        assertThat(counterValue).isEqualTo(1.0d);
    }
}
