# Quality Attributes and Cross-Cutting Concerns

## Priorisierte Qualitaetsziele

| Attribut | Ziel | Architekturhebel |
|---|---|---|
| Sicherheit | Schutz von Tenant- und Auth-Daten | RS256 JWT, MFA, Token-Rotation, Audit, Rate-Limits |
| Verfuegbarkeit | Robuster Betrieb trotz Teilstoerungen | Webhook-Retry + Dead-Letter, stateless API-Instanzen |
| Wartbarkeit | Aenderungen mit begrenztem Impact | Modularer Monolith, klare Modulgrenzen, ADR-Prozess |
| Performance | Reaktionsfaehige User-Flows | REST fuer Browser, gRPC fuer Mobile, Redis fuer technische Hot Paths |
| Skalierbarkeit | Wachstum nach Tenant- und Lastprofil | Horizontale API-Skalierung, DB-Indizes, asynchrone Billing-Verarbeitung |

## Performance und Skalierung

- Browser-Workloads laufen ueber REST mit session-/token-basierter Auth.
- Mobile Sync nutzt gRPC und protobuf fuer effizientere Payloads.
- Redis entkoppelt Rate-Limits und technische Kurzzeitdaten vom Hauptspeicher.
- Datenbank bleibt gemeinsame Quelle; Skalierung primär ueber Query-Optimierung, Indizes und API-Replikate.

## Zuverlaessigkeit und Resilienz

- Stripe-Webhooks werden signiert validiert, dedupliziert und fehlertolerant verarbeitet.
- Nicht verarbeitbare Billing-Events landen in einem Dead-Letter-Pfad mit Recovery-Endpunkt.
- Token-Reuse-Detection verhindert stille Session-Uebernahmen.
- Runbooks in `docs/runbooks/` bilden Incident-Playbooks fuer kritische Stoerungsbilder.

## Beobachtbarkeit und Betrieb

- API-Logs und Fehlerpfade muessen korrelierbar sein (insb. Auth, Billing, Sync).
- Betriebsrelevante Konfigurationen (JWT, MFA, Stripe, CORS/Origin) sind pro Umgebung explizit zu setzen.
- Releases benoetigen gruene Build-/Test-Signale fuer Frontend und Backend.

## Evolution und Aenderbarkeit

- Neue Domainen werden bevorzugt als eigenes Modul im Monolithen eingefuehrt.
- Querbeziehungen zwischen Modulen erfolgen ueber klar definierte Service-Grenzen, nicht ueber implizite Seiteneffekte.
- Architekturentscheidungen mit langfristigem Impact werden als ADR dokumentiert.

## Risiken und technische Schulden

- Gemeinsame Datenbank vereinfacht Konsistenz, kann aber bei stark wachsender Last zum Skalierungsengpass werden.
- Harte Feature-Flags im Code statt zentralem Flag-Service erschweren schrittweise Rollouts.
- Dokumentierte Architektur-Claims koennen ohne aktive Pflege veralten; Gegenmassnahmen in `documentation-maintenance.md`.
