import { FileCheck2 } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import type { AbnahmeProtocol } from '@/lib/abnahmen/types';
import { formatDate } from '@/lib/format';

export function AbnahmeProtocolCard({ protocol }: { protocol: AbnahmeProtocol }) {
  return (
    <ModuleTableCard
      icon={FileCheck2}
      label="Protokoll"
      title="Abnahmeprotokoll und Vorbehalte"
      className="bg-muted/35"
      hasData
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-border/70 bg-background/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{protocol.acceptanceType}</Badge>
            <Badge variant={protocol.signoffStatus === 'signed' ? 'default' : 'secondary'}>
              {protocol.signoffStatus === 'signed' ? 'Signiert' : 'Ausstehend'}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Signaturzeitpunkt: {protocol.signedAt ? formatDate(protocol.signedAt) : 'noch nicht signiert'}
          </p>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Termin</dt>
            <dd>{protocol.appointmentDate ? formatDate(protocol.appointmentDate) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Begehung</dt>
            <dd>{protocol.inspectionDate ? formatDate(protocol.inspectionDate) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ort</dt>
            <dd>{protocol.place ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Signiert am</dt>
            <dd>{protocol.signedAt ? formatDate(protocol.signedAt) : '—'}</dd>
          </div>
        </dl>
        <div>
          <p className="text-sm font-medium">Teilnehmer</p>
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            {protocol.participants.map((participant) => (
              <li key={participant.id} className="flex items-center justify-between gap-2">
                <span>
                  {participant.name} · {participant.role}
                </span>
                <Badge variant={participant.present ? 'default' : 'outline'}>
                  {participant.present ? 'Anwesend' : 'Abwesend'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        {protocol.reservationText && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50/70 p-3.5 text-sm dark:bg-amber-950/30">
            <p className="font-medium">Vorbehalt</p>
            <p className="mt-1 text-muted-foreground">{protocol.reservationText}</p>
          </div>
        )}
      </div>
    </ModuleTableCard>
  );
}
