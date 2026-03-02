import Link from 'next/link';
import { ShieldCheck, Smartphone, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  { name: 'Starter', price: '49 EUR', seats: '5 Seats', sync: 'Basis Sync' },
  { name: 'Business', price: '199 EUR', seats: '25 Seats', sync: 'Offline-First + Realtime' },
  { name: 'Enterprise', price: 'Custom', seats: 'Unlimited', sync: 'Dedicated Support + SLA' }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          Zunftgewerk
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
          Die Enterprise-Plattform fuer Handwerk, Teams und sichere Offline-Prozesse.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Multi-Tenant SaaS mit verschluesselter lokaler Datenhaltung, gRPC Sync und auditierbarer Lizenzverwaltung.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button size="lg">Pilot starten</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">
              Plaene vergleichen
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="mt-4 text-lg font-semibold">SOC2 / ISO-ready</h2>
          <p className="mt-2 text-sm text-muted-foreground">Audit-Events, Tenant-Isolation und Security Controls out of the box.</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <Workflow className="h-5 w-5" />
          <h2 className="mt-4 text-lg font-semibold">Deterministischer Sync</h2>
          <p className="mt-2 text-sm text-muted-foreground">Server-authoritative Konfliktauflösung mit idempotenten Client-Operationen.</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <Smartphone className="h-5 w-5" />
          <h2 className="mt-4 text-lg font-semibold">Mobile + Web</h2>
          <p className="mt-2 text-sm text-muted-foreground">Expo-Client und Next.js-Workspace auf gemeinsamen Contracts.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-2xl font-semibold">Plaene</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-xl border border-border p-4">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-2xl">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.seats}</p>
              <p className="text-sm text-muted-foreground">{plan.sync}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
