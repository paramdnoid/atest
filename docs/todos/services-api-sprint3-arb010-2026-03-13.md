# ARB-010 – Async Events Baseline (services/api)

## Umgesetzt
- Leichtgewichtiges Domain-Event-Baseline auf Spring-Bordmitteln:
  - Event-Payload: `DomainMutationEventPayload`
  - Publisher-Service: `DomainEventPublisherService` (`ApplicationEventPublisher`)
  - Listener: `DomainMutationEventListener` (Logging + Meter-Increment)

## Event-Publikation
- Bei zentralen Top-Level-Mutationen in:
  - `kunden`
  - `angebote`
  - `aufmass`
  - `abnahmen`
- Für Operationen:
  - `create`
  - `update`
  - `delete`
  - `restore`

## Design-Notizen
- Minimal-invasiv: bestehende Service-Methoden erweitert, keine externe Queue/Bus-Infrastruktur.
- Constructor Injection only.
- Null-sicher:
  - Publisher normalisiert `metadata` auf leere `HashMap`.
- Listener erzeugt Metrik:
  - `zg_domain_event_total{domain,operation}`

## Betroffene Dateien
- `services/api/src/main/java/com/zunftgewerk/api/shared/events/DomainMutationEventPayload.java`
- `services/api/src/main/java/com/zunftgewerk/api/shared/events/DomainEventPublisherService.java`
- `services/api/src/main/java/com/zunftgewerk/api/shared/events/DomainMutationEventListener.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/kunden/service/KundenService.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/angebote/service/AngebotService.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/aufmass/service/AufmassService.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/abnahmen/service/AbnahmeService.java`
