import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KundenFilters, KundenSavedViewId, KundenStatus } from '@/lib/kunden/types';

const savedViews: Array<{ id: KundenSavedViewId; label: string }> = [
  { id: 'ALLE_AKTIVEN', label: 'Aktive Kunden' },
  { id: 'SLA_RISIKO', label: 'SLA Risiko' },
  { id: 'CONSENT_OFFEN', label: 'Consent offen' },
  { id: 'FOLLOWUP_DIESE_WOCHE', label: 'Follow-up Woche' },
];

const statusFilter: Array<{ id: 'ALL' | KundenStatus; label: string }> = [
  { id: 'ALL', label: 'Alle' },
  { id: 'LEAD', label: 'Lead' },
  { id: 'AKTIV', label: 'Aktiv' },
  { id: 'RUHEND', label: 'Ruhend' },
  { id: 'ARCHIVIERT', label: 'Archiviert' },
];

type KundenFilterPanelProps = {
  filters: KundenFilters;
  owners: string[];
  regions: string[];
  activeSavedView: KundenSavedViewId | null;
  onApplySavedView: (viewId: KundenSavedViewId) => void;
  onChange: (next: KundenFilters) => void;
};

export function KundenFilterPanel({
  filters,
  owners,
  regions,
  activeSavedView,
  onApplySavedView,
  onChange,
}: KundenFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Saved Views</p>
        <div className="flex flex-wrap gap-2">
          {savedViews.map((view) => (
            <Button
              key={view.id}
              size="sm"
              variant={activeSavedView === view.id ? 'default' : 'outline'}
              onClick={() => onApplySavedView(view.id)}
            >
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      <Input
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        placeholder="Suche nach Kunde, Objekt, Kontakt..."
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusFilter.map((status) => (
            <Button
              key={status.id}
              size="sm"
              variant={filters.status === status.id ? 'default' : 'outline'}
              onClick={() => onChange({ ...filters, status: status.id })}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.owner}
          onChange={(event) => onChange({ ...filters, owner: event.target.value })}
        >
          <option value="ALL">Alle Owner</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.region}
          onChange={(event) => onChange({ ...filters, region: event.target.value })}
        >
          <option value="ALL">Alle Regionen</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.onlySlaRisk}
            onChange={(event) => onChange({ ...filters, onlySlaRisk: event.target.checked })}
          />
          Nur SLA-Risiko
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.onlyConsentMissing}
            onChange={(event) => onChange({ ...filters, onlyConsentMissing: event.target.checked })}
          />
          Nur Consent offen
        </label>
      </div>
    </div>
  );
}
