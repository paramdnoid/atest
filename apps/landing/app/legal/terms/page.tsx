export const metadata = { title: "AGB – ZunftGewerk" };

export default function TermsPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen
        ZunftGewerk GmbH und ihren Kunden über die Nutzung der ZunftGewerk-Software
        (SaaS).
      </p>

      <h2>§ 2 Vertragsschluss</h2>
      <p>
        Der Vertrag kommt durch die Registrierung und Aktivierung eines Accounts auf
        der Plattform zustande.
      </p>

      <h2>§ 3 Leistungsumfang</h2>
      <p>
        ZunftGewerk stellt die Software als Software-as-a-Service (SaaS) zur
        Verfügung. Der genaue Funktionsumfang ergibt sich aus dem jeweils gebuchten
        Tarif.
      </p>

      <h2>§ 4 Vergütung</h2>
      <p>
        Die Vergütung richtet sich nach dem gewählten Tarif. Alle Preise verstehen
        sich zuzüglich der gesetzlichen Umsatzsteuer.
      </p>

      <h2>§ 5 Datenschutz</h2>
      <p>
        Einzelheiten zur Verarbeitung personenbezogener Daten entnehmen Sie bitte
        unserer{" "}
        <a href="/legal/privacy">Datenschutzerklärung</a>.
      </p>

      <h2>§ 6 Schlussbestimmungen</h2>
      <p>
        Es gilt deutsches Recht. Gerichtsstand ist Musterstadt, soweit gesetzlich
        zulässig.
      </p>
    </article>
  );
}
