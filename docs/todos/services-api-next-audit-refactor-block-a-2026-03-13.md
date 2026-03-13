# Services API Next Audit Refactor Block A (2026-03-13)

## Ziel
- Sicherheits- und Robustheitsniveau der Auth-Pfade in `services/api` gezielt erhöhen, ohne Architekturbruch und ohne neue Framework-Abhängigkeiten.
- Konkrete Risiken aus Security-/Abuse-/Fehlerbehandlungsperspektive priorisieren und in produktionssichere P0/P1-Umsetzungen überführen.

## Scope
- Fokus auf `modules/identity` und unmittelbar angrenzende Web-Schicht:
  - `AuthController`
  - Verifikation über bestehende Unit-/Service-Tests
- Keine Änderungen an Frontend, Infra oder nicht-authentifizierungsbezogenen Backend-Modulen.

## Technische Risikoanalyse (Kurzfassung)
- **R1 – Informationsabfluss in Auth-Fehlern (P0):** Mehrere Endpunkte geben rohe Exception-Messages zurück, inkl. potenziell interner Fehlerdetails.
- **R2 – Fragile Fehlerbehandlung bei null/blank Inputs (P0):** Fehlende Vorvalidierung in kritischen Endpunkten kann zu inkonsistenten Statuscodes und instabilen Fehlerpfaden führen.
- **R3 – Caching sensibler Auth-Antworten (P1):** Antworten mit Access-/MFA-Token sind nicht durchgängig mit `no-store` abgesichert.
- **R4 – Rate-Limit-Antwort ohne standardisierten Retry-Hinweis (P1):** Body enthält Retry-Wert, aber Header `Retry-After` fehlte.
- **R5 – Wartbarkeit von Input-/Mode-Checks (P1):** Passkey-Mode-Parsing war implizit/fallback-lastig statt explizit validiert.

## Priorisierte Tasks

### P0
- **P0.1 Sanitized Auth Error Responses**
  - Für Login/Passkey/MFA/Refresh in `AuthController` keine ungefilterten Exception-Texte mehr nach außen geben.
  - Einheitliche, sichere Fehlermeldungen für Unauthorized-Pfade.
- **P0.2 Harte Request-Vorvalidierung für kritische Auth-Endpunkte**
  - Null/Blank-Checks vor Business-Logik und vor Rate-Limit-Identifikatoren.
  - Explizite 400-Responses bei fehlenden Pflichtfeldern.

### P1
- **P1.1 No-Store Cache-Header für tokenhaltige Antworten**
  - `Cache-Control`, `Pragma`, `Expires` auf Login/MFA/Refresh-Antworten, die sensitive Tokens enthalten.
- **P1.2 Retry-After Header bei Rate-Limit**
  - Ergänzung um standardkonformen Header zusätzlich zum bestehenden Response-Body.
- **P1.3 Striktes Passkey-Mode-Parsing**
  - Nur `register` oder `authenticate` akzeptieren; sonst `400`.

## Akzeptanzkriterien
- Auth-Endpunkte liefern bei Fehlern keine internen Stack-/Runtime-Details.
- Ungültige/mangelhafte Requests schlagen deterministisch mit `400` fehl.
- Erfolgreiche Token-Ausgaben enthalten `no-store` Header.
- Rate-limitierte Antworten enthalten `Retry-After`.
- Für neue/veränderte Controller-Logik existieren automatisierte Tests.

## Quality Gates
- Relevante Tests in `services/api` grün.
- Keine neuen Linter-/Kompilierfehler in geänderten Klassen.
- Keine Verletzung bestehender Konventionen:
  - Constructor Injection only
  - `ResponseEntity` + `Map.of` Pattern
  - Keine zusätzlichen Frameworks

## Definition of Done
- P0 vollständig implementiert und getestet.
- Sinnvolle P1-Härtungen implementiert und getestet.
- Verifikation über Gradle-Testlauf dokumentiert.
- Rest-Risiken explizit benannt.

## Pragmatiche Annahmen
- Fehlermeldungen in Auth-Pfaden werden absichtlich generalisiert, um Enumeration/Detail-Leaks zu minimieren.
- Bestehende Service-/Domain-Exceptions bleiben intern unverändert; die Härtung erfolgt primär auf Controller-Ebene.
- Einheitliches Input-Validierungsverhalten wird ohne neue Bean-Validation-DTOs umgesetzt, um Scope und Risiko niedrig zu halten.
