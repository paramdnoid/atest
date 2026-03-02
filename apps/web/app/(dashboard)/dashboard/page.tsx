import Link from 'next/link';
import { Shield, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cards = [
  { title: 'Sync Health', value: '99.95%', hint: 'P95 <= 450ms', icon: Workflow },
  { title: 'Security Events', value: '0 kritische', hint: 'letzte 24h', icon: Shield }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Tenant Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Uebersicht zu Lizenzstatus, Sync und Security-Kontrollen.</p>
        </div>
        <Link href="/licenses">
          <Button>Lizenzverwaltung</Button>
        </Link>
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border border-border bg-card p-5">
            <card.icon className="h-5 w-5" />
            <h2 className="mt-4 text-sm text-muted-foreground">{card.title}</h2>
            <p className="mt-1 text-3xl font-semibold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
