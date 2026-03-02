'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { LicenseSeatTable } from '@/components/license-seat-table';
import { Button } from '@/components/ui/button';

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
    const token = localStorage.getItem('zg_access_token');
    if (!token) {
      router.push('/signin');
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
    <div className="px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Lizenzverwaltung</h1>
          <p className="mt-1 text-muted-foreground">
            Named seats, Entitlements und Auditierbarkeit pro Tenant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSeats} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Aktualisieren
          </Button>
          <Button size="sm">Seat zuweisen</Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="mt-8">
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
        ) : seats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <p className="font-medium">Keine Seats vorhanden</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weisen Sie Mitarbeitern Lizenzen zu.
            </p>
          </div>
        ) : (
          <LicenseSeatTable seats={seats} />
        )}
      </section>
    </div>
  );
}
