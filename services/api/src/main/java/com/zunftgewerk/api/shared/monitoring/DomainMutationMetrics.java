package com.zunftgewerk.api.shared.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class DomainMutationMetrics {

    private static final String METRIC_NAME = "zg_domain_mutation_total";
    private static final String[] DOMAINS = {"kunden", "angebote", "aufmass", "abnahmen"};
    private static final String[] OPERATIONS = {"create", "update", "delete", "restore"};

    private final Map<String, Counter> countersByKey;

    public DomainMutationMetrics(MeterRegistry meterRegistry) {
        this.countersByKey = new HashMap<>();
        for (String domain : DOMAINS) {
            for (String operation : OPERATIONS) {
                Counter counter = Counter.builder(METRIC_NAME)
                    .description("Mutierende Domain-Operationen")
                    .tag("domain", domain)
                    .tag("operation", operation)
                    .register(meterRegistry);
                countersByKey.put(key(domain, operation), counter);
            }
        }
    }

    public void recordCreate(String domain) {
        increment(domain, "create");
    }

    public void recordUpdate(String domain) {
        increment(domain, "update");
    }

    public void recordDelete(String domain) {
        increment(domain, "delete");
    }

    public void recordRestore(String domain) {
        increment(domain, "restore");
    }

    private void increment(String domain, String operation) {
        Counter counter = countersByKey.get(key(domain, operation));
        if (counter != null) {
            counter.increment();
        }
    }

    private String key(String domain, String operation) {
        return domain + ":" + operation;
    }
}
