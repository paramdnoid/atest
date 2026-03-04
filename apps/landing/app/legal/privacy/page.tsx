export const metadata = { title: "Datenschutz – ZunftGewerk" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>
        ZunftGewerk KG
        <br />
        Haus der Demokratie und Menschenrechte
        <br />
        Greifswalder Straße 4<br />
        10405 Berlin
        <br />
        Deutschland
      </p>
      <p>
        Telefon: +49 (0) 30 3199 1451
        <br />
        E-Mail:{" "}
        <a href="mailto:datenschutz@zunftgewerk.de">
          datenschutz@zunftgewerk.de
        </a>
      </p>

      <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
      <p>
        Beim Besuch unserer Website erfasst unser Server automatisch
        Informationen in sogenannten Server-Log-Dateien, die Ihr Browser
        übermittelt. Dazu gehören:
      </p>
      <ul>
        <li>IP-Adresse des anfragenden Rechners</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>Name und URL der abgerufenen Datei</li>
        <li>Referrer-URL (zuvor besuchte Seite)</li>
        <li>Verwendeter Browser und ggf. Betriebssystem</li>
      </ul>
      <p>
        Diese Daten werden ausschließlich zur Sicherstellung eines
        störungsfreien Betriebs und zur Verbesserung unseres Angebots
        ausgewertet. Eine Zuordnung zu bestimmten Personen findet nicht statt.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
        an der technischen Bereitstellung und Sicherheit).
      </p>

      <h2>3. Registrierung und Account</h2>
      <p>
        Für die Nutzung unserer SaaS-Plattform ist eine Registrierung
        erforderlich. Dabei werden folgende Daten verarbeitet:
      </p>
      <ul>
        <li>E-Mail-Adresse</li>
        <li>Passwort (gespeichert als Argon2id-Hash, nicht im Klartext)</li>
        <li>Name des Unternehmens / Betriebs</li>
        <li>Anschrift und Kontaktdaten des Betriebs</li>
        <li>Angaben zu Mitarbeitern und Geräten (im Rahmen der Nutzung)</li>
      </ul>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        Die Daten werden für die Dauer des Vertragsverhältnisses gespeichert und
        nach Kontolöschung gelöscht, soweit keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>4. Zahlungsdaten / Stripe</h2>
      <p>
        Für die Zahlungsabwicklung nutzen wir den Dienst{" "}
        <strong>Stripe Inc.</strong> (510 Townsend Street, San Francisco, CA
        94103, USA). Bei der Buchung eines kostenpflichtigen Tarifs werden Ihre
        Zahlungsdaten (Kreditkartennummer, Ablaufdatum, CVC) direkt an Stripe
        übermittelt und dort verarbeitet. Wir speichern keine vollständigen
        Zahlungsdaten auf unseren Servern.
      </p>
      <p>
        Stripe ist als Auftragsverarbeiter gemäß Art. 28 DSGVO eingesetzt.
        Weitere Informationen finden Sie in der{" "}
        <a
          href="https://stripe.com/de/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Datenschutzerklärung von Stripe
        </a>
        .
      </p>

      <h2>5. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies. Analytische
        oder Marketing-Cookies werden nicht eingesetzt.
      </p>
      <ul>
        <li>
          <strong>zg_refresh_token</strong> — Session-Cookie zur
          Authentifizierung. Enthält ein kryptographisch zufälliges Token zur
          Aufrechterhaltung Ihrer Sitzung. Wird beim Abmelden oder nach Ablauf
          gelöscht.
        </li>
        <li>
          <strong>zg_consent</strong> — Speichert Ihre Einwilligung zum Einsatz
          von Cookies. Laufzeit: 1 Jahr.
        </li>
      </ul>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
        bzw. § 25 Abs. 2 TDDDG (technisch erforderliche Cookies).
      </p>

      <h2>6. Mobile App</h2>
      <p>
        Unsere mobile Anwendung speichert Authentifizierungstoken im
        verschlüsselten Gerätespeicher (SecureStore). Darüber hinaus werden
        folgende Daten lokal auf dem Gerät verarbeitet:
      </p>
      <ul>
        <li>Geräte-ID zur Lizenzierung und Synchronisierung</li>
        <li>
          Offline-Daten (verschlüsselt mit AES-256-GCM in einer lokalen
          Datenbank)
        </li>
        <li>Synchronisierungsstatus (Vektoruhren)</li>
      </ul>
      <p>
        Diese Daten verlassen das Gerät nur im Rahmen der Synchronisierung mit
        unseren Servern (verschlüsselt via TLS).
      </p>

      <h2>7. Auftragsverarbeiter</h2>
      <p>
        Wir setzen folgende Dienstleister als Auftragsverarbeiter gemäß Art. 28
        DSGVO ein:
      </p>
      <ul>
        <li>
          <strong>Keyweb AG</strong> (Neuwerkstraße 45/46, 99084 Erfurt) —
          Hosting und Serverinfrastruktur
        </li>
        <li>
          <strong>Stripe Inc.</strong> (510 Townsend Street, San Francisco, CA
          94103, USA) — Zahlungsabwicklung
        </li>
      </ul>
      <p>
        Mit allen Auftragsverarbeitern bestehen Verträge gemäß Art. 28 DSGVO.
        Für die Datenübermittlung in die USA (Stripe) gelten die
        EU-Standardvertragsklauseln.
      </p>

      <h2>8. Datensicherheit</h2>
      <p>
        Wir treffen umfangreiche technische und organisatorische Maßnahmen zum
        Schutz Ihrer Daten:
      </p>
      <ul>
        <li>
          Transportverschlüsselung mittels TLS für alle Verbindungen
        </li>
        <li>
          Passwort-Hashing mit Argon2id (time=3, memory=64 MB, parallelism=1)
        </li>
        <li>
          Verschlüsselung von MFA-Geheimnissen mit AES-128-GCM
        </li>
        <li>
          Signierung von Authentifizierungstoken mit RSA SHA-256 (RS256)
        </li>
        <li>
          Refresh-Token-Rotation mit automatischer Erkennung von Token-Missbrauch
        </li>
      </ul>

      <h2>9. Speicherdauer</h2>
      <ul>
        <li>
          <strong>Account-Daten:</strong> bis zur Löschung des Accounts durch den
          Kunden
        </li>
        <li>
          <strong>Server-Log-Dateien:</strong> 90 Tage
        </li>
        <li>
          <strong>Audit-Protokolle:</strong> gemäß gesetzlichen
          Aufbewahrungspflichten (bis zu 10 Jahre)
        </li>
        <li>
          <strong>Rechnungsdaten:</strong> 10 Jahre (§ 147 AO, § 257 HGB)
        </li>
      </ul>

      <h2>10. Ihre Rechte</h2>
      <p>
        Sie haben gemäß DSGVO folgende Rechte bezüglich Ihrer
        personenbezogenen Daten:
      </p>
      <ul>
        <li>
          <strong>Auskunft</strong> (Art. 15 DSGVO) — Sie können Auskunft über
          Ihre bei uns gespeicherten Daten verlangen.
        </li>
        <li>
          <strong>Berichtigung</strong> (Art. 16 DSGVO) — Sie können die
          Berichtigung unrichtiger Daten verlangen.
        </li>
        <li>
          <strong>Löschung</strong> (Art. 17 DSGVO) — Sie können die Löschung
          Ihrer Daten verlangen, sofern keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </li>
        <li>
          <strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO) — Sie
          können die Einschränkung der Verarbeitung Ihrer Daten verlangen.
        </li>
        <li>
          <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Sie können
          verlangen, Ihre Daten in einem strukturierten, gängigen und
          maschinenlesbaren Format zu erhalten.
        </li>
        <li>
          <strong>Widerspruch</strong> (Art. 21 DSGVO) — Sie können der
          Verarbeitung Ihrer Daten jederzeit widersprechen, sofern die
          Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht.
        </li>
        <li>
          <strong>Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO) —
          Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die
          Zukunft widerrufen.
        </li>
        <li>
          <strong>Beschwerde bei einer Aufsichtsbehörde</strong> (Art. 77
          DSGVO) — Sie haben das Recht, sich bei einer Datenschutz-
          Aufsichtsbehörde zu beschweren. Die für uns zuständige
          Aufsichtsbehörde ist:
          <br />
          <br />
          Berliner Beauftragte für Datenschutz und Informationsfreiheit
          <br />
          Friedrichstraße 219<br />
          10969 Berlin
          <br />
          <a
            href="https://www.datenschutz-berlin.de"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.datenschutz-berlin.de
          </a>
        </li>
      </ul>

      <h2>11. Kontakt</h2>
      <p>
        Bei Fragen zum Datenschutz wenden Sie sich bitte an:{" "}
        <a href="mailto:datenschutz@zunftgewerk.de">
          datenschutz@zunftgewerk.de
        </a>
      </p>

      <p>Stand: März 2026</p>
    </article>
  );
}
