# Architecture Diagrams

Zentrale Sammlung wiederverwendbarer Mermaid-Diagramme fuer Architekturkommunikation, Reviews und ADRs.

## Inhalte

| Diagramm | Zweck |
|---|---|
| `system-context.md` | C4 Level 1: Akteure, externe Systeme, Systemgrenze |
| `container-view.md` | C4 Level 2: Container, Protokolle und Datenhaltung |
| `auth-runtime-flow.md` | Laufzeitsicht: Login/MFA/Refresh inklusive Security-Checks |
| `sync-runtime-flow.md` | Laufzeitsicht: Push/Pull/Delta-Streaming und Idempotenz |
| `billing-webhook-flow.md` | Laufzeitsicht: Stripe-Webhook, Verarbeitung, Retry/Dead-Letter |

## Pflegehinweise

- Diagramme hier gelten als wiederverwendbare Quelle fuer andere Architekturdokumente.
- Bei fachlichen Aenderungen zuerst Diagramm hier aktualisieren, danach Einbettungen in anderen Dateien anpassen.
- Mermaid-Code bewusst kompakt halten und auf stabile Beziehungen fokussieren.
