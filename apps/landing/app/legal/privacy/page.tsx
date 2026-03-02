export const metadata = { title: "Datenschutz – ZunftGewerk" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>
        ZunftGewerk GmbH<br />
        Musterstraße 1<br />
        12345 Musterstadt<br />
        E-Mail: <a href="mailto:datenschutz@zunftgewerk.de">datenschutz@zunftgewerk.de</a>
      </p>

      <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
      <p>
        Wir erheben und verarbeiten personenbezogene Daten nur, soweit dies zur
        Bereitstellung unserer Dienste erforderlich ist und eine Rechtsgrundlage nach
        Art. 6 DSGVO vorliegt.
      </p>

      <h2>3. Cookies</h2>
      <p>
        Diese Website verwendet ausschließlich technisch notwendige Cookies sowie,
        nach Ihrer Einwilligung, optionale Analyse-Cookies.
      </p>

      <h2>4. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung
        der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf
        Datenübertragbarkeit und Widerspruch.
      </p>

      <h2>5. Kontakt</h2>
      <p>
        Bei Fragen zum Datenschutz wenden Sie sich an:{" "}
        <a href="mailto:datenschutz@zunftgewerk.de">datenschutz@zunftgewerk.de</a>
      </p>
    </article>
  );
}
