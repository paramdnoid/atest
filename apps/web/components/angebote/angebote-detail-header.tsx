import { Archive, CheckCircle2, Send, Workflow } from 'lucide-react';

import { AngeboteStatusBadge } from '@/components/angebote/angebote-status-badge';
import { Button } from '@/components/ui/button';
import type { QuoteRecord, QuoteStatus } from '@/lib/angebote/types';

type AngeboteDetailHeaderProps = {
  record: QuoteRecord;
  blockers: string[];
  onSetStatus: (to: QuoteStatus) => void;
  onQuickConvert: () => void;
  quickConvertEnabled: boolean;
};

export function AngeboteDetailHeader({
  record,
  blockers,
  onSetStatus,
  onQuickConvert,
  quickConvertEnabled,
}: AngeboteDetailHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Workflow-Status</p>
          <div className="flex items-center gap-2">
            <AngeboteStatusBadge status={record.status} />
            <span className="text-xs text-muted-foreground">Verantwortlich: {record.owner}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Gueltig bis: {new Date(record.validUntil).toLocaleDateString('de-DE')} · Aktualisiert:{' '}
            {new Date(record.updatedAt).toLocaleDateString('de-DE')}
          </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetStatus('READY_FOR_REVIEW')}
              disabled={record.status === 'READY_FOR_REVIEW'}
            >
              <Workflow className="h-4 w-4" />
              Zur Pruefung
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetStatus('IN_APPROVAL')}
              disabled={record.status === 'IN_APPROVAL'}
            >
              <Workflow className="h-4 w-4" />
              In Freigabe
            </Button>
            <Button size="sm" onClick={() => onSetStatus('APPROVED')} disabled={record.status === 'APPROVED'}>
              <CheckCircle2 className="h-4 w-4" />
              Freigeben
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSetStatus('SENT')} disabled={record.status === 'SENT'}>
              <Send className="h-4 w-4" />
              Als versendet markieren
            </Button>
            {quickConvertEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={onQuickConvert}
                disabled={record.status === 'CONVERTED_TO_ORDER'}
              >
                <Workflow className="h-4 w-4" />
                Quick Convert
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onSetStatus('ARCHIVED')} disabled={record.status === 'ARCHIVED'}>
              <Archive className="h-4 w-4" />
              Archivieren
            </Button>
          </div>
        </div>
        {blockers.length > 0 && (
          <div className="rounded-md border border-amber-300/45 bg-amber-50/55 px-3 py-2 text-sm text-amber-800">
            <p className="font-medium">Aktion blockiert:</p>
            <ul className="mt-1 space-y-1">
              {blockers.map((blocker) => (
                <li key={blocker}>- {blocker}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
