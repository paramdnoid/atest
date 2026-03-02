import { LicenseSeatTable } from '@/components/license-seat-table';
import { Button } from '@/components/ui/button';

const seats = [
  { id: 'seat_01JXXA', userEmail: 'admin@zunft.ch', status: 'ACTIVE' as const, updatedAt: 'Heute' },
  { id: 'seat_01JXXB', userEmail: 'bauleiter@zunft.ch', status: 'PENDING' as const, updatedAt: 'Vor 2h' },
  { id: 'seat_01JXXC', userEmail: 'alt@zunft.ch', status: 'REVOKED' as const, updatedAt: 'Gestern' }
];

export default function LicensesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Lizenzverwaltung</h1>
          <p className="mt-1 text-muted-foreground">Named seats, Entitlements und Auditierbarkeit pro Tenant.</p>
        </div>
        <Button>Seat zuweisen</Button>
      </div>

      <section className="mt-8">
        <LicenseSeatTable seats={seats} />
      </section>
    </main>
  );
}
