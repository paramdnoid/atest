import type { Metadata } from 'next';
import { Chakra_Petch, IBM_Plex_Sans } from 'next/font/google';
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
  title: 'Zunftgewerk Web',
  description: 'Tenant Admin, Lizenzverwaltung und Operations Cockpit.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${plex.variable} ${chakra.variable} ${plex.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
