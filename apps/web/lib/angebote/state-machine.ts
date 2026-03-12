import type { QuoteRecord, QuoteStatus } from '@/lib/angebote/types';
import { getQuoteTotals } from '@/lib/angebote/pricing';

const transitions: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'ARCHIVED'],
  READY_FOR_REVIEW: ['IN_APPROVAL', 'DRAFT', 'ARCHIVED'],
  IN_APPROVAL: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['SENT', 'DRAFT', 'ARCHIVED'],
  SENT: ['CONVERTED_TO_ORDER', 'ARCHIVED'],
  CONVERTED_TO_ORDER: ['ARCHIVED'],
  ARCHIVED: [],
};

const MIN_MARGIN_PERCENT = 18;

function isValidDate(value: string): boolean {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp);
}

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return transitions[from].includes(to);
}

export function getTransitionBlockers(record: QuoteRecord, to: QuoteStatus): string[] {
  const blockers: string[] = [];
  const totals = getQuoteTotals(record);

  if (!canTransition(record.status, to)) {
    blockers.push(`Statuswechsel ${record.status} -> ${to} ist nicht erlaubt.`);
    return blockers;
  }

  if (to === 'READY_FOR_REVIEW' && record.positions.length === 0) {
    blockers.push('Mindestens eine Position ist erforderlich.');
  }

  if (to === 'IN_APPROVAL' && !record.selectedOptionId) {
    blockers.push('Bitte eine Angebotsoption (Good/Better/Best) auswählen.');
  }

  if ((to === 'APPROVED' || to === 'SENT') && totals.marginPercent < MIN_MARGIN_PERCENT) {
    blockers.push(`Mindestmarge von ${MIN_MARGIN_PERCENT}% wird unterschritten.`);
  }

  if ((to === 'APPROVED' || to === 'SENT') && !isValidDate(record.validUntil)) {
    blockers.push('Gültigkeitsdatum ist nicht gesetzt oder ungültig.');
  }

  if (to === 'CONVERTED_TO_ORDER' && record.status !== 'SENT') {
    blockers.push('Konvertierung ist nur aus Status SENT erlaubt.');
  }

  return blockers;
}

export function transitionQuoteStatus(
  record: QuoteRecord,
  to: QuoteStatus,
): { ok: true } | { ok: false; blockers: string[] } {
  const blockers = getTransitionBlockers(record, to);
  if (blockers.length > 0) {
    return { ok: false, blockers };
  }
  return { ok: true };
}
