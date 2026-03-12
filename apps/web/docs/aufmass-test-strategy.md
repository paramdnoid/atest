# Aufmaß Teststrategie (Frontend-only)

## Kernflüsse

- Entwurf mit Messwerten erstellen
- Entwurf zur Prüfung senden
- Prüfung freigeben oder mit Kommentar zurückgeben
- Freigegebenes Aufmaß als abgerechnet markieren
- Quick-Capture auf mobilem Viewport nutzen

## State-Machine Tests

- Erlaubte Übergänge:
  - `DRAFT -> IN_REVIEW`
  - `IN_REVIEW -> DRAFT`
  - `IN_REVIEW -> APPROVED`
  - `APPROVED -> BILLED`
- Verbotene Übergänge:
  - `DRAFT -> APPROVED`
  - `IN_REVIEW -> BILLED`
  - `BILLED -> DRAFT`
- Guard-Prüfungen:
  - Ohne Messwerte oder Mapping kein `IN_REVIEW`
  - Mit `blocking` Issue kein `APPROVED`

## Komponenten-Checks

- `AufmassListTable`: Filter + Statusbadges + Navigation in Detailroute
- `ReviewDiffPanel`: Blocker/Warnung visuell unterscheidbar
- `BillingPreviewCard`: Summen + Formeln je Position sichtbar
- `QuickCaptureDrawer`: Pflichtfelder vor Speichern
- Legacy-Migration:
  - Klassifizierung `migrated_confident|migrated_partial|legacy_unparsed`
  - Assisted-Konvertierung über CTA `Jetzt konvertieren`
  - Nach Konvertierung: Builder-Herleitung in Grid/Abrechnung sichtbar

## E2E

- Datei: `e2e/aufmass-workflow.spec.ts`
- Szenario:
  - Login mit MFA
  - Aufmaßmodul öffnen (falls für Profil sichtbar)
  - Detailseite öffnen
  - Quick-Capture CTA sichtbar
  - Review-Tab: Assisted-Migration CTA sichtbar
  - Abrechnung: Brutto/Abzug + normalisierte Herleitung sichtbar
