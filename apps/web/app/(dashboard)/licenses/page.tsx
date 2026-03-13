'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { LicenseSeatTable } from '@/components/license-seat-table';
import { Button } from '@/components/ui/button';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';

type Seat = {
  id: string;
  userEmail: string;
  status: 'ACTIVE' | 'REVOKED' | 'PENDING';
  updatedAt: string;
};

function parseSeatsPayload(payload: unknown): { seats?: Seat[] } | Seat[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Ungueltige Antwort fuer Lizenz-Sitze.');
  }
  if (Array.isArray(payload)) {
    return payload as Seat[];
  }
  return payload as { seats?: Seat[] };
}

export default function LicensesPage() {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSeats = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      router.push('/signin');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ seats?: Seat[] } | Seat[]>({
        path: '/v1/licenses/seats',
        token,
        validate: parseSeatsPayload,
      });
      const normalized = Array.isArray(data) ? data : (data.seats ?? []);
      setSeats(
        normalized.map((s) => ({
          ...s,
          status: (s.status?.toUpperCase() ?? 'PENDING') as Seat['status'],
          updatedAt: s.updatedAt
            ? new Date(s.updatedAt).toLocaleDateString('de-DE')
            : '–',
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  return (
    <ModulePageTemplate
      title="Lizenzverwaltung"
      description="Named seats, Entitlements und Auditierbarkeit pro Tenant."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSeats} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Aktualisieren
          </Button>
          <Button size="sm">Seat zuweisen</Button>
        </div>
      }
      kpis={[]}
      mainContent={
        <ModuleTableCard
          icon={KeyRound}
          label="Seats"
          title="Lizenzzuweisungen"
          hasData={!loading && seats.length > 0}
          isLoading={loading}
          errorMessage={error || undefined}
          emptyState={{
            icon: <KeyRound className="h-8 w-8" />,
            title: 'Keine Seats vorhanden',
            description: 'Weisen Sie Mitarbeitern Lizenzen zu.',
          }}
        >
          <LicenseSeatTable seats={seats} />
        </ModuleTableCard>
      }
      sideContent={
        <ModuleTableCard icon={ShieldCheck} label="Kontrolle" title="Status" hasData>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Aktiv: {seats.filter((seat) => seat.status === 'ACTIVE').length}</p>
            <p>Ausstehend: {seats.filter((seat) => seat.status === 'PENDING').length}</p>
            <p>Entzogen: {seats.filter((seat) => seat.status === 'REVOKED').length}</p>
          </div>
        </ModuleTableCard>
      }
    />
  );
}
