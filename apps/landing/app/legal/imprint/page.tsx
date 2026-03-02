export const metadata = { title: "Impressum – ZunftGewerk" };

export default function ImprintPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Impressum</h1>

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        ZunftGewerk GmbH<br />
        Musterstraße 1<br />
        12345 Musterstadt<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:hallo@zunftgewerk.de">hallo@zunftgewerk.de</a>
      </p>

      <h2>Handelsregister</h2>
      <p>
        Registergericht: Amtsgericht Musterstadt<br />
        Registernummer: HRB 000000
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
        DE000000000
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>ZunftGewerk GmbH</p>
    </article>
  );
}
