import type {
  KundenFilters,
  KundenKpis,
  KundenRecord,
  KundenSavedViewId,
  KundenSortKey,
} from '@/lib/kunden/types';

function compareBySortKey(a: KundenRecord, b: KundenRecord, key: KundenSortKey): number {
  if (key === 'name') return a.name.localeCompare(b.name);
  if (key === 'score') return a.score - b.score;
  if (key === 'nextFollowUpAt') {
    const left = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
    const right = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
    return left - right;
  }
  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
}

export function matchesKundenQuery(record: KundenRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    record.number.toLowerCase().includes(normalized) ||
    record.name.toLowerCase().includes(normalized) ||
    record.region.toLowerCase().includes(normalized) ||
    record.ansprechpartner.some((contact) => contact.name.toLowerCase().includes(normalized)) ||
    record.objekte.some((objekt) => objekt.name.toLowerCase().includes(normalized))
  );
}

export function filterKunden(records: KundenRecord[], filters: KundenFilters): KundenRecord[] {
  const filtered = records.filter((record) => {
    const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
    const brancheMatches = filters.branche === 'ALL' ? true : record.branche === filters.branche;
    const ownerMatches = filters.owner === 'ALL' ? true : record.owner === filters.owner;
    const regionMatches = filters.region === 'ALL' ? true : record.region === filters.region;
    const slaRiskMatches = filters.onlySlaRisk
      ? record.reminders.some((reminder) => reminder.breachState !== 'ON_TRACK')
      : true;
    const consentMatches = filters.onlyConsentMissing ? record.consentState !== 'ERTEILT' : true;
    return (
      statusMatches &&
      brancheMatches &&
      ownerMatches &&
      regionMatches &&
      slaRiskMatches &&
      consentMatches &&
      matchesKundenQuery(record, filters.query)
    );
  });

  const sorted = [...filtered].sort((a, b) => compareBySortKey(a, b, filters.sortBy));
  return filters.sortDirection === 'asc' ? sorted : sorted.reverse();
}

export function getKundenKpis(records: KundenRecord[]): KundenKpis {
  return {
    aktiveKunden: records.filter((record) => record.status === 'AKTIV').length,
    objekteMitSlaRisiko: records.reduce((acc, record) => {
      const risky = record.reminders.some((reminder) => reminder.breachState !== 'ON_TRACK');
      return acc + (risky ? record.objekte.length : 0);
    }, 0),
    offeneFollowUps: records.filter((record) => record.nextFollowUpAt).length,
    duplikatVerdacht: records.reduce(
      (acc, record) => acc + record.duplicateCandidates.filter((candidate) => candidate.resolution === 'OPEN').length,
      0,
    ),
  };
}

export function applyKundenSavedView(viewId: KundenSavedViewId, current: KundenFilters): KundenFilters {
  if (viewId === 'ALLE_AKTIVEN') {
    return { ...current, status: 'AKTIV', onlySlaRisk: false, onlyConsentMissing: false, sortBy: 'updatedAt' };
  }
  if (viewId === 'SLA_RISIKO') {
    return { ...current, status: 'ALL', onlySlaRisk: true, onlyConsentMissing: false, sortBy: 'nextFollowUpAt' };
  }
  if (viewId === 'CONSENT_OFFEN') {
    return { ...current, status: 'ALL', onlySlaRisk: false, onlyConsentMissing: true, sortBy: 'name' };
  }
  return {
    ...current,
    status: 'ALL',
    onlySlaRisk: false,
    onlyConsentMissing: false,
    sortBy: 'nextFollowUpAt',
  };
}
