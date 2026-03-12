import type {
  AbnahmeRecord,
  AbnahmeStatus,
  AbnahmenFilters,
  DefectEntry,
  DefectSeverity,
} from '@/lib/abnahmen/types';

export function matchesAbnahmenQuery(record: AbnahmeRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    record.number.toLowerCase().includes(normalized) ||
    record.projectName.toLowerCase().includes(normalized) ||
    record.customerName.toLowerCase().includes(normalized) ||
    record.siteName.toLowerCase().includes(normalized)
  );
}

export function filterAbnahmen(records: AbnahmeRecord[], filters: AbnahmenFilters): AbnahmeRecord[] {
  return records.filter((record) => {
    const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
    const criticalMatches = filters.onlyCritical ? getOpenDefectsBySeverity(record, 'critical') > 0 : true;
    const overdueMatches = filters.onlyOverdue ? record.isOverdue : true;
    return statusMatches && criticalMatches && overdueMatches && matchesAbnahmenQuery(record, filters.query);
  });
}

export function getOpenDefects(record: AbnahmeRecord): DefectEntry[] {
  return record.defects.filter((defect) => defect.status !== 'RESOLVED');
}

export function getOpenDefectsBySeverity(record: AbnahmeRecord, severity: DefectSeverity): number {
  return getOpenDefects(record).filter((defect) => defect.severity === severity).length;
}

export function getOverdueReworkCount(record: AbnahmeRecord): number {
  const now = Date.now();
  return getOpenDefects(record).filter((defect) => {
    if (!defect.dueDate) return false;
    return new Date(defect.dueDate).getTime() < now;
  }).length;
}

export function getKpiSummary(records: AbnahmeRecord[]): {
  openAbnahmen: number;
  criticalDefects: number;
  overdueRework: number;
} {
  const openAbnahmen = records.filter((record) => record.status !== 'ACCEPTED' && record.status !== 'CLOSED').length;
  const criticalDefects = records.reduce((acc, record) => acc + getOpenDefectsBySeverity(record, 'critical'), 0);
  const overdueRework = records.reduce((acc, record) => acc + getOverdueReworkCount(record), 0);
  return { openAbnahmen, criticalDefects, overdueRework };
}

export function getStatusLabel(status: AbnahmeStatus): string {
  switch (status) {
    case 'PREPARATION':
      return 'Vorbereitung';
    case 'INSPECTION_SCHEDULED':
      return 'Termin geplant';
    case 'INSPECTION_DONE':
      return 'Begehung erfolgt';
    case 'DEFECTS_OPEN':
      return 'Mängel offen';
    case 'REWORK_IN_PROGRESS':
      return 'Nacharbeit läuft';
    case 'REWORK_READY_FOR_REVIEW':
      return 'Nacharbeit prüfbereit';
    case 'ACCEPTED_WITH_RESERVATION':
      return 'Abnahme mit Vorbehalt';
    case 'ACCEPTED':
      return 'Abgenommen';
    case 'CLOSED':
      return 'Abgeschlossen';
    default:
      return status;
  }
}
