import {
  Droplet,
  Flame,
  HardHat,
  type LucideIcon,
  Paintbrush,
  Plug,
  TreePine,
  Wrench,
} from "lucide-react";

// Additional icon names used in tradeFeatures:
// Shield, BarChart3, Route, Layers, Scan, Building2, Pipette, FileText

export interface TradeFeatureItem {
  label: string;
  description: string;
  icon: string;
}

export interface TradeStat {
  value: string;
  label: string;
}

export interface Trade {
  icon: LucideIcon;
  slug: string;
  name: string;
  tabLabel: string;
  description: string;
  highlight?: string;
  stats: TradeStat[];
  tradeFeatures: TradeFeatureItem[];
  coreFeatures: TradeFeatureItem[];
}

export interface SecondaryTrade {
  icon: LucideIcon;
  name: string;
  comingSoon: boolean;
}

const coreBase: TradeFeatureItem[] = [
  {
    label: "Mobile App",
    description: "Alle Funktionen auch unterwegs auf dem Smartphone.",
    icon: "Smartphone",
  },
  {
    label: "Digitale Dokumentation & Foto-Upload",
    description: "Fotos, Notizen und Dokumente direkt vor Ort erfassen.",
    icon: "Camera",
  },
  {
    label: "Terminplanung / Digitale Plantafel",
    description: "Termine und Einsätze übersichtlich planen und verteilen.",
    icon: "CalendarDays",
  },
  {
    label: "Angebots- & Rechnungswesen",
    description: "Angebote erstellen und Rechnungen direkt versenden.",
    icon: "Receipt",
  },
  {
    label: "Zeiterfassung",
    description: "Arbeitszeiten projektbezogen erfassen und auswerten.",
    icon: "Clock",
  },
  {
    label: "Mitarbeiterverwaltung",
    description: "Teams, Qualifikationen und Einsatzpläne verwalten.",
    icon: "Users",
  },
];

const digitalSignature: TradeFeatureItem = {
  label: "Digitale Unterschrift",
  description: "Aufträge und Protokolle digital unterschreiben lassen.",
  icon: "PenLine",
};

export const trades: Trade[] = [
  {
    icon: Flame,
    slug: "kaminfeger",
    name: "Kaminfeger",
    tabLabel: "Kaminfeger",
    description:
      "Kehrbezirke digital verwalten, Prüfprotokolle erstellen und Messgeräte anbinden.",
    stats: [
      { value: "85%", label: "weniger Papierkram" },
      { value: "< 2 Min", label: "pro Protokoll" },
      { value: "100%", label: "KÜO-konform" },
    ],
    tradeFeatures: [
      {
        label: "Kehrbezirksverwaltung & Hausakten",
        description: "Verwaltung von Liegenschaften, Feuerstättenbescheiden und Anlagen.",
        icon: "MapPin",
      },
      {
        label: "Messgeräteschnittstelle",
        description: "Automatische Übernahme von Messergebnissen aus dem Messgerät.",
        icon: "Gauge",
      },
      {
        label: "Gebührenautomatik",
        description: "Automatische Berechnung von Grund- und Messgebühren nach KÜO.",
        icon: "Calculator",
      },
      {
        label: "Feuerstättenbescheid-Erstellung",
        description: "Digitale Erstellung und Verwaltung von Feuerstättenbescheiden.",
        icon: "FileCheck",
      },
      {
        label: "Kehr- & Prüfprotokolle",
        description: "Normkonforme Protokolle für Kehrungen und Überprüfungen.",
        icon: "ClipboardCheck",
      },
      {
        label: "Routenplanung",
        description: "Optimierte Tourenplanung für Kehrbezirke mit Kartenansicht.",
        icon: "Route",
      },
      {
        label: "Mängelberichte & Fristen",
        description: "Mängel erfassen, Fristen überwachen und Nachkontrollen planen.",
        icon: "Shield",
      },
      {
        label: "Statistiken & Auswertungen",
        description: "Kehrbezirksanalyse, Umsatzübersicht und Leistungsreports.",
        icon: "BarChart3",
      },
    ],
    coreFeatures: [...coreBase, digitalSignature],
  },
  {
    icon: Paintbrush,
    slug: "maler",
    name: "Maler & Tapezierer",
    tabLabel: "Maler",
    description:
      "Aufmaße berechnen, GAEB-Ausschreibungen importieren und Material kalkulieren.",
    stats: [
      { value: "3x", label: "schnellere Kalkulation" },
      { value: "GAEB", label: "Import & Export" },
      { value: "RAL/NCS", label: "Farbtonsysteme" },
    ],
    tradeFeatures: [
      {
        label: "Aufmaßberechnung",
        description: "m²-basierte Preiskalkulation für Maler- und Lackierarbeiten.",
        icon: "Ruler",
      },
      {
        label: "Materialmanagement & Großhandel",
        description: "DATANORM- und IDS-CONNECT-Import von Materiallisten und Preisen.",
        icon: "PackageSearch",
      },
      {
        label: "GAEB-Unterstützung",
        description: "Import und Export von GAEB-Dateien für Ausschreibungen.",
        icon: "FileSpreadsheet",
      },
      {
        label: "DATEV-Schnittstelle",
        description: "Buchhaltungsexport im DATEV-Format für den Steuerberater.",
        icon: "FileOutput",
      },
      {
        label: "Digitale Baustellenmappen",
        description: "Alle Projektdokumente, Pläne und Fotos an einem Ort.",
        icon: "FolderOpen",
      },
      {
        label: "Farbtonverwaltung",
        description: "RAL- und NCS-Farbtonsysteme für präzise Farbauswahl.",
        icon: "Palette",
      },
      {
        label: "Untergrundprüfung & Schichtaufbau",
        description: "Dokumentation von Untergründen und Beschichtungssystemen.",
        icon: "Layers",
      },
      {
        label: "Raumbuch & Leistungsverzeichnis",
        description: "Raumweise Erfassung von Flächen und automatische LV-Erstellung.",
        icon: "Building2",
      },
    ],
    coreFeatures: [...coreBase, digitalSignature],
  },
  {
    icon: Droplet,
    slug: "shk",
    name: "Sanitär, Heizung, Klima",
    tabLabel: "SHK",
    description:
      "Heizlast nach DIN berechnen, Wartungsverträge managen und Großhändler anbinden.",
    highlight: "KI-gestützte Wartung",
    stats: [
      { value: "DIN", label: "EN 12831 konform" },
      { value: "40%", label: "weniger Ausfälle" },
      { value: "IDS/OCI", label: "Großhändler-Anbindung" },
    ],
    tradeFeatures: [
      {
        label: "Technische Planung & Kalkulation",
        description:
          "Heizlastberechnung (DIN EN 12831), Rohrnetzberechnung und Heizkörperauslegung.",
        icon: "Thermometer",
      },
      {
        label: "Warenwirtschaft & Großhändler",
        description: "Anbindung an Großhändler via IDS Connect, OCI, UGL und DATANORM.",
        icon: "ShoppingCart",
      },
      {
        label: "Wartungsverwaltung & Ersatzteil-Suche",
        description:
          "Wartungsverträge, Ersatzteile und Serviceberichte für technische Anlagen.",
        icon: "Wrench",
      },
      {
        label: "Predictive Maintenance (KI)",
        description: "Vorausschauende Wartung für Heizungs- und Klimaanlagen mittels KI.",
        icon: "BrainCircuit",
      },
      {
        label: "VOB-konforme Aufmaße",
        description:
          "Aufmaßerstellung und Abrechnung nach VOB für Installationsarbeiten.",
        icon: "Ruler",
      },
      {
        label: "Digitale Serviceberichte",
        description: "Serviceberichte digital erstellen, unterschreiben und versenden.",
        icon: "FileCheck",
      },
      {
        label: "Anlagen-Scan & Typenschilder",
        description:
          "Typenschilder per Kamera scannen und Anlagendaten automatisch erfassen.",
        icon: "Scan",
      },
      {
        label: "Normen & Regelwerk-Datenbank",
        description:
          "Zugriff auf aktuelle DIN-, DVGW- und VDI-Richtlinien direkt im System.",
        icon: "FileText",
      },
    ],
    coreFeatures: [...coreBase],
  },
];

export const secondaryTrades: SecondaryTrade[] = [
  { icon: Plug, name: "Elektriker", comingSoon: true },
  { icon: TreePine, name: "Schreiner", comingSoon: true },
  { icon: HardHat, name: "Dachdecker", comingSoon: true },
  { icon: Wrench, name: "Sanitär", comingSoon: true },
];
