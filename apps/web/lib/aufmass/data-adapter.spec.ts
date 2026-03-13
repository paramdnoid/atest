import assert from 'node:assert/strict';
import test from 'node:test';

import { getAufmassRecord, listAufmassRecords } from '@/lib/aufmass/data-adapter';

test('listAufmassRecords liefert records in mock mode', async () => {
  const records = await listAufmassRecords();
  assert.equal(records.length > 0, true);
  assert.equal(records[0].id.length > 0, true);
});

test('getAufmassRecord liefert null bei unbekannter id', async () => {
  const record = await getAufmassRecord('unknown-id');
  assert.equal(record, null);
});
