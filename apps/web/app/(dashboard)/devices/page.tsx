'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Monitor, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Device = {
  id: string;
  name?: string;
  platform: string;
  status: string;
  lastSeenAt?: string;
  registeredAt?: string;
};

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  revoked: 'bg-zinc-100 text-zinc-600',
  pending: 'bg-amber-50 text-amber-700',
};

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDevices = useCallback(async () => {
    const token = localStorage.getItem('zg_access_token');
    if (!token) {
      router.push('/signin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest<{ devices?: Device[] } | Device[]>({ path: '/v1/devices', token });
      setDevices(Array.isArray(data) ? data : (data.devices ?? []));
    } catch {
      setError('Geräte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = devices.filter((d) => d.status === 'active').length;

  return (
    <div className="px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Geräte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} aktiv · {devices.length} gesamt
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDevices} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {devices.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Gerät</th>
                <th className="px-4 py-3 font-medium">Plattform</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Zuletzt gesehen</th>
                <th className="px-4 py-3 font-medium">Registriert</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{device.name ?? device.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{device.platform}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass[device.status] ?? 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString('de-DE') : '–'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.registeredAt ? new Date(device.registeredAt).toLocaleDateString('de-DE') : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Monitor className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium">Noch keine Geräte registriert</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Geräte verbinden sich automatisch beim ersten Sync.
          </p>
        </div>
      )}
    </div>
  );
}
