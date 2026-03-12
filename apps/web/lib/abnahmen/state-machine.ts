import type { AbnahmeRecord, AbnahmeStatus } from '@/lib/abnahmen/types';
import { getOpenDefectsBySeverity } from '@/lib/abnahmen/selectors';

type Transition = {
  from: AbnahmeStatus;
  to: AbnahmeStatus;
};

const transitions: Transition[] = [
  { from: 'PREPARATION', to: 'INSPECTION_SCHEDULED' },
  { from: 'INSPECTION_SCHEDULED', to: 'INSPECTION_DONE' },
  { from: 'INSPECTION_DONE', to: 'DEFECTS_OPEN' },
  { from: 'INSPECTION_DONE', to: 'ACCEPTED' },
  { from: 'DEFECTS_OPEN', to: 'REWORK_IN_PROGRESS' },
  { from: 'REWORK_IN_PROGRESS', to: 'REWORK_READY_FOR_REVIEW' },
  { from: 'REWORK_READY_FOR_REVIEW', to: 'DEFECTS_OPEN' },
  { from: 'REWORK_READY_FOR_REVIEW', to: 'ACCEPTED_WITH_RESERVATION' },
  { from: 'REWORK_READY_FOR_REVIEW', to: 'ACCEPTED' },
  { from: 'ACCEPTED_WITH_RESERVATION', to: 'ACCEPTED' },
  { from: 'ACCEPTED', to: 'CLOSED' },
];

export function getAllowedTransitions(status: AbnahmeStatus): AbnahmeStatus[] {
  return transitions.filter((entry) => entry.from === status).map((entry) => entry.to);
}

export function canTransition(from: AbnahmeStatus, to: AbnahmeStatus): boolean {
  return transitions.some((entry) => entry.from === from && entry.to === to);
}

export function getTransitionBlockers(record: AbnahmeRecord, to: AbnahmeStatus): string[] {
  const blockers: string[] = [];

  if (to === 'INSPECTION_DONE') {
    if (!record.protocol.inspectionDate) blockers.push('Das Begehungsdatum muss dokumentiert sein.');
    if (!record.protocol.place) blockers.push('Der Ort der Abnahme muss angegeben sein.');
    if (record.protocol.participants.filter((entry) => entry.present).length < 2) {
      blockers.push('Mindestens zwei Teilnehmer müssen als anwesend protokolliert sein.');
    }
  }

  if (to === 'ACCEPTED' || to === 'ACCEPTED_WITH_RESERVATION') {
    const criticalDefects = getOpenDefectsBySeverity(record, 'critical');
    if (criticalDefects > 0) blockers.push('Kritische Mängel müssen vor Abnahme geschlossen sein.');
    if (to === 'ACCEPTED_WITH_RESERVATION' && !record.protocol.reservationText?.trim()) {
      blockers.push('Für eine Abnahme mit Vorbehalt ist ein Vorbehaltstext erforderlich.');
    }
  }

  if (to === 'CLOSED') {
    if (record.protocol.signoffStatus !== 'signed') {
      blockers.push('Die Abnahme muss signiert sein, bevor sie geschlossen wird.');
    }
  }

  return blockers;
}

export function transitionRecordStatus(record: AbnahmeRecord, to: AbnahmeStatus): {
  ok: boolean;
  blockers: string[];
} {
  if (!canTransition(record.status, to)) {
    return { ok: false, blockers: [`Statuswechsel ${record.status} -> ${to} ist nicht erlaubt.`] };
  }

  const blockers = getTransitionBlockers(record, to);
  if (blockers.length > 0) {
    return { ok: false, blockers };
  }

  return { ok: true, blockers: [] };
}
