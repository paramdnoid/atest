# Architecture Framework

## Gewaehlter Dokumentationsansatz

Diese Architektur-Dokumentation kombiniert:

- **C4 Model** fuer Systemabgrenzung und Struktur (Level 1-3).
- **Arc42-orientierte Kapitelstruktur** fuer Qualitaetsziele, Querschnittsthemen und Risiken.
- **ADRs** fuer dauerhafte Architekturentscheidungen inkl. Alternativen und Konsequenzen.
- **Diagram-as-Code (Mermaid)** fuer versionskontrollierbare Architekturdiagramme.

## Mapping auf vorhandene Dokumente

| Architekturfrage | Artefakt |
|---|---|
| Wer interagiert mit dem System? | `system-context.md` |
| Welche deploybaren Teile gibt es? | `container-architecture.md` |
| Wie ist das Backend intern geschnitten? | `component-architecture.md` |
| Wie fliessen und persistieren Daten? | `data-architecture.md` |
| Wie werden Sicherheitsziele umgesetzt? | `security-architecture.md` |
| Welche Qualitaetsziele steuern Entscheidungen? | `quality-attributes.md` |
| Wie wird Architektur gepflegt und validiert? | `documentation-maintenance.md` |
| Warum wurden wichtige Entscheidungen getroffen? | `adr/*.md` |

## C4-Sichten

### Level 1: System Context

Siehe `system-context.md`: Akteure, externe Systeme, Integrationsprotokolle und Systemgrenzen.

### Level 2: Container

Siehe `container-architecture.md`: Landing, Web, Mobile, API, PostgreSQL, Redis und deren Kommunikationsmuster.

### Level 3: Components

Siehe `component-architecture.md`: Fachmodule des modularen Monolithen (`identity`, `tenant`, `plan`, `billing`, `license`, `sync`, `audit`, `onboarding`).

## Arc42-orientierte Ergaenzungen

Arc42-Kapitel werden pragmatisch ueber mehrere Dateien verteilt:

- **Kontext und Loesungsstrategie:** `system-context.md`, `container-architecture.md`
- **Bausteinsicht:** `component-architecture.md`
- **Laufzeitsicht und Datenfluss:** `data-architecture.md`, `security-architecture.md`
- **Verteilungssicht:** `deployment-infrastructure.md`
- **Querschnittliche Konzepte und Qualitaetsziele:** `quality-attributes.md`, `security-architecture.md`
- **Risiken und technische Schulden:** `quality-attributes.md` (Abschnitt "Risiken")

## Diagrammstandard

- Diagramme als Mermaid in Markdown pflegen.
- Ein Diagramm pro Fragestellung (Kontext, Container, Kernfluss).
- Beschriftungen fachlich statt framework-zentriert halten.
- Nur stabile Beziehungen dokumentieren; volatile Implementierungsdetails vermeiden.
