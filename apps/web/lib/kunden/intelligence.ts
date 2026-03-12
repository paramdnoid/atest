import type { KundenIntelligenceSignal, KundenRecord } from '@/lib/kunden/types';

export function getKundenIntelligenceSignals(
  record: KundenRecord,
  allRecords: KundenRecord[],
): KundenIntelligenceSignal[] {
  const signals: KundenIntelligenceSignal[] = [];

  if (record.consentState !== 'ERTEILT') {
    signals.push({
      id: `${record.id}-consent`,
      severity: 'critical',
      title: 'Consent-Luecke',
      message: 'Fuer proaktive Folgeauftraege fehlt ein dokumentierter Consent.',
    });
  }

  if (record.reminders.some((reminder) => reminder.breachState === 'BREACHED')) {
    signals.push({
      id: `${record.id}-sla`,
      severity: 'warning',
      title: 'SLA-Verletzung',
      message: 'Mindestens ein Follow-up ist ueberfaellig.',
    });
  }

  if (record.objekte.length === 0) {
    signals.push({
      id: `${record.id}-objekte`,
      severity: 'warning',
      title: 'Objektdaten unvollstaendig',
      message: 'Keine aktiven Objekte hinterlegt. Folgeauftraege sind schwer planbar.',
    });
  }

  const avgScore =
    allRecords.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, allRecords.length);
  if (record.score < avgScore - 10) {
    signals.push({
      id: `${record.id}-score`,
      severity: 'info',
      title: 'Score unter Portfolio-Schnitt',
      message: 'Empfehlung: Kundenbeziehung mit strukturierten Touchpoints intensivieren.',
    });
  }

  return signals;
}

export function getNextBestAction(record: KundenRecord): string {
  if (record.consentState !== 'ERTEILT') {
    return 'Consent fuer primaeren Ansprechpartner dokumentieren.';
  }
  if (record.reminders.some((reminder) => reminder.breachState === 'BREACHED')) {
    return 'Ueberfaellige Follow-ups priorisiert abarbeiten.';
  }
  if (record.objekte.length === 0) {
    return 'Mindestens ein Objekt mit Serviceintervall anlegen.';
  }
  return 'Angebotsfenster fuer naechsten Zyklus vorbereiten.';
}
