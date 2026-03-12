import { Filter, Search } from 'lucide-react';

import { FormCheckbox, FormSelect } from '@/components/angebote/form-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QuoteFilters, QuoteSavedViewId } from '@/lib/angebote/types';

type AngeboteFilterPanelProps = {
  filters: QuoteFilters;
  owners: string[];
  onChange: (next: QuoteFilters) => void;
  onApplySavedView: (viewId: QuoteSavedViewId) => void;
  activeSavedView?: QuoteSavedViewId | null;
};

const savedViews: Array<{ id: QuoteSavedViewId; label: string }> = [
  { id: 'ALL_OPEN', label: 'Alle offenen' },
  { id: 'EXPIRING', label: 'Demnaechst faellig' },
  { id: 'APPROVAL', label: 'In Freigabe' },
  { id: 'MARGIN_RISK', label: 'Marge kritisch' },
];

export function AngeboteFilterPanel({
  filters,
  owners,
  onChange,
  onApplySavedView,
  activeSavedView,
}: AngeboteFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Suche
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              className="h-9 pl-8 text-sm"
              placeholder="Suche nach Nummer, Kunde, Projekt, Verantwortlich..."
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onChange({
                ...filters,
                query: '',
                status: 'ALL',
                owner: 'ALL',
                risk: 'ALL',
                onlyExpiringSoon: false,
              })
            }
            aria-label="Filter zuruecksetzen"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Filter
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <FormSelect
            value={filters.sortBy}
            onChange={(event) => onChange({ ...filters, sortBy: event.target.value as QuoteFilters['sortBy'] })}
          >
            <option value="updatedAt">Sortierung: Aktualisiert</option>
            <option value="validUntil">Sortierung: Gueltigkeit</option>
            <option value="marginPercent">Sortierung: Marge</option>
            <option value="totalNet">Sortierung: Netto</option>
          </FormSelect>

          <FormSelect
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value as QuoteFilters['status'] })}
          >
            <option value="ALL">Alle Status</option>
            <option value="DRAFT">Entwurf</option>
            <option value="READY_FOR_REVIEW">Pruefbereit</option>
            <option value="IN_APPROVAL">In Freigabe</option>
            <option value="APPROVED">Freigegeben</option>
            <option value="SENT">Versendet</option>
            <option value="CONVERTED_TO_ORDER">Zu Auftrag</option>
          </FormSelect>

          <FormSelect
            value={filters.owner}
            onChange={(event) => onChange({ ...filters, owner: event.target.value })}
          >
            <option value="ALL">Alle Verantwortlichen</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            value={filters.risk}
            onChange={(event) => onChange({ ...filters, risk: event.target.value as QuoteFilters['risk'] })}
          >
            <option value="ALL">Alle Risiken</option>
            <option value="LOW">Niedrig</option>
            <option value="MEDIUM">Mittel</option>
            <option value="HIGH">Hoch</option>
          </FormSelect>

          <label className="flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm leading-none sm:col-span-2">
            <FormCheckbox
              checked={filters.onlyExpiringSoon}
              onChange={(checked) => onChange({ ...filters, onlyExpiringSoon: checked })}
              ariaLabel="Nur bald faellige Angebote"
            />
            Nur bald faellige Angebote
          </label>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Gespeicherte Ansichten
        </p>
        <div className="relative flex-1">
          <div className="flex flex-wrap gap-2">
            {savedViews.map((view) => (
              <Button
                key={view.id}
                size="sm"
                className="h-8"
                variant={activeSavedView === view.id ? 'default' : 'outline'}
                onClick={() => onApplySavedView(view.id)}
              >
                {view.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground/90">
        Tipp: Mit gespeicherten Ansichten springst du direkt in haeufige Arbeitsmodi.
      </div>
    </div>
  );
}
