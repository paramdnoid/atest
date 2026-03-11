# Documentation Maintenance

## Ziel

Architekturdokumentation bleibt release-nah, pruefbar und fuer Entwicklung wie Betrieb gleichermassen nutzbar.

## Pflegeprozess

1. **Aenderung erkennen:** Architekturrelevante Aenderung (Schnittstelle, Modulgrenze, Datenmodell, Security-Flow).
2. **Dokumentation aktualisieren:** Betroffene Architekturdateien und ggf. ADR anpassen.
3. **Review durchfuehren:** Mindestens ein fachlich verantwortliches Teammitglied prueft die Aenderung.
4. **Merge-Kriterium:** PR ist nur dann "done", wenn Code und Architekturdoku konsistent sind.

## Wann ist eine ADR Pflicht?

Eine ADR ist erforderlich, wenn mindestens einer der Punkte zutrifft:

- Dauerhafte Entscheidung mit systemweitem Impact.
- Trade-off zwischen mindestens zwei valablen Architekturansatzen.
- Aenderung an Sicherheits-, Daten- oder Integrationsgrundlagen.
- Entscheidung beeinflusst Betrieb, Skalierung oder Recovery signifikant.

## Checkliste pro Architektur-PR

- [ ] Betroffene C4-Sicht aktualisiert (`system-context`, `container`, `component`).
- [ ] Daten- und Security-Auswirkungen dokumentiert.
- [ ] API-/Protokollaenderungen in `api-reference.md` ergaenzt.
- [ ] Runbook angepasst, wenn Betriebsverhalten betroffen ist.
- [ ] ADR erstellt/aktualisiert (falls noetig).

## Diagramm-Automation (leichtgewichtig)

- Mermaid-Diagramme werden direkt in Markdown gepflegt und versioniert.
- CI-validiert mindestens Markdown-Linting und Link-Integritaet (wenn konfiguriert).
- Empfohlen: optionaler CI-Job fuer Broken-Link-Checks innerhalb `docs/`.

## Rollen und Verantwortung

| Rolle | Verantwortung |
|---|---|
| Feature-Owner | Dokumentation der Architekturfolgen in derselben Aenderung |
| Reviewer | Konsistenzpruefung zwischen Code, ADR und Doku |
| Tech Lead/Architekt | Entscheidung bei Zielkonflikten, Freigabe strategischer ADRs |

## Versionierung

- Dokumentation lebt im selben Repository wie der Code.
- Aenderungen erfolgen per Pull Request und sind commit-historisch nachvollziehbar.
- Verweise auf volatile Details (exakte Versionsnummern) sparsam einsetzen, ausser sie sind entscheidungsrelevant.
