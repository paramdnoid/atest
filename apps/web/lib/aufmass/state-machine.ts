import type { AufmassRecord, AufmassStatus } from '@/lib/aufmass/types';
import { getRecordOvermeasureIssues } from '@/lib/aufmass/selectors';

type Transition = {
  from: AufmassStatus;
  to: AufmassStatus;
};

const transitions: Transition[] = [
  { from: 'DRAFT', to: 'IN_REVIEW' },
  { from: 'IN_REVIEW', to: 'DRAFT' },
  { from: 'IN_REVIEW', to: 'APPROVED' },
  { from: 'APPROVED', to: 'BILLED' },
];

export function getAllowedTransitions(status: AufmassStatus): AufmassStatus[] {
  return transitions.filter((entry) => entry.from === status).map((entry) => entry.to);
}

export function canTransition(from: AufmassStatus, to: AufmassStatus): boolean {
  return transitions.some((entry) => entry.from === from && entry.to === to);
}

export function getStatusLabel(status: AufmassStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Entwurf';
    case 'IN_REVIEW':
      return 'In Prüfung';
    case 'APPROVED':
      return 'Freigegeben';
    case 'BILLED':
      return 'Abgerechnet';
    default:
      return status;
  }
}

export function getTransitionBlockers(record: AufmassRecord, to: AufmassStatus): string[] {
  const blockers: string[] = [];
  const allIssues = getRecordOvermeasureIssues(record);

  if (to === 'IN_REVIEW') {
    if (record.rooms.length === 0) {
      blockers.push('Mindestens ein Raum ist erforderlich.');
    }
    if (record.measurements.length === 0) {
      blockers.push('Mindestens ein Aufmaßeintrag ist erforderlich.');
    }
    if (record.mappings.length === 0) {
      blockers.push('Mindestens eine Positionszuordnung ist erforderlich.');
    }
    const overmeasureBlockers = allIssues.filter((issue) => issue.severity === 'blocking');
    if (overmeasureBlockers.length > 0) {
      blockers.push('Overmeasure-Regeln sind unvollständig oder fehlerhaft.');
    }
  }

  if (to === 'APPROVED') {
    const blockingIssues = allIssues.filter((issue) => issue.severity === 'blocking');
    if (blockingIssues.length > 0) {
      blockers.push('Offene Blocker aus der Prüfung verhindern die Freigabe.');
    }
  }

  if (to === 'BILLED') {
    if (record.measurements.length === 0) {
      blockers.push('Ohne Aufmaßpositionen ist keine Abrechnungsvorschau möglich.');
    }
    if (record.status !== 'APPROVED') {
      blockers.push('Nur freigegebene Aufmaße dürfen abgerechnet werden.');
    }
  }

  return blockers;
}

export function transitionRecordStatus(record: AufmassRecord, to: AufmassStatus): {
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
