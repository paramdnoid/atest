import type { Metadata } from 'next';
import { Chakra_Petch, IBM_Plex_Sans } from 'next/font/google';
import { CookieConsent } from '@/components/cookie-consent';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const chakra = Chakra_Petch({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zunftgewerk.de'),
  title: {
    default: 'ZunftGewerk — Software für Kaminfeger, Maler & SHK-Betriebe',
    template: '%s | ZunftGewerk',
  },
  description:
    'Die All-in-One Handwerkersoftware. Digitalisieren Sie Ihren Betrieb von der Auftragsannahme bis zur Rechnung — spezialisiert für Kaminfeger, Maler und SHK.',
  keywords: [
    'Handwerkersoftware',
    'Kaminfeger Software',
    'Maler Software',
    'SHK Software',
    'Handwerk digitalisieren',
    'Auftragsmanagement Handwerk',
    'Handwerk Software Cloud',
    'Rechnungssoftware Handwerk',
  ],
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ZunftGewerk',
  url: 'https://zunftgewerk.de',
  logo: 'https://zunftgewerk.de/logo.png',
  description:
    'Die All-in-One Handwerkersoftware für Kaminfeger, Maler und SHK-Betriebe.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`scroll-smooth ${plex.variable} ${chakra.variable}`}>
      <body className={plex.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-elevated"
        >
          Zum Hauptinhalt springen
        </a>
        {children}
        <CookieConsent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
