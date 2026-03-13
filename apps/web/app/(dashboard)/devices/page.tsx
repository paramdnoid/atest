'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Monitor, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { ErrorBanner } from '@/components/dashboard/states';

type Device = {
  id: string;
  name?: string;
  platform: string;
  status: string;
  lastSeenAt?: string;
  registeredAt?: string;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  revoked: 'secondary',
  pending: 'outline',
};

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDevices = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      router.push('/signin');
      setLoading(false);
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
      <div className="space-y-3">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = devices.filter((d) => d.status === 'active').length;

  return (
    <ModulePageTemplate
      title="Geräte"
      description={`${activeCount} aktiv · ${devices.length} gesamt`}
      actions={
        <Button variant="outline" size="sm" onClick={fetchDevices} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      }
      kpis={[]}
      mainContent={
        <ModuleTableCard
          icon={Monitor}
          label="Geräteregister"
          title="Alle registrierten Endgeräte"
          hasData={devices.length > 0}
          errorMessage={error || undefined}
          emptyState={{
            icon: <Monitor className="h-8 w-8" />,
            title: 'Noch keine Geräte registriert',
            description: 'Geräte verbinden sich automatisch beim ersten Sync.',
          }}
        >
          <Table>
            <TableHeader className="bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Gerät</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Plattform</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Status</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Zuletzt gesehen</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Registriert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="px-4 py-3 font-medium">{device.name ?? device.id.slice(0, 8)}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground capitalize">{device.platform}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={statusVariant[device.status] ?? 'secondary'} className="capitalize">
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString('de-DE') : '–'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {device.registeredAt ? new Date(device.registeredAt).toLocaleDateString('de-DE') : '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ModuleTableCard>
      }
      sideContent={
        <ModuleTableCard icon={Activity} label="Betrieb" title="Statusübersicht" hasData>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Aktiv: {activeCount}</p>
            <p>Inaktiv/ausstehend: {devices.length - activeCount}</p>
            <p>Gesamt: {devices.length}</p>
            {error ? <ErrorBanner message={error} /> : null}
          </div>
        </ModuleTableCard>
      }
    />
  );
}
