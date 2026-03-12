import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="premium-noise auth-hero-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="enterprise-grid pointer-events-none absolute inset-0 opacity-45" />
      <section className="relative z-10 w-full max-w-xl">
        <div className="billing-editorial-main rounded-2xl p-6 sm:p-8">
          <span className="billing-editorial-kicker">
            <Compass className="h-3.5 w-3.5" />
            Seite nicht gefunden
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Diese Route existiert nicht
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Die angeforderte Seite ist nicht verfuegbar oder wurde verschoben.
          </p>
          <div className="mt-6 premium-divider" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="gradient" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Zur Startseite
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline">Zur Anmeldung</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
