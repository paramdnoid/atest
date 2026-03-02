'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, CreditCard, Monitor, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Workspace = {
  tenantId: string;
  workspaceName: string;
  tradeName?: string;
  email?: string;
  role: string;
};

type BillingSummary = {
  planName: string;
  billingInterval?: string;
  status: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
};

type Device = {
  id: string;
  name?: string;
  platform: string;
  status: string;
  lastSeenAt?: string;
};

type DashboardData = {
  workspace: Workspace | null;
  billing: BillingSummary | null;
  devices: Device[];
};

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  revoked: 'bg-zinc-100 text-zinc-600',
  pending: 'bg-amber-50 text-amber-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({ workspace: null, billing: null, devices: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('zg_access_token');
    if (!token) {
      router.push('/signin');
      return;
    }

    setLoading(true);
    setError('');

    const [workspaceRes, billingRes, devicesRes] = await Promise.allSettled([
      apiRequest<Workspace>({ path: '/v1/workspace/me', token }),
      apiRequest<BillingSummary>({ path: '/v1/billing/summary', token }),
      apiRequest<{ devices?: Device[] } | Device[]>({ path: '/v1/devices', token }),
    ]);

    const rawDevices = devicesRes.status === 'fulfilled' ? devicesRes.value : [];
    const devices = Array.isArray(rawDevices) ? rawDevices : (rawDevices.devices ?? []);

    setData({
      workspace: workspaceRes.status === 'fulfilled' ? workspaceRes.value : null,
      billing: billingRes.status === 'fulfilled' ? billingRes.value : null,
      devices,
    });

    const failures = [workspaceRes, billingRes, devicesRes].filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      setError('Einige Daten konnten nicht geladen werden. API erreichbar?');
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCount = data.devices.filter((d) => d.status === 'active').length;

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{data.workspace?.workspaceName ?? 'Dashboard'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[data.workspace?.tradeName, data.workspace?.role].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
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

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Workspace</span>
          </div>
          <p className="mt-3 truncate text-xl font-semibold">
            {data.workspace?.workspaceName ?? '–'}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{data.workspace?.email ?? '–'}</p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Plan</span>
          </div>
          <p className="mt-3 text-xl font-semibold">{data.billing?.planName ?? '–'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.billing?.status ?? 'Unbekannt'}
            {data.billing?.currentPeriodEnd
              ? ` · bis ${new Date(data.billing.currentPeriodEnd).toLocaleDateString('de-DE')}`
              : ''}
          </p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Geräte</span>
          </div>
          <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} aktiv · {data.devices.length} gesamt
          </p>
        </article>
      </section>

      {data.devices.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Geräte</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Plattform</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Zuletzt gesehen</th>
                </tr>
              </thead>
              <tbody>
                {data.devices.map((device) => (
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
                      {device.lastSeenAt
                        ? new Date(device.lastSeenAt).toLocaleDateString('de-DE')
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Monitor className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 font-medium">Noch keine Geräte registriert</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Geräte verbinden sich automatisch beim ersten Sync.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
