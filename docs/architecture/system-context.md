# System Context (C4 Level 1)

Diagrammquelle: `docs/architecture/diagrams/system-context.md`

## Actors

| Actor | Type | Description |
|---|---|---|
| Mitarbeiter im Betrieb | Human | Nutzt Landing/Web/Mobile fuer operative Aufgaben |
| Tenant Owner/Admin | Human | Verantwortet Team, Berechtigungen und Abrechnung |
| Operations/Finance | Human | Bearbeitet Betriebs- und Billingvorfaelle |

## Stakeholder und Ziele

| Stakeholder | Primere Ziele | Architekturbezug |
|---|---|---|
| Produkt/Business | Schnelle Feature-Iteration | Modularer Monolith, klare Modulgrenzen |
| Operations | Stabiler, beobachtbarer Betrieb | Runbooks, Recovery-Endpunkte, zentrale Konfiguration |
| Security/Compliance | Schutz sensibler Daten | MFA, Audit, Token-Rotation, Tenant-Isolation |
| Entwicklungsteam | Hohe Aenderbarkeit | C4-Doku, ADR-Prozess, konsistente Schnittstellen |

## External Systems

| System | Integration | Purpose |
|---|---|---|
| Stripe | REST + Webhooks | Subscription/Billing Events |
| SMTP Provider | SMTP | E-Mail Versand (Verifikation, Passwort-Reset) |
| Geocoding Provider | REST | Adresssuche (ueber App-Proxy) |

## System Boundaries

### Internal (owned by Zunftgewerk)

- Landing App: Marketing, Auth, Onboarding, einfacher Workspace-Zugang.
- Web App: Tenant-Administration, Lizenzen, operative Verwaltung.
- Mobile App: Offline-first Feldanwendung mit Sync.
- API: Modularer Monolith mit zentraler Fachlogik.

### External (third-party)

- Zahlungsabwicklung liegt bei Stripe.
- E-Mail Versand liegt beim SMTP-Provider.
- Geocoding liegt beim externen Karten-/Adressdienst.

## Communication Patterns

| From | To | Protocol | Auth |
|---|---|---|---|
| Landing App | API | HTTPS REST | Cookie-basierte Session + Token-Flows |
| Web App | API | HTTPS REST | Bearer JWT |
| Mobile App | API | gRPC | JWT in Metadata |
| API | Stripe | HTTPS REST | API key |
| Stripe | API | HTTPS Webhook | Signature verification |
| API | SMTP | SMTP/TLS | Provider credentials |
| API | PostgreSQL/Redis | Intern | Service credentials/config |
