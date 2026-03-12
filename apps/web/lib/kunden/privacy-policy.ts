import type { Ansprechpartner, KundenRecord, KundenRolle } from '@/lib/kunden/types';

const retentionDaysByClass = {
  STANDARD: 365 * 2,
  FINANZ: 365 * 10,
  VERTRAG: 365 * 6,
  SENSITIV: 365,
} as const;

export function getRetentionDays(record: KundenRecord): number {
  return retentionDaysByClass[record.retentionClass];
}

export function getRetentionDeadline(record: KundenRecord): string {
  const createdAt = new Date(record.createdAt);
  const deadline = new Date(createdAt.getTime() + getRetentionDays(record) * 24 * 60 * 60 * 1000);
  return deadline.toISOString();
}

export function canViewSensitiveContactData(role: KundenRolle): boolean {
  return role === 'owner' || role === 'admin' || role === 'dispo';
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export function getContactDisplay(contact: Ansprechpartner, role: KundenRolle): Ansprechpartner {
  if (canViewSensitiveContactData(role)) return contact;
  return {
    ...contact,
    email: maskEmail(contact.email),
    telefon: maskPhone(contact.telefon),
  };
}

export function getConsentBlockers(record: KundenRecord): string[] {
  const blockers: string[] = [];
  if (record.consentState !== 'ERTEILT') {
    blockers.push('Kundenweiter Consent ist nicht erteilt.');
  }
  if (record.ansprechpartner.some((contact) => contact.dsgvoConsent !== 'ERTEILT' && contact.primary)) {
    blockers.push('Primaerer Ansprechpartner ohne DSGVO-Consent.');
  }
  return blockers;
}
