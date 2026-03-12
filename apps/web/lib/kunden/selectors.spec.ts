import assert from 'node:assert/strict';
import test from 'node:test';

import { getKundenRecords } from '@/lib/kunden/mock-data';
import { applyKundenSavedView, filterKunden, getKundenKpis } from '@/lib/kunden/selectors';
import type { KundenFilters } from '@/lib/kunden/types';

function baseFilters(): KundenFilters {
  return {
    query: '',
    status: 'ALL',
    branche: 'ALL',
    region: 'ALL',
    owner: 'ALL',
    onlySlaRisk: false,
    onlyConsentMissing: false,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  };
}

test('selectors: saved view SLA setzt nurSlaRisk', () => {
  const view = applyKundenSavedView('SLA_RISIKO', baseFilters());
  assert.equal(view.onlySlaRisk, true);
  assert.equal(view.sortBy, 'nextFollowUpAt');
});

test('selectors: saved view FOLLOWUP setzt sortierung auf follow-up datum', () => {
  const view = applyKundenSavedView('FOLLOWUP_DIESE_WOCHE', {
    ...baseFilters(),
    onlySlaRisk: true,
    onlyConsentMissing: true,
  });
  assert.equal(view.sortBy, 'nextFollowUpAt');
  assert.equal(view.onlySlaRisk, false);
  assert.equal(view.onlyConsentMissing, false);
});

test('selectors: query filtert nach kundenname', () => {
  const filtered = filterKunden(getKundenRecords(), { ...baseFilters(), query: 'Wohnpark' });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, 'k-1001');
});

test('selectors: kpis liefern konsistente werte', () => {
  const kpis = getKundenKpis(getKundenRecords());
  assert.equal(kpis.aktiveKunden > 0, true);
  assert.equal(kpis.offeneFollowUps > 0, true);
  assert.equal(kpis.duplikatVerdacht >= 0, true);
});
