import assert from 'node:assert/strict';
import test from 'node:test';

import { getAbnahmeRecordById } from '@/lib/abnahmen/mock-data';
import { getProtocolComplianceResults, getTransitionComplianceBlockers } from '@/lib/abnahmen/compliance-rules';

test('protocol compliance erkennt fehlende pflichtfelder', () => {
  const record = getAbnahmeRecordById('abn-26-001');
  assert.ok(record);

  const brokenRecord = {
    ...record,
    protocol: { ...record.protocol, inspectionDate: undefined, place: undefined, participants: [] },
  };

  const results = getProtocolComplianceResults(brokenRecord);
  assert.ok(results.some((entry) => entry.code === 'protocol_inspection_date_missing'));
  assert.ok(results.some((entry) => entry.code === 'protocol_place_missing'));
});

test('close erfordert signiertes protokoll', () => {
  const record = getAbnahmeRecordById('abn-26-003');
  assert.ok(record);

  const unsignedRecord = {
    ...record,
    protocol: { ...record.protocol, signoffStatus: 'prepared' as const },
  };

  const blockers = getTransitionComplianceBlockers(unsignedRecord, 'CLOSED');
  assert.ok(blockers.some((entry) => entry.includes('signiertes Protokoll')));
});
