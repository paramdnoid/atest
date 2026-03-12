import Link from "next/link";

export const metadata = { title: "AGB – ZunftGewerk" };

export default function TermsPage() {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) gelten für
        alle Verträge zwischen der ZunftGewerk KG, Greifswalder Straße 4, 10405
        Berlin (nachfolgend „Anbieter“) und ihren Kunden (nachfolgend „Kunde“)
        über die Nutzung der ZunftGewerk-Software als Software-as-a-Service
        (nachfolgend „SaaS“ oder „Plattform“).
      </p>
      <p>
        Abweichende, entgegenstehende oder ergänzende Geschäftsbedingungen des
        Kunden werden nur dann Vertragsbestandteil, wenn der Anbieter ihrer
        Geltung ausdrücklich schriftlich zugestimmt hat.
      </p>

      <h2>§ 2 Vertragsschluss</h2>
      <ol>
        <li>
          Der Vertrag kommt durch die Registrierung und Aktivierung eines
          Accounts auf der Plattform zustande.
        </li>
        <li>
          Mit der Registrierung bestätigt der Kunde, diese AGB gelesen zu haben
          und mit ihrer Geltung einverstanden zu sein.
        </li>
        <li>
          Der Anbieter kann die Registrierung ohne Angabe von Gründen ablehnen.
        </li>
        <li>
          Für einzelne Tarife kann ein kostenloser Testzeitraum gewährt werden.
          Nach Ablauf des Testzeitraums geht das Abonnement in den gewählten
          kostenpflichtigen Tarif über, sofern der Kunde nicht zuvor kündigt.
        </li>
      </ol>

      <h2>§ 3 Leistungsumfang</h2>
      <ol>
        <li>
          Der Anbieter stellt dem Kunden die ZunftGewerk-Software als
          SaaS-Lösung über das Internet zur Verfügung. Der genaue
          Funktionsumfang ergibt sich aus dem jeweils gebuchten Tarif
          (Starter oder Professional).
        </li>
        <li>
          Der Anbieter bemüht sich um eine Verfügbarkeit der Plattform von
          99,5 % im Jahresmittel. Hiervon ausgenommen sind geplante
          Wartungsarbeiten, die nach Möglichkeit außerhalb der
          Hauptgeschäftszeiten durchgeführt werden, sowie Ausfälle, die
          außerhalb des Einflussbereichs des Anbieters liegen.
        </li>
        <li>
          Der Anbieter ist berechtigt, die Software weiterzuentwickeln und
          den Funktionsumfang zu erweitern. Wesentliche Einschränkungen
          bestehender Funktionen werden mit einer Frist von 30 Tagen
          angekündigt.
        </li>
      </ol>

      <h2>§ 4 Pflichten des Kunden</h2>
      <ol>
        <li>
          Der Kunde ist verpflichtet, seine Zugangsdaten (insbesondere Passwort
          und MFA-Geheimnisse) vertraulich zu behandeln und vor dem Zugriff
          durch unbefugte Dritte zu schützen.
        </li>
        <li>
          Der Kunde darf die Plattform nicht für rechtswidrige Zwecke nutzen
          oder Inhalte einstellen, die gegen geltendes Recht verstoßen.
        </li>
        <li>
          Es ist dem Kunden untersagt, die Software zu dekompilieren, zu
          reverse-engineeren oder abgeleitete Werke zu erstellen, es sei denn,
          dies ist nach zwingend geltendem Recht erlaubt.
        </li>
        <li>
          Der Kunde stellt sicher, dass die von ihm eingegebenen Daten korrekt
          und aktuell sind. Er ist für die Erstellung regelmäßiger Backups
          seiner Daten mittels der bereitgestellten Exportfunktionen
          verantwortlich.
        </li>
      </ol>

      <h2>§ 5 Vergütung und Zahlung</h2>
      <ol>
        <li>
          Die Vergütung richtet sich nach dem vom Kunden gewählten Tarif.
          Die aktuellen Preise sind auf der Website des Anbieters einsehbar.
          Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.
        </li>
        <li>
          Die Zahlungsabwicklung erfolgt über den Dienstleister Stripe Inc.
          Der Kunde ermächtigt den Anbieter, die fälligen Beträge über die
          hinterlegte Zahlungsmethode einzuziehen.
        </li>
        <li>
          Rechnungen werden elektronisch bereitgestellt und sind sofort fällig.
        </li>
        <li>
          Kommt der Kunde mit der Zahlung in Verzug, ist der Anbieter
          berechtigt, den Zugang zur Plattform nach Mahnung und Setzung einer
          angemessenen Nachfrist zu sperren. Der Zugang wird nach
          vollständigem Zahlungsausgleich unverzüglich wiederhergestellt.
        </li>
      </ol>

      <h2>§ 6 Vertragslaufzeit und Kündigung</h2>
      <ol>
        <li>
          Der Vertrag wird je nach gewähltem Tarif auf monatlicher oder
          jährlicher Basis abgeschlossen und verlängert sich automatisch um
          die jeweilige Vertragslaufzeit, sofern er nicht rechtzeitig gekündigt
          wird.
        </li>
        <li>
          Die Kündigung ist jederzeit zum Ende der laufenden Abrechnungsperiode
          möglich und kann über die Kontoeinstellungen oder per E-Mail an{" "}
          <a href="mailto:hallo@zunftgewerk.de">hallo@zunftgewerk.de</a>{" "}
          erfolgen.
        </li>
        <li>
          Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
          unberührt.
        </li>
        <li>
          Nach Vertragsende stellt der Anbieter dem Kunden seine Daten für
          einen Zeitraum von 30 Tagen zum Export zur Verfügung. Danach werden
          die Daten unwiderruflich gelöscht.
        </li>
      </ol>

      <h2>§ 7 Gewährleistung und Haftung</h2>
      <ol>
        <li>
          Der Anbieter gewährleistet, dass die Plattform im Wesentlichen den
          beschriebenen Funktionen entspricht.
        </li>
        <li>
          Die Haftung des Anbieters ist bei leichter Fahrlässigkeit auf die
          Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
          beschränkt und der Höhe nach auf den vorhersehbaren,
          vertragstypischen Schaden begrenzt, maximal jedoch auf die vom Kunden
          in den letzten 12 Monaten gezahlte Vergütung.
        </li>
        <li>
          Die vorstehenden Haftungsbeschränkungen gelten nicht bei Vorsatz,
          grober Fahrlässigkeit, der Verletzung von Leben, Körper oder
          Gesundheit sowie bei zwingenden gesetzlichen Haftungsvorschriften.
        </li>
        <li>
          Der Anbieter haftet nicht für Ausfälle oder Störungen, die auf höhere
          Gewalt, Störungen der Telekommunikationsnetze oder sonstige Umstände
          zurückzuführen sind, die außerhalb seines Einflussbereichs liegen.
        </li>
      </ol>

      <h2>§ 8 Datenschutz</h2>
      <p>
        Einzelheiten zur Verarbeitung personenbezogener Daten entnehmen Sie
        bitte unserer{" "}
        <Link href="/legal/privacy">Datenschutzerklärung</Link>. Soweit der
        Kunde im Rahmen der Nutzung personenbezogene Daten Dritter verarbeitet,
        schließen die Parteien einen Auftragsverarbeitungsvertrag gemäß Art. 28
        DSGVO.
      </p>

      <h2>§ 9 Geistiges Eigentum</h2>
      <ol>
        <li>
          Die ZunftGewerk-Software, einschließlich aller Quellcodes,
          Dokumentationen, Designs und Markenzeichen, ist und bleibt geistiges
          Eigentum des Anbieters.
        </li>
        <li>
          Der Kunde erhält für die Dauer des Vertrags ein nicht
          ausschließliches, nicht übertragbares, widerrufliches Nutzungsrecht
          an der Software im Rahmen des gebuchten Tarifs.
        </li>
        <li>
          Die vom Kunden in die Plattform eingegebenen Daten verbleiben im
          Eigentum des Kunden. Der Anbieter erhält ein Nutzungsrecht nur
          insoweit, als dies zur Erbringung der vertraglich vereinbarten
          Leistungen erforderlich ist.
        </li>
      </ol>

      <h2>§ 10 Änderungen der AGB</h2>
      <ol>
        <li>
          Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft
          zu ändern. Der Kunde wird über Änderungen mindestens 30 Tage vor
          Inkrafttreten per E-Mail informiert.
        </li>
        <li>
          Widerspricht der Kunde den geänderten AGB nicht innerhalb von 30
          Tagen nach Zugang der Änderungsmitteilung, gelten die geänderten AGB
          als angenommen. Auf diese Rechtsfolge wird der Anbieter in der
          Änderungsmitteilung gesondert hinweisen.
        </li>
        <li>
          Im Fall des Widerspruchs steht beiden Parteien ein
          Sonderkündigungsrecht zu.
        </li>
      </ol>

      <h2>§ 11 Schlussbestimmungen</h2>
      <ol>
        <li>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
          UN-Kaufrechts (CISG).
        </li>
        <li>
          Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts
          oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher
          Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit
          diesem Vertrag Berlin.
        </li>
        <li>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden,
          bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die
          Stelle der unwirksamen Bestimmung tritt eine Regelung, die dem
          wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
        </li>
      </ol>

      <p>Stand: März 2026</p>
    </article>
  );
}
