# Services API Next Audit Refactor Block B (2026-03-13)

## Ziel
- Backend-Auth-Härtung aus Block A vollständig abschließen.
- Konsistente, sichere und vorhersehbare Fehlerpfade über alle relevanten Auth-Endpunkte sicherstellen.
- Restliche Inkonsistenzen (Validation, i18n/Fehlermeldungen, Sanitization) schließen.

## Scope
- `services/api/src/main/java/com/zunftgewerk/api/modules/identity/web/AuthController.java`
- `services/api/src/test/java/com/zunftgewerk/api/modules/identity/AuthControllerTest.java`

## Umgesetzte Tasks

### P0
- **P0.1 Null-/Blank-Validation vervollständigt**
  - Für `signup`, `request-password-reset`, `reset-password`, `enable-mfa`, `disable-mfa` konsistente Guard-Checks ergänzt.
- **P0.2 Fehler-Sanitization lückenlos**
  - Rohe `IllegalArgumentException`-Texte in Signup/Reset/MFA-Disable werden nicht mehr an Clients durchgereicht.
  - Konsistente sichere Fehlermeldungen pro Endpunkt eingeführt.

### P1
- **P1.1 Inkonsistente Unauthorized-Messages vereinheitlicht**
  - `mfa/status` liefert bei fehlender Session nun ein neutrales, konsistentes `Not authenticated`.
- **P1.2 Konsistenz-Refactor in Controller-Helfern**
  - Direkte `ResponseEntity.badRequest()`-Sonderfälle auf zentrale Helper (`badRequest`, `unauthorized`) harmonisiert.
- **P1.3 Testabdeckung für neue Härtefälle**
  - Neue Controller-Tests für Null-Requests, Sanitization und MFA-Disable-Randfälle hinzugefügt.

## Akzeptanzkriterien
- Kein Leak interner Exception-Details in den bearbeiteten Auth-Pfaden.
- Alle neu gehärteten Endpunkte reagieren bei invaliden Inputs deterministisch mit `400`.
- Bestehende Login/MFA/Refresh-Sicherheitsgarantien aus Block A bleiben intakt.
- Relevante Tests laufen grün.

## Quality Gates
- `cd services/api && ./gradlew test --tests "com.zunftgewerk.api.modules.identity.AuthControllerTest" --tests "com.zunftgewerk.api.modules.identity.RefreshTokenServiceTest"`

## Definition of Done
- Block A + B zusammen decken die priorisierten Auth-Controller-Risiken vollständig ab.
- Änderungen sind getestet, dokumentiert und rückwärtskompatibel im API-Verhalten (Statuscodes + Fehlerschlüssel).
