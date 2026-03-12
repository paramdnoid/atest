import type { AbnahmeRecord, AbnahmeStatus } from '@/lib/abnahmen/types';
import { getOpenDefectsBySeverity } from '@/lib/abnahmen/selectors';

export type ComplianceRuleResult = {
  level: 'blocking' | 'warning';
  code: string;
  message: string;
};

export function getProtocolComplianceResults(record: AbnahmeRecord): ComplianceRuleResult[] {
  const results: ComplianceRuleResult[] = [];
  const presentParticipants = record.protocol.participants.filter((entry) => entry.present).length;

  if (!record.protocol.inspectionDate) {
    results.push({
      level: 'blocking',
      code: 'protocol_inspection_date_missing',
      message: 'Begehungsdatum fehlt im Protokoll.',
    });
  }
  if (!record.protocol.place) {
    results.push({
      level: 'blocking',
      code: 'protocol_place_missing',
      message: 'Abnahmeort fehlt im Protokoll.',
    });
  }
  if (presentParticipants < 2) {
    results.push({
      level: 'blocking',
      code: 'protocol_participants_insufficient',
      message: 'Mindestens zwei Teilnehmer müssen als anwesend protokolliert sein.',
    });
  }

  if (record.protocol.acceptanceType === 'formal' && record.protocol.signoffStatus === 'unsigned') {
    results.push({
      level: 'warning',
      code: 'formal_protocol_unsigned',
      message: 'Förmliche Abnahme ist noch nicht zur Signatur vorbereitet.',
    });
  }

  return results;
}

export function getTransitionComplianceBlockers(record: AbnahmeRecord, to: AbnahmeStatus): string[] {
  const blockers: string[] = [];
  const protocolResults = getProtocolComplianceResults(record);
  const protocolHardBlockers = protocolResults
    .filter((entry) => entry.level === 'blocking')
    .map((entry) => entry.message);

  if (to === 'INSPECTION_DONE' || to === 'ACCEPTED' || to === 'CLOSED') {
    blockers.push(...protocolHardBlockers);
  }

  if (to === 'ACCEPTED' || to === 'ACCEPTED_WITH_RESERVATION') {
    if (getOpenDefectsBySeverity(record, 'critical') > 0) {
      blockers.push('Kritische Mängel müssen vor der Abnahme behoben oder geschlossen sein.');
    }
  }

  if (to === 'ACCEPTED_WITH_RESERVATION' && !record.protocol.reservationText?.trim()) {
    blockers.push('Vorbehaltstext fehlt für die Abnahme mit Vorbehalt.');
  }

  if (to === 'CLOSED' && record.protocol.signoffStatus !== 'signed') {
    blockers.push('Für den Abschluss ist ein signiertes Protokoll erforderlich.');
  }

  return blockers;
}
