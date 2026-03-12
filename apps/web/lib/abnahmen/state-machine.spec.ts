import assert from 'node:assert/strict';
import test from 'node:test';

import { getAbnahmeRecordById } from '@/lib/abnahmen/mock-data';
import { canTransition, getAllowedTransitions, transitionRecordStatus } from '@/lib/abnahmen/state-machine';

test('erlaubte transitions enthalten den erwarteten workflow', () => {
  const transitions = getAllowedTransitions('INSPECTION_DONE');
  assert.deepEqual(transitions.sort(), ['ACCEPTED', 'DEFECTS_OPEN']);
});

test('nicht erlaubter statuswechsel wird blockiert', () => {
  assert.equal(canTransition('PREPARATION', 'CLOSED'), false);
});

test('accept wird bei kritischen mängeln blockiert', () => {
  const record = getAbnahmeRecordById('abn-26-001');
  assert.ok(record);
  record.status = 'REWORK_READY_FOR_REVIEW';

  const result = transitionRecordStatus(record, 'ACCEPTED');
  assert.equal(result.ok, false);
  assert.ok(result.blockers.some((entry) => entry.includes('Kritische Mängel')));
});
