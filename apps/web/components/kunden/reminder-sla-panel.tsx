import { AlarmClockCheck } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { formatDate } from '@/lib/format';
import { evaluateKundenSla } from '@/lib/kunden/sla-engine';
import type { KundenRecord } from '@/lib/kunden/types';

function getSlaClass(state: 'ON_TRACK' | 'AT_RISK' | 'BREACHED'): string {
  if (state === 'BREACHED') return 'text-red-700';
  if (state === 'AT_RISK') return 'text-amber-700';
  return 'text-emerald-700';
}

export function ReminderSlaPanel({ record }: { record: KundenRecord }) {
  const reminders = evaluateKundenSla(record);
  return (
    <ModuleTableCard
      icon={AlarmClockCheck}
      label="Reminder"
      title="SLA Steuerung"
      hasData={reminders.length > 0}
      emptyState={{
        icon: <AlarmClockCheck className="h-8 w-8" />,
        title: 'Keine Reminder aktiv',
        description: 'Lege SLA-Reminder fuer Folgeauftraege an.',
      }}
    >
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="rounded-lg border border-border bg-sidebar/20 p-3 text-sm">
            <p className="font-medium">{reminder.title}</p>
            <p className="text-xs text-muted-foreground">Faellig: {formatDate(reminder.dueAt)}</p>
            <p className={`text-xs font-medium ${getSlaClass(reminder.breachState)}`}>
              {reminder.breachState === 'ON_TRACK'
                ? 'On Track'
                : reminder.breachState === 'AT_RISK'
                  ? 'At Risk'
                  : 'Breached'}
            </p>
          </div>
        ))}
      </div>
    </ModuleTableCard>
  );
}
