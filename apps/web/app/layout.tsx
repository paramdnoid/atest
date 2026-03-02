import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zunftgewerk Web',
  description: 'Tenant Admin, Lizenzverwaltung und Operations Cockpit.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
