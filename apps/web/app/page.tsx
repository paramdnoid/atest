import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <h1 className="text-4xl font-semibold">Zunftgewerk Control Plane</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Enterprise-fokussierte Multi-Tenant Verwaltung fuer Plaene, Lizenzen, Rollen und Offline-Sync.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signin">
          <Button>Anmelden</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
