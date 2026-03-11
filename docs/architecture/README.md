# Architektur-Dokumentation

Dokumentation der Systemarchitektur nach C4-Logik (Kontext, Container, Komponenten) plus Daten-, Sicherheits-, API- und Betriebsaspekte.

## Inhalte

| Dokument | Fokus |
|---|---|
| [System Context](./system-context.md) | Externe Akteure, Drittanbieter, Systemgrenzen |
| [Container Architecture](./container-architecture.md) | Hauptanwendungen und Kommunikationswege |
| [Component Architecture](./component-architecture.md) | Backend-Module und fachliche Verantwortungen |
| [Data Architecture](./data-architecture.md) | Datenmodell-Invarianten, Sync-relevante Tabellen |
| [Security Architecture](./security-architecture.md) | Auth-Modell, Token-Strategie, Schutzmechanismen |
| [API Reference](./api-reference.md) | Kernendpunkte und gRPC-Services |
| [Deployment & Infrastructure](./deployment-infrastructure.md) | Lokaler Betrieb, Deployment-Grundlagen, Betriebspfade |
| [Architecture Decision Records](./adr/) | Dauerhafte Architekturentscheidungen |

## Leitplanken

- Bei Konflikt zwischen Doku und Code gilt der Code als Quelle der Wahrheit.
- Versionen, Ports und Limits werden nur dokumentiert, wenn sie fuer Entscheidungen oder Betrieb relevant sind.
- Sicherheits- und Multi-Tenant-Invarianten bleiben explizit dokumentiert.
