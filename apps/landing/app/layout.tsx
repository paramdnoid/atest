import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zunftgewerk',
  description: 'Enterprise-ready Werkstatt SaaS mit Offline-Sync und Lizenzverwaltung.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
