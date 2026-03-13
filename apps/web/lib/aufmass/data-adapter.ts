import { apiRequest } from '@/lib/api';
import type { FormulaAst } from '@/lib/aufmass/types';
import type { AufmassRecord } from '@/lib/aufmass/types';

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

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asIso(value: unknown): string {
  return asString(value, new Date().toISOString());
}

function asStatus(value: unknown): AufmassRecord['status'] {
  const status = asString(value);
  if (status === 'DRAFT' || status === 'IN_REVIEW' || status === 'APPROVED' || status === 'BILLED') {
    return status;
  }
  return 'DRAFT';
}

function asFormulaSource(value: unknown): AufmassRecord['measurements'][number]['formulaSource'] {
  const source = asString(value);
  if (source === 'builder' || source === 'migrated' || source === 'legacy') {
    return source;
  }
  return undefined;
}

function asFormulaMigrationStatus(
  value: unknown,
): AufmassRecord['measurements'][number]['formulaMigrationStatus'] {
  const status = asString(value);
  if (status === 'migrated_confident' || status === 'migrated_partial' || status === 'legacy_unparsed') {
    return status;
  }
  return undefined;
}

function parseFormulaAst(value: unknown): FormulaAst | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') {
    return value as FormulaAst;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? (parsed as FormulaAst) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function mapSummary(value: unknown): AufmassRecord | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  if (!id) return null;
  const createdAt = asIso(record.createdAt);
  return {
    id,
    number: asString(record.number, `AM-${id.slice(0, 8)}`),
    projectName: asString(record.projectName, 'Projekt'),
    customerName: asString(record.customerName, 'Kunde'),
    siteName: asString(record.siteName, '-'),
    createdBy: asString(record.createdBy, 'System'),
    createdAt,
    updatedAt: asIso(record.updatedAt),
    dueDate: asString(record.dueDate) || undefined,
    status: asStatus(record.status),
    version: Math.max(1, asNumber(record.version, 1)),
    revisionOfId: asString(record.revisionOfId) || undefined,
    rooms: [],
    positions: [],
    measurements: [],
    mappings: [],
    reviewIssues: [],
    auditTrail: [
      {
        id: `audit-${id}`,
        actor: 'System',
        action: 'Datensatz geladen',
        detail: 'Aufmass aus API-Zusammenfassung.',
        createdAt,
      },
    ],
  };
}

async function readItems(path: string): Promise<unknown[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path });
    return asArray(payload?.items);
  } catch {
    return [];
  }
}

async function enrichRecord(base: AufmassRecord): Promise<AufmassRecord> {
  const [roomsRaw, positionsRaw, measurementsRaw, mappingsRaw] = await Promise.all([
    readItems(`/v1/aufmass/${base.id}/room`),
    readItems(`/v1/aufmass/${base.id}/position`),
    readItems(`/v1/aufmass/${base.id}/measurement`),
    readItems(`/v1/aufmass/${base.id}/mapping`),
  ]);

  const rooms: AufmassRecord['rooms'] = [];
  for (const value of roomsRaw) {
    const record = asRecord(value);
    if (!record) continue;
    rooms.push({
      id: asString(record.id, crypto.randomUUID()),
      building: asString(record.building, 'Objekt'),
      level: asString(record.levelLabel ?? record.level, '-'),
      name: asString(record.name, 'Raum'),
      areaM2: typeof record.areaM2 === 'number' ? record.areaM2 : undefined,
    });
  }

  const positions: AufmassRecord['positions'] = [];
  for (const value of positionsRaw) {
    const record = asRecord(value);
    if (!record) continue;
    const unit = asString(record.unit);
    positions.push({
      id: asString(record.id, crypto.randomUUID()),
      code: asString(record.code, '00.00'),
      title: asString(record.title, 'Position'),
      unit: unit === 'm2' || unit === 'm' || unit === 'stk' ? unit : 'stk',
    });
  }

  const measurements: AufmassRecord['measurements'] = [];
  for (const value of measurementsRaw) {
    const record = asRecord(value);
    if (!record) continue;
    const unit = asString(record.unit);
    measurements.push({
      id: asString(record.id, crypto.randomUUID()),
      roomId: asString(record.roomId, ''),
      positionId: asString(record.positionId, ''),
      label: asString(record.label, 'Messwert'),
      formula: asString(record.formula, ''),
      formulaAst: parseFormulaAst(record.formulaAstJson ?? record.formulaAst),
      formulaSource: asFormulaSource(record.formulaSource),
      formulaMigrationStatus: asFormulaMigrationStatus(record.formulaMigrationStatus),
      quantity: asNumber(record.quantity, 0),
      unit: unit === 'm2' || unit === 'm' || unit === 'stk' ? unit : 'stk',
      note: asString(record.note) || undefined,
      photoCount: typeof record.photoCount === 'number' ? record.photoCount : undefined,
      createdAt: asIso(record.createdAt),
    });
  }

  const mappings: AufmassRecord['mappings'] = [];
  for (const value of mappingsRaw) {
    const record = asRecord(value);
    if (!record) continue;
    mappings.push({
      id: asString(record.id, crypto.randomUUID()),
      positionId: asString(record.positionId, ''),
      roomId: asString(record.roomId, ''),
      mappedBy: asString(record.mappedBy, 'System'),
      mappedAt: asIso(record.mappedAt),
    });
  }

  return {
    ...base,
    rooms,
    positions,
    measurements,
    mappings,
  };
}

export async function listAufmassRecords(): Promise<AufmassRecord[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path: '/v1/aufmass' });
    const base = asArray(payload?.items)
      .map(mapSummary)
      .filter((entry): entry is AufmassRecord => entry !== null);
    return Promise.all(base.map((entry) => enrichRecord(entry)));
  } catch {
    return [];
  }
}

export async function getAufmassRecord(id: string): Promise<AufmassRecord | null> {
  try {
    const payload = await apiRequest<unknown>({ path: `/v1/aufmass/${id}` });
    const base = mapSummary(payload);
    if (!base) return null;
    return enrichRecord(base);
  } catch {
    return null;
  }
}
