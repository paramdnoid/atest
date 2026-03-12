import type {
  Ansprechpartner,
  AnsprechpartnerStatus,
  KundenRecord,
  KundenStatus,
  KundenObjekt,
  ObjektStatus,
} from '@/lib/kunden/types';

type Transition<TStatus extends string> = {
  from: TStatus;
  to: TStatus;
};

const kundenTransitions: Array<Transition<KundenStatus>> = [
  { from: 'LEAD', to: 'AKTIV' },
  { from: 'AKTIV', to: 'RUHEND' },
  { from: 'RUHEND', to: 'AKTIV' },
  { from: 'RUHEND', to: 'ARCHIVIERT' },
];

const objektTransitions: Array<Transition<ObjektStatus>> = [
  { from: 'PLANBAR', to: 'AKTIV' },
  { from: 'AKTIV', to: 'GESPERRT' },
  { from: 'GESPERRT', to: 'AKTIV' },
  { from: 'GESPERRT', to: 'STILLGELEGT' },
];

const kontaktTransitions: Array<Transition<AnsprechpartnerStatus>> = [
  { from: 'NEU', to: 'VALIDIERT' },
  { from: 'VALIDIERT', to: 'PRIMAER' },
  { from: 'PRIMAER', to: 'INAKTIV' },
  { from: 'VALIDIERT', to: 'INAKTIV' },
  { from: 'INAKTIV', to: 'VALIDIERT' },
];

function canTransition<TStatus extends string>(
  transitions: Array<Transition<TStatus>>,
  from: TStatus,
  to: TStatus,
): boolean {
  return transitions.some((entry) => entry.from === from && entry.to === to);
}

export function getKundenTransitionBlockers(record: KundenRecord, to: KundenStatus): string[] {
  const blockers: string[] = [];
  if (to === 'AKTIV') {
    if (record.objekte.length === 0) blockers.push('Mindestens ein Objekt ist erforderlich.');
    if (!record.ansprechpartner.some((contact) => contact.primary)) {
      blockers.push('Ein primaerer Ansprechpartner muss gesetzt sein.');
    }
  }
  if (to === 'ARCHIVIERT') {
    const hasOpenSla = record.reminders.some((reminder) => reminder.breachState !== 'ON_TRACK');
    if (hasOpenSla) blockers.push('Offene SLA-Risiken muessen vorher abgeschlossen werden.');
  }
  return blockers;
}

export function transitionKundenStatus(record: KundenRecord, to: KundenStatus): { ok: boolean; blockers: string[] } {
  if (!canTransition(kundenTransitions, record.status, to)) {
    return { ok: false, blockers: [`Statuswechsel ${record.status} -> ${to} ist nicht erlaubt.`] };
  }
  const blockers = getKundenTransitionBlockers(record, to);
  if (blockers.length > 0) return { ok: false, blockers };
  return { ok: true, blockers: [] };
}

export function getObjektTransitionBlockers(objekt: KundenObjekt, to: ObjektStatus): string[] {
  const blockers: string[] = [];
  if (to === 'AKTIV') {
    if (!objekt.adresse.trim()) blockers.push('Objektadresse ist erforderlich.');
    if (objekt.serviceIntervalDays <= 0) blockers.push('Serviceintervall muss groesser als 0 sein.');
  }
  return blockers;
}

export function transitionObjektStatus(objekt: KundenObjekt, to: ObjektStatus): { ok: boolean; blockers: string[] } {
  if (!canTransition(objektTransitions, objekt.status, to)) {
    return { ok: false, blockers: [`Statuswechsel ${objekt.status} -> ${to} ist nicht erlaubt.`] };
  }
  const blockers = getObjektTransitionBlockers(objekt, to);
  if (blockers.length > 0) return { ok: false, blockers };
  return { ok: true, blockers: [] };
}

export function getKontaktTransitionBlockers(
  kontakt: Ansprechpartner,
  contactsForCustomer: Ansprechpartner[],
  to: AnsprechpartnerStatus,
): string[] {
  const blockers: string[] = [];
  if (to === 'PRIMAER') {
    if (kontakt.dsgvoConsent !== 'ERTEILT') blockers.push('Primaerer Kontakt braucht DSGVO-Consent.');
    if (!kontakt.email.trim()) blockers.push('Primaerer Kontakt braucht E-Mail.');
  }
  if (to === 'INAKTIV' && kontakt.primary) {
    const hasSecondaryPrimary = contactsForCustomer.some((contact) => contact.id !== kontakt.id && contact.primary);
    if (!hasSecondaryPrimary) blockers.push('Mindestens ein anderer primaerer Kontakt muss vorhanden sein.');
  }
  return blockers;
}

export function transitionKontaktStatus(
  kontakt: Ansprechpartner,
  contactsForCustomer: Ansprechpartner[],
  to: AnsprechpartnerStatus,
): { ok: boolean; blockers: string[] } {
  if (!canTransition(kontaktTransitions, kontakt.status, to)) {
    return { ok: false, blockers: [`Statuswechsel ${kontakt.status} -> ${to} ist nicht erlaubt.`] };
  }
  const blockers = getKontaktTransitionBlockers(kontakt, contactsForCustomer, to);
  if (blockers.length > 0) return { ok: false, blockers };
  return { ok: true, blockers: [] };
}
