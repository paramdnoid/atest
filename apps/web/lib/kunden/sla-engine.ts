import type { KundenRecord, KundenReminder, SlaBreachState } from '@/lib/kunden/types';

function toTimestamp(value: string): number {
  return new Date(value).getTime();
}

export function evaluateReminderState(reminder: KundenReminder, now = new Date()): SlaBreachState {
  const nowTs = now.getTime();
  const dueTs = toTimestamp(reminder.dueAt);
  if (nowTs > dueTs) return 'BREACHED';

  const totalWindow = Math.max(dueTs - toTimestamp(reminder.startAt), 1);
  const remaining = dueTs - nowTs;
  const ratio = remaining / totalWindow;
  if (ratio < 0.2) return 'AT_RISK';
  return 'ON_TRACK';
}

export function evaluateKundenSla(record: KundenRecord, now = new Date()): KundenReminder[] {
  return record.reminders.map((reminder) => ({
    ...reminder,
    breachState: evaluateReminderState(reminder, now),
  }));
}

export function getHighestSlaState(records: KundenRecord[], now = new Date()): SlaBreachState {
  let hasRisk = false;
  for (const record of records) {
    for (const reminder of record.reminders) {
      const state = evaluateReminderState(reminder, now);
      if (state === 'BREACHED') return 'BREACHED';
      if (state === 'AT_RISK') hasRisk = true;
    }
  }
  return hasRisk ? 'AT_RISK' : 'ON_TRACK';
}
