'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { LicenseSeatTable } from '@/components/license-seat-table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState, ErrorBanner } from '@/components/dashboard/states';

type Seat = {
  id: string;
  userEmail: string;
  status: 'ACTIVE' | 'REVOKED' | 'PENDING';
  updatedAt: string;
};

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
    <div className="space-y-6">
      <PageHeader
        title="Lizenzverwaltung"
        description="Named seats, Entitlements und Auditierbarkeit pro Tenant."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSeats} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Aktualisieren
          </Button>
          <Button size="sm">Seat zuweisen</Button>
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="premium-divider" />

      <section>
        {loading ? (
          <div className="premium-panel h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
        ) : seats.length === 0 ? (
          <EmptyState
            title="Keine Seats vorhanden"
            description="Weisen Sie Mitarbeitern Lizenzen zu."
            icon={<KeyRound className="h-8 w-8" />}
          />
        ) : (
          <LicenseSeatTable seats={seats} />
        )}
      </section>
    </div>
  );
}
