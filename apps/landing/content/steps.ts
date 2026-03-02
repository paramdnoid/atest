export interface Step {
  step: string;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    step: "01",
    title: "Registrieren",
    description:
      "Erstellen Sie Ihr Konto in unter 2 Minuten — kostenlos und unverbindlich.",
  },
  {
    step: "02",
    title: "Einrichten",
    description:
      "Wählen Sie Ihr Gewerk, importieren Sie Kunden und passen Sie Vorlagen an Ihren Betrieb an.",
  },
  {
    step: "03",
    title: "Loslegen",
    description:
      "Erstellen Sie Ihr erstes Angebot, planen Sie Termine und digitalisieren Sie Ihren Betrieb.",
  },
];
