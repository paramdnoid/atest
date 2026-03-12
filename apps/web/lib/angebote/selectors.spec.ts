import assert from 'node:assert/strict';
import test from 'node:test';

import { getQuoteRecords } from '@/lib/angebote/mock-data';
import { applyQuoteSavedView, filterQuotes, getQuoteKpis } from '@/lib/angebote/selectors';
import type { QuoteFilters } from '@/lib/angebote/types';

function baseFilters(): QuoteFilters {
  return {
    query: '',
    status: 'ALL',
    risk: 'ALL',
    owner: 'ALL',
    onlyExpiringSoon: false,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  };
}

test('selectors: saved view approval setzt Statusfilter', () => {
  const filters = applyQuoteSavedView('APPROVAL', baseFilters());
  assert.equal(filters.status, 'IN_APPROVAL');
});

test('selectors: filter reduziert Datensatzmenge ueber Query', () => {
  const records = getQuoteRecords();
  const filtered = filterQuotes(records, { ...baseFilters(), query: 'Rosenpark' });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.number, 'ANG-2026-1001');
});

test('selectors: kpis liefern positive Pipeline und sinnvolle Conversion', () => {
  const kpis = getQuoteKpis(getQuoteRecords());
  assert.equal(kpis.pipelineNet > 0, true);
  assert.equal(kpis.conversionRate >= 0, true);
  assert.equal(kpis.conversionRate <= 100, true);
});
