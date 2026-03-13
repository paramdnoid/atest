import { apiRequest } from '@/lib/api';
import type {
  AbnahmeAuditEvent,
  AbnahmeParticipant,
  AbnahmeProtocol,
  AbnahmeRecord,
  AbnahmeStatus,
  DefectEntry,
  LegalBasis,
  PhotoEvidence,
  ReworkEntry,
  ReworkStatus,
} from '@/lib/abnahmen/types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asIso(value: unknown): string {
  return asString(value, new Date().toISOString());
}

function asStatus(value: unknown): AbnahmeStatus {
  const status = asString(value);
  if (
    status === 'PREPARATION' ||
    status === 'INSPECTION_SCHEDULED' ||
    status === 'INSPECTION_DONE' ||
    status === 'DEFECTS_OPEN' ||
    status === 'REWORK_IN_PROGRESS' ||
    status === 'REWORK_READY_FOR_REVIEW' ||
    status === 'ACCEPTED_WITH_RESERVATION' ||
    status === 'ACCEPTED' ||
    status === 'CLOSED'
  ) {
    return status;
  }
  return 'PREPARATION';
}

function asLegalBasis(value: unknown): LegalBasis | undefined {
  const basis = asString(value);
  if (
    basis === 'contract' ||
    basis === 'legal_obligation' ||
    basis === 'legitimate_interest' ||
    basis === 'consent'
  ) {
    return basis;
  }
  return undefined;
}

function mapParticipant(value: unknown): AbnahmeParticipant | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    id: asString(record.id, crypto.randomUUID()),
    name: asString(record.name, 'Teilnehmer'),
    role: asString(record.roleLabel ?? record.role, 'Rolle'),
    company: asString(record.company) || undefined,
    present: asBoolean(record.present, true),
  };
}

function mapEvidence(value: unknown): PhotoEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    id: asString(record.id, crypto.randomUUID()),
    label: asString(record.label, 'Beleg'),
    url: asString(record.url, ''),
    createdAt: asIso(record.createdAt),
    createdBy: asString(record.createdBy, 'System'),
    hasPeople: asBoolean(record.hasPeople, false),
    hasLicensePlate: asBoolean(record.hasLicensePlate, false),
    redacted: asBoolean(record.redacted, true),
    legalBasis: asLegalBasis(record.legalBasis),
    geo:
      typeof record.geoLat === 'number' && typeof record.geoLng === 'number'
        ? { lat: record.geoLat, lng: record.geoLng }
        : undefined,
  };
}

function mapDefect(value: unknown): DefectEntry | null {
  const record = asRecord(value);
  if (!record) return null;
  const severity = asString(record.severity);
  const category = asString(record.category);
  const status = asString(record.status);
  return {
    id: asString(record.id, crypto.randomUUID()),
    ref: asString(record.ref, 'M-000'),
    title: asString(record.title, 'Mangel'),
    description: asString(record.description, ''),
    category: ['surface', 'protection', 'cleanliness', 'dimension', 'documentation', 'safety'].includes(category)
      ? (category as DefectEntry['category'])
      : 'surface',
    severity: ['minor', 'major', 'critical'].includes(severity)
      ? (severity as DefectEntry['severity'])
      : 'minor',
    status: ['OPEN', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'RESOLVED', 'REJECTED'].includes(status)
      ? (status as DefectEntry['status'])
      : 'OPEN',
    location: asString(record.locationText ?? record.location, '-'),
    room: asString(record.roomLabel ?? record.room) || undefined,
    assignedTo: asString(record.assignedTo) || undefined,
    dueDate: asString(record.dueDate) || undefined,
    createdAt: asIso(record.createdAt),
    updatedAt: asIso(record.updatedAt),
    evidence: asArray(record.evidence)
      .map(mapEvidence)
      .filter((entry): entry is PhotoEvidence => entry !== null),
    reopenCount: asNumber(record.reopenCount, 0),
    resolutionNote: asString(record.resolutionNote) || undefined,
  };
}

function mapRework(value: unknown): ReworkEntry | null {
  const record = asRecord(value);
  if (!record) return null;
  const status = asString(record.status);
  const normalizedStatus: ReworkStatus =
    status === 'OPEN' || status === 'IN_PROGRESS' || status === 'DONE' || status === 'APPROVED' || status === 'REOPENED'
      ? status
      : 'OPEN';
  return {
    id: asString(record.id, crypto.randomUUID()),
    defectId: asString(record.defectId, ''),
    status: normalizedStatus,
    owner: asString(record.owner, 'Unbekannt'),
    startedAt: asString(record.startedAt) || undefined,
    finishedAt: asString(record.finishedAt) || undefined,
    approvedAt: asString(record.approvedAt) || undefined,
    notes: typeof record.notesJson === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(record.notesJson);
            return Array.isArray(parsed) ? parsed.map((entry) => asString(entry)).filter(Boolean) : [];
          } catch {
            return [];
          }
        })()
      : asArray(record.notes).map((entry) => asString(entry)).filter(Boolean),
  };
}

function mapProtocol(value: unknown): AbnahmeProtocol {
  const record = asRecord(value);
  if (!record) {
    return {
      acceptanceType: 'formal',
      participants: [],
      signoffStatus: 'unsigned',
    };
  }
  const acceptanceType = asString(record.acceptanceType);
  const signoffStatus = asString(record.signoffStatus);
  return {
    acceptanceType:
      acceptanceType === 'formal' || acceptanceType === 'partial' || acceptanceType === 'functional'
        ? acceptanceType
        : 'formal',
    inspectionDate: asString(record.inspectionDate) || undefined,
    appointmentDate: asString(record.appointmentDate) || undefined,
    place: asString(record.place) || undefined,
    participants: asArray(record.participants)
      .map(mapParticipant)
      .filter((entry): entry is AbnahmeParticipant => entry !== null),
    reservationText: asString(record.reservationText) || undefined,
    signoffStatus:
      signoffStatus === 'unsigned' || signoffStatus === 'prepared' || signoffStatus === 'signed'
        ? signoffStatus
        : 'unsigned',
    signedAt: asString(record.signedAt) || undefined,
  };
}

function mapSummary(value: unknown): AbnahmeRecord | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  if (!id) return null;
  const createdAt = asIso(record.createdAt);
  const base: AbnahmeRecord = {
    id,
    number: asString(record.number, `ABN-${id.slice(0, 8)}`),
    projectName: asString(record.projectName, 'Projekt'),
    customerName: asString(record.customerName, 'Kunde'),
    siteName: asString(record.siteName, '-'),
    tradeLabel: asString(record.tradeLabel, 'Maler und Tapezierer'),
    createdBy: asString(record.createdBy, 'System'),
    createdAt,
    updatedAt: asIso(record.updatedAt),
    status: asStatus(record.status),
    protocol: {
      acceptanceType: 'formal',
      participants: [],
      signoffStatus: 'unsigned',
    },
    defects: [],
    rework: [],
    nextInspectionDate: asString(record.nextInspectionDate) || undefined,
    isOverdue: asBoolean(record.isOverdue, false),
    auditTrail: [
      {
        id: `audit-${id}`,
        actor: 'System',
        action: 'Datensatz geladen',
        detail: 'Abnahme aus API-Zusammenfassung.',
        createdAt,
      },
    ] as AbnahmeAuditEvent[],
  };
  return base;
}

async function readItem(path: string): Promise<unknown | null> {
  try {
    const payload = await apiRequest<{ item?: unknown }>({ path });
    return payload?.item ?? null;
  } catch {
    return null;
  }
}

async function readItems(path: string): Promise<unknown[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path });
    return asArray(payload?.items);
  } catch {
    return [];
  }
}

async function enrichRecord(base: AbnahmeRecord): Promise<AbnahmeRecord> {
  const [protocolRaw, participantsRaw, defectsRaw, reworkRaw, evidenceRaw] = await Promise.all([
    readItem(`/v1/abnahmen/${base.id}/protocol`),
    readItems(`/v1/abnahmen/${base.id}/participant`),
    readItems(`/v1/abnahmen/${base.id}/defect`),
    readItems(`/v1/abnahmen/${base.id}/rework`),
    readItems(`/v1/abnahmen/${base.id}/evidence`),
  ]);

  const participants = participantsRaw
    .map(mapParticipant)
    .filter((entry): entry is AbnahmeParticipant => entry !== null);
  const protocol = mapProtocol(protocolRaw);
  if (participants.length > 0) {
    protocol.participants = participants;
  }

  const groupedEvidence = new Map<string, PhotoEvidence[]>();
  for (const entry of evidenceRaw) {
    const evidenceRecord = mapEvidence(entry);
    const source = asRecord(entry);
    const defectId = source ? asString(source.defectId) : '';
    if (!evidenceRecord || !defectId) continue;
    const existing = groupedEvidence.get(defectId) ?? [];
    existing.push(evidenceRecord);
    groupedEvidence.set(defectId, existing);
  }

  const defects = defectsRaw
    .map(mapDefect)
    .filter((entry): entry is DefectEntry => entry !== null)
    .map((entry) => ({
      ...entry,
      evidence: entry.evidence.length > 0 ? entry.evidence : groupedEvidence.get(entry.id) ?? [],
    }));

  const rework = reworkRaw.map(mapRework).filter((entry): entry is ReworkEntry => entry !== null);

  return {
    ...base,
    protocol,
    defects,
    rework,
  };
}

export async function listAbnahmeRecords(): Promise<AbnahmeRecord[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path: '/v1/abnahmen' });
    const base = asArray(payload?.items)
      .map(mapSummary)
      .filter((entry): entry is AbnahmeRecord => entry !== null);
    return Promise.all(base.map((entry) => enrichRecord(entry)));
  } catch {
    return [];
  }
}

export async function getAbnahmeRecord(id: string): Promise<AbnahmeRecord | null> {
  try {
    const payload = await apiRequest<unknown>({ path: `/v1/abnahmen/${id}` });
    const base = mapSummary(payload);
    if (!base) return null;
    return enrichRecord(base);
  } catch {
    return null;
  }
}
