import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="premium-noise auth-hero-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="enterprise-grid pointer-events-none absolute inset-0 opacity-45" />
      <section className="relative z-10 w-full max-w-3xl">
        <div className="billing-editorial-main rounded-2xl p-6 sm:p-8">
          <span className="billing-editorial-kicker">
            <ShieldCheck className="h-3.5 w-3.5" />
            Control Plane
          </span>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Zunftgewerk Web
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Enterprise-fokussierte Multi-Tenant Verwaltung fuer Plaene, Lizenzen, Rollen und
            Offline-Sync - im konsistenten Design deiner Plattform.
          </p>
          <div className="mt-6 premium-divider" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signin">
              <Button variant="gradient" className="gap-2">
                Zur Anmeldung
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Direkt ins Dashboard</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
