import assert from 'node:assert/strict';
import test from 'node:test';

import { getAufmassRecordById } from '@/lib/aufmass/mock-data';
import { canTransition, getTransitionBlockers, transitionRecordStatus } from '@/lib/aufmass/state-machine';

test('erlaubte und unerlaubte statuswechsel werden korrekt erkannt', () => {
  assert.equal(canTransition('DRAFT', 'IN_REVIEW'), true);
  assert.equal(canTransition('DRAFT', 'BILLED'), false);
});

test('wechsel nach IN_REVIEW blockiert wenn mappings fehlen', () => {
  const record = getAufmassRecordById('am-26-001');
  assert.ok(record);
  if (!record) return;
  record.status = 'DRAFT';
  record.mappings = [];

  const blockers = getTransitionBlockers(record, 'IN_REVIEW');
  assert.equal(blockers.includes('Mindestens eine Positionszuordnung ist erforderlich.'), true);
});

test('transition liefert blocker details bei fehlern', () => {
  const record = getAufmassRecordById('am-26-001');
  assert.ok(record);
  if (!record) return;
  record.status = 'IN_REVIEW';
  record.measurements[0].openingsOrNiches = [
    {
      id: 'invalid-opening',
      kind: 'OPENING',
      roomId: record.measurements[0].roomId,
      positionId: record.measurements[0].positionId,
      width: 0,
      height: 0,
      count: 0,
    },
  ];

  const result = transitionRecordStatus(record, 'APPROVED');
  assert.equal(result.ok, false);
  assert.equal(result.blockers.length > 0, true);
});
