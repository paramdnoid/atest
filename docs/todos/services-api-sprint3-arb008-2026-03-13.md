# ARB-008 – Contract/E2E-Baseline (services/api)

## Umgesetzt
- Controller-Contract-Tests für kritische Endpunkte in:
  - `KundenController`
  - `AngebotController`
  - `AufmassController`
  - `AbnahmeController`
- Fokus je Controller:
  - Auth-Gate (`401` bei fehlender Session)
  - Role-Gate für mutierende Endpunkte (`403` für `member`, `200` für `admin`)
  - Response-Form-Baseline (`items`/`item` Schlüssel, Statuscode `200`)

## Technischer Ansatz
- Bestehendes Testmuster beibehalten:
  - Mockito Mocks
  - direkte Controller-Aufrufe
  - keine neuen Frameworks

## Betroffene Tests
- `services/api/src/test/java/com/zunftgewerk/api/modules/kunden/web/KundenControllerTest.java`
- `services/api/src/test/java/com/zunftgewerk/api/modules/angebote/web/AngebotControllerTest.java`
- `services/api/src/test/java/com/zunftgewerk/api/modules/aufmass/web/AufmassControllerTest.java`
- `services/api/src/test/java/com/zunftgewerk/api/modules/abnahmen/web/AbnahmeControllerTest.java`
