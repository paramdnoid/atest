import { getQuoteIntelligenceSignals } from '@/lib/angebote/intelligence';
import { getQuoteTotals } from '@/lib/angebote/pricing';
import type {
  QuoteFilters,
  QuoteKpis,
  QuoteRecord,
  QuoteRiskLevel,
  QuoteSavedViewId,
  QuoteStatus,
} from '@/lib/angebote/types';

function includesInsensitive(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

function statusOrder(status: QuoteStatus): number {
  const order: QuoteStatus[] = [
    'DRAFT',
    'READY_FOR_REVIEW',
    'IN_APPROVAL',
    'APPROVED',
    'SENT',
    'CONVERTED_TO_ORDER',
    'ARCHIVED',
  ];
  return order.indexOf(status);
}

export function getQuoteRiskLevel(record: QuoteRecord, allRecords: QuoteRecord[]): QuoteRiskLevel {
  const totals = getQuoteTotals(record);
  const signals = getQuoteIntelligenceSignals(record, allRecords);
  if (signals.some((signal) => signal.severity === 'blocking')) return 'HIGH';
  if (totals.marginPercent < 18 || signals.some((signal) => signal.severity === 'warning')) return 'MEDIUM';
  return 'LOW';
}

export function matchesQuoteQuery(record: QuoteRecord, query: string): boolean {
  if (!query.trim()) return true;
  return (
    includesInsensitive(record.number, query) ||
    includesInsensitive(record.customerName, query) ||
    includesInsensitive(record.projectName, query) ||
    includesInsensitive(record.owner, query)
  );
}

function compareBySort(a: QuoteRecord, b: QuoteRecord, filters: QuoteFilters): number {
  const totalsA = getQuoteTotals(a);
  const totalsB = getQuoteTotals(b);
  let result = 0;

  switch (filters.sortBy) {
    case 'updatedAt':
      result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      break;
    case 'validUntil':
      result = new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
      break;
    case 'marginPercent':
      result = totalsA.marginPercent - totalsB.marginPercent;
      break;
    case 'totalNet':
      result = totalsA.totalNet - totalsB.totalNet;
      break;
    default:
      result = statusOrder(a.status) - statusOrder(b.status);
  }

  return filters.sortDirection === 'asc' ? result : result * -1;
}

export function applyQuoteSavedView(view: QuoteSavedViewId, filters: QuoteFilters): QuoteFilters {
  if (view === 'ALL_OPEN') {
    return { ...filters, status: 'ALL', risk: 'ALL', onlyExpiringSoon: false };
  }
  if (view === 'EXPIRING') {
    return { ...filters, status: 'ALL', risk: 'ALL', onlyExpiringSoon: true };
  }
  if (view === 'APPROVAL') {
    return { ...filters, status: 'IN_APPROVAL', risk: 'ALL', onlyExpiringSoon: false };
  }
  return { ...filters, risk: 'HIGH', status: 'ALL', onlyExpiringSoon: false };
}

export function filterQuotes(records: QuoteRecord[], filters: QuoteFilters): QuoteRecord[] {
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  return records
    .filter((record) => {
      const statusMatches = filters.status === 'ALL' || record.status === filters.status;
      const ownerMatches = filters.owner === 'ALL' || record.owner === filters.owner;
      const queryMatches = matchesQuoteQuery(record, filters.query);
      const riskMatches =
        filters.risk === 'ALL' || getQuoteRiskLevel(record, records) === filters.risk;
      const expiringMatches =
        !filters.onlyExpiringSoon ||
        (new Date(record.validUntil).getTime() <= sevenDaysFromNow &&
          new Date(record.validUntil).getTime() >= now);
      return statusMatches && ownerMatches && queryMatches && riskMatches && expiringMatches;
    })
    .sort((a, b) => compareBySort(a, b, filters));
}

export function getQuoteKpis(records: QuoteRecord[]): QuoteKpis {
  const totals = records.map((record) => getQuoteTotals(record));
  const pipelineNet = totals.reduce((sum, total) => sum + total.totalNet, 0);
  const openApprovals = records.filter((record) => record.status === 'IN_APPROVAL').length;
  const converted = records.filter((record) => record.status === 'CONVERTED_TO_ORDER').length;
  const sentOrConverted = records.filter(
    (record) => record.status === 'SENT' || record.status === 'CONVERTED_TO_ORDER',
  ).length;
  const conversionRate = sentOrConverted === 0 ? 0 : (converted / sentOrConverted) * 100;
  const averageMarginPercent =
    totals.length === 0 ? 0 : totals.reduce((sum, total) => sum + total.marginPercent, 0) / totals.length;

  return {
    pipelineNet: Math.round(pipelineNet * 100) / 100,
    openApprovals,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageMarginPercent: Math.round(averageMarginPercent * 10) / 10,
  };
}
