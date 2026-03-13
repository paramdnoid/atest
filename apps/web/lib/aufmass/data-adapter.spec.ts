import assert from 'node:assert/strict';
import test from 'node:test';

import { getAufmassRecord, listAufmassRecords } from '@/lib/aufmass/data-adapter';

test('listAufmassRecords liefert ein Array auch ohne API', async () => {
  const records = await listAufmassRecords();
  assert.equal(Array.isArray(records), true);
});

test('getAufmassRecord liefert null bei unbekannter id', async () => {
  const record = await getAufmassRecord('unknown-id');
  assert.equal(record, null);
});
