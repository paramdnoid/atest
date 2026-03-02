import Link from 'next/link';
import { Button } from '@/components/ui/button';

const plans = [
  { name: 'Starter', details: '5 Seats, Basis Sync, E-Mail Support', price: '49 EUR / Monat' },
  { name: 'Business', details: '25 Seats, Offline-first, Priority Support', price: '199 EUR / Monat' },
  { name: 'Enterprise', details: 'Unlimited Seats, SLA, Security Add-ons', price: 'Custom' }
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold">Plaene und Lizenzmodelle</h1>
      <p className="mt-3 text-muted-foreground">Named-Seat Lizenzen mit monatlicher oder jaehrlicher Abrechnung.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.details}</p>
            <p className="mt-4 text-lg">{plan.price}</p>
          </article>
        ))}
      </section>

      <div className="mt-8">
        <Link href="/signup">
          <Button>Pilot starten</Button>
        </Link>
      </div>
    </main>
  );
}
