import assert from 'node:assert/strict';
import test from 'node:test';

import { getKundenRecordById } from '@/lib/kunden/mock-data';
import { canViewSensitiveContactData, getConsentBlockers, getContactDisplay } from '@/lib/kunden/privacy-policy';

test('privacy: admin darf sensitive daten sehen', () => {
  assert.equal(canViewSensitiveContactData('admin'), true);
  assert.equal(canViewSensitiveContactData('tech'), false);
});

test('privacy: masking fuer tech greift', () => {
  const record = getKundenRecordById('k-1001');
  assert.ok(record);
  const contact = record.ansprechpartner[0];
  assert.ok(contact);
  const masked = getContactDisplay(contact, 'tech');
  assert.equal(masked.email.includes('***'), true);
});

test('privacy: consent blocker fuer offenen datensatz', () => {
  const record = getKundenRecordById('k-1002');
  assert.ok(record);
  const blockers = getConsentBlockers(record);
  assert.equal(blockers.length > 0, true);
});
