import { apiRequest } from '@/lib/api';
import type {
  Ansprechpartner,
  ConsentState,
  DuplicateCandidate,
  KundenActivity,
  KundenObjekt,
  KundenRecord,
  KundenReminder,
  KundenStatus,
  RetentionClass,
} from '@/lib/kunden/types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asIso(value: unknown): string {
  return asString(value, new Date().toISOString());
}

function asKundenStatus(value: unknown): KundenStatus {
  const status = asString(value);
  if (status === 'LEAD' || status === 'AKTIV' || status === 'RUHEND' || status === 'ARCHIVIERT') {
    return status;
  }
  return 'LEAD';
}

function asConsentState(value: unknown): ConsentState {
  const state = asString(value);
  if (state === 'UNBEKANNT' || state === 'ERTEILT' || state === 'WIDERRUFEN') {
    return state;
  }
  return 'UNBEKANNT';
}

function asRetentionClass(value: unknown): RetentionClass {
  const retention = asString(value);
  if (retention === 'STANDARD' || retention === 'FINANZ' || retention === 'VERTRAG' || retention === 'SENSITIV') {
    return retention;
  }
  return 'STANDARD';
}

function mapObjekt(value: unknown, kundenId: string, fallbackRegion: string): KundenObjekt | null {
  const record = asRecord(value);
  if (!record) return null;
  const objektTyp = asString(record.objektTyp);
  const status = asString(record.status);
  const riskClass = asString(record.riskClass);
  if (!objektTyp || !status || !riskClass) return null;
  return {
    id: asString(record.id, crypto.randomUUID()),
    kundenId,
    name: asString(record.name, 'Objekt'),
    objektTyp: ['Wohnanlage', 'Buero', 'Einzelhandel', 'Industrie', 'Oeffentlich'].includes(objektTyp)
      ? (objektTyp as KundenObjekt['objektTyp'])
      : 'Wohnanlage',
    adresse: asString(record.adresse, '-'),
    region: asString(record.region, fallbackRegion || '-'),
    serviceIntervalDays: asNumber(record.serviceIntervalDays, 90),
    zugangshinweise: asString(record.zugangshinweise) || undefined,
    riskClass: ['LOW', 'MEDIUM', 'HIGH'].includes(riskClass) ? (riskClass as KundenObjekt['riskClass']) : 'LOW',
    status: ['PLANBAR', 'AKTIV', 'GESPERRT', 'STILLGELEGT'].includes(status)
      ? (status as KundenObjekt['status'])
      : 'PLANBAR',
  };
}

function mapAnsprechpartner(value: unknown, kundenId: string): Ansprechpartner | null {
  const record = asRecord(value);
  if (!record) return null;
  const rolle = asString(record.rolle);
  const status = asString(record.status);
  const kanal = asString(record.bevorzugterKanal);
  return {
    id: asString(record.id, crypto.randomUUID()),
    kundenId,
    objektIds: asArray(record.objektIds).map((entry) => asString(entry)).filter(Boolean),
    name: asString(record.name, 'Ansprechpartner'),
    rolle: ['Einkauf', 'Objektleitung', 'Technik', 'Buchhaltung', 'Geschaeftsfuehrung'].includes(rolle)
      ? (rolle as Ansprechpartner['rolle'])
      : 'Einkauf',
    email: asString(record.email, '-'),
    telefon: asString(record.telefon, '-'),
    bevorzugterKanal: kanal === 'phone' || kanal === 'sms' ? kanal : 'email',
    dsgvoConsent: asConsentState(record.dsgvoConsent),
    status: ['NEU', 'VALIDIERT', 'PRIMAER', 'INAKTIV'].includes(status)
      ? (status as Ansprechpartner['status'])
      : 'NEU',
    primary: asBoolean(record.primary, asBoolean(record.isPrimary)),
    lastContactAt: asString(record.lastContactAt) || undefined,
  };
}

function mapReminder(value: unknown, kundenId: string): KundenReminder | null {
  const record = asRecord(value);
  if (!record) return null;
  const scope = asString(record.scope);
  const priority = asString(record.priority);
  const breachState = asString(record.breachState);
  if (!scope || !priority || !breachState) return null;
  return {
    id: asString(record.id, crypto.randomUUID()),
    scope: ['KUNDE', 'OBJEKT', 'ANSPRECHPARTNER'].includes(scope)
      ? (scope as KundenReminder['scope'])
      : 'KUNDE',
    targetId: asString(record.targetId, kundenId),
    title: asString(record.title, 'Reminder'),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)
      ? (priority as KundenReminder['priority'])
      : 'MEDIUM',
    startAt: asIso(record.startAt),
    dueAt: asIso(record.dueAt),
    pauseWindows: asArray(record.pauseWindows)
      .map((entry) => {
        const windowRecord = asRecord(entry);
        if (!windowRecord) return null;
        return {
          startAt: asIso(windowRecord.startAt),
          endAt: asIso(windowRecord.endAt),
        };
      })
      .filter((entry): entry is { startAt: string; endAt: string } => entry !== null),
    breachState: ['ON_TRACK', 'AT_RISK', 'BREACHED'].includes(breachState)
      ? (breachState as KundenReminder['breachState'])
      : 'ON_TRACK',
  };
}

function buildFallbackActivity(kunde: { id: string; createdAt: string }): KundenActivity[] {
  return [
    {
      id: `activity-${kunde.id}`,
      entityType: 'KUNDE',
      entityId: kunde.id,
      type: 'NOTE',
      title: 'Datensatz geladen',
      payload: 'Import aus API-Zusammenfassung.',
      createdBy: 'System',
      createdAt: kunde.createdAt,
      visibility: 'internal',
    },
  ];
}

function mapSummaryToRecord(value: unknown): KundenRecord | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  if (!id) return null;
  const ownerUserId = asString(record.ownerUserId);
  const region = asString(record.region, '-');
  const createdAt = asIso(record.createdAt);
  const kunden: KundenRecord = {
    id,
    number: asString(record.number, `KUNDE-${id.slice(0, 8)}`),
    name: asString(record.name, 'Unbenannter Kunde'),
    branche: ['Wohnungswirtschaft', 'Industrie', 'Gewerbe', 'Kommunal'].includes(asString(record.branche))
      ? (record.branche as KundenRecord['branche'])
      : 'Gewerbe',
    segment: ['A', 'B', 'C'].includes(asString(record.segment))
      ? (record.segment as KundenRecord['segment'])
      : 'C',
    status: asKundenStatus(record.status),
    owner: ownerUserId || 'Unbekannt',
    score: asNumber(record.score, 0),
    consentState: asConsentState(record.consentState),
    retentionClass: asRetentionClass(record.retentionClass),
    region,
    nextFollowUpAt: asString(record.nextFollowUpAt) || undefined,
    createdAt,
    updatedAt: asIso(record.updatedAt),
    objekte: [],
    ansprechpartner: [],
    reminders: [],
    activities: buildFallbackActivity({ id, createdAt }),
    duplicateCandidates: [] as DuplicateCandidate[],
  };
  return kunden;
}

async function readItems(path: string): Promise<unknown[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path });
    return asArray(payload?.items);
  } catch {
    return [];
  }
}

async function enrichKunde(base: KundenRecord): Promise<KundenRecord> {
  const [objekteRaw, ansprechpartnerRaw, reminderRaw] = await Promise.all([
    readItems(`/v1/kunden/${base.id}/objekte`),
    readItems(`/v1/kunden/${base.id}/ansprechpartner`),
    readItems(`/v1/kunden/${base.id}/reminder`),
  ]);
  return {
    ...base,
    objekte: objekteRaw
      .map((entry) => mapObjekt(entry, base.id, base.region))
      .filter((entry): entry is KundenObjekt => entry !== null),
    ansprechpartner: ansprechpartnerRaw
      .map((entry) => mapAnsprechpartner(entry, base.id))
      .filter((entry): entry is Ansprechpartner => entry !== null),
    reminders: reminderRaw
      .map((entry) => mapReminder(entry, base.id))
      .filter((entry): entry is KundenReminder => entry !== null),
  };
}

export async function listKundenRecords(): Promise<KundenRecord[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path: '/v1/kunden' });
    const base = asArray(payload?.items)
      .map(mapSummaryToRecord)
      .filter((entry): entry is KundenRecord => entry !== null);
    return Promise.all(base.map((entry) => enrichKunde(entry)));
  } catch {
    return [];
  }
}

export async function getKundenRecord(id: string): Promise<KundenRecord | null> {
  try {
    const payload = await apiRequest<unknown>({ path: `/v1/kunden/${id}` });
    const base = mapSummaryToRecord(payload);
    if (!base) return null;
    return enrichKunde(base);
  } catch {
    return null;
  }
}
