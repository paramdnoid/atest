import {
  CalendarDays,
  Camera,
  Clock,
  Cloud,
  type LucideIcon,
  Monitor,
  PenLine,
  Receipt,
  Smartphone,
  WifiOff,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

export const features: Feature[] = [
  {
    icon: Smartphone,
    title: "Mobile App",
    description:
      "iOS & Android für unterwegs — Aufträge, Fotos und Unterschriften direkt vor Ort.",
    benefits: [
      "Aufträge mobil einsehen & bearbeiten",
      "Push-Benachrichtigungen in Echtzeit",
      "Optimiert für den Baustelleneinsatz",
    ],
  },
  {
    icon: Monitor,
    title: "Desktop App",
    description: "Native Apps für Windows, macOS und Linux mit voller Funktionalität.",
    benefits: [
      "Volle Funktionalität am Schreibtisch",
      "Schnelle Dateneingabe mit Tastatur",
      "Multi-Monitor-Unterstützung",
    ],
  },
  {
    icon: Cloud,
    title: "Cloud-Sync",
    description:
      "Automatische Synchronisation — Ihre Daten sind immer aktuell und verfügbar.",
    benefits: [
      "Echtzeit-Sync über alle Geräte",
      "Automatische Backups in der Cloud",
      "DSGVO-konformes Hosting in DE",
    ],
  },
  {
    icon: PenLine,
    title: "Digitale Unterschrift",
    description: "Rechtssichere elektronische Signatur direkt beim Kunden vor Ort.",
    benefits: [
      "Rechtssicher nach eIDAS-Verordnung",
      "Direkt auf dem Tablet unterschreiben",
      "Sofortiger PDF-Versand an den Kunden",
    ],
  },
  {
    icon: Camera,
    title: "Fotodokumentation",
    description: "Bilder aufnehmen und automatisch dem richtigen Auftrag zuordnen.",
    benefits: [
      "Automatische Auftragszuordnung",
      "Vorher-/Nachher-Vergleich",
      "GPS- und Zeitstempel auf jedem Foto",
    ],
  },
  {
    icon: Clock,
    title: "Zeiterfassung",
    description: "Digitale Stundenzettel mit GPS-Zuordnung und Projektverknüpfung.",
    benefits: [
      "Ein-Klick-Stempeluhr für Mitarbeiter",
      "GPS-basierte Projektzuordnung",
      "Automatische Lohnexport-Schnittstelle",
    ],
  },
  {
    icon: Receipt,
    title: "Rechnungswesen",
    description:
      "Von Angebot über Auftragsbestätigung bis zur Rechnung — alles in einem System.",
    benefits: [
      "Angebot → Auftrag → Rechnung in einem Fluss",
      "ZUGFeRD- & XRechnung-konform",
      "Automatische Mahnläufe",
    ],
  },
  {
    icon: CalendarDays,
    title: "Terminplanung",
    description: "Digitale Plantafel, Kalender und automatische Kundenerinnerungen.",
    benefits: [
      "Drag & Drop Plantafel",
      "Automatische SMS-/E-Mail-Erinnerungen",
      "Team-Kapazitätsübersicht",
    ],
  },
  {
    icon: WifiOff,
    title: "Offline-Modus",
    description:
      "Volle Funktionalität auch ohne Internet — Daten werden automatisch synchronisiert.",
    benefits: [
      "Arbeiten ohne Netzabdeckung",
      "Automatischer Sync bei Verbindung",
      "Keine Datenverluste unterwegs",
    ],
  },
];
