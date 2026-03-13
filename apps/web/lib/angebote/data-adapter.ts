import { apiRequest } from '@/lib/api';
import type {
  QuoteApprovalStep,
  QuoteAuditEvent,
  QuoteOptionVariant,
  QuotePosition,
  QuotePriority,
  QuoteRecord,
  QuoteStatus,
  QuoteUnit,
} from '@/lib/angebote/types';

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

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asIso(value: unknown): string {
  return asString(value, new Date().toISOString());
}

function asQuoteStatus(value: unknown): QuoteStatus {
  const status = asString(value);
  if (
    status === 'DRAFT' ||
    status === 'READY_FOR_REVIEW' ||
    status === 'IN_APPROVAL' ||
    status === 'APPROVED' ||
    status === 'SENT' ||
    status === 'CONVERTED_TO_ORDER' ||
    status === 'ARCHIVED'
  ) {
    return status;
  }
  return 'DRAFT';
}

function asPriority(value: unknown): QuotePriority {
  const priority = asString(value);
  if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH') {
    return priority;
  }
  return 'MEDIUM';
}

function asUnit(value: unknown): QuoteUnit {
  const unit = asString(value);
  if (unit === 'm2' || unit === 'm' || unit === 'stk' || unit === 'h' || unit === 'pauschal') {
    return unit;
  }
  return 'stk';
}

function mapPosition(value: unknown): QuotePosition | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    id: asString(record.id, crypto.randomUUID()),
    title: asString(record.title, 'Position'),
    description: asString(record.description) || undefined,
    unit: asUnit(record.unit),
    quantity: asNumber(record.quantity, 0),
    unitPriceNet: asNumber(record.unitPriceNet, 0),
    materialCostNet: asNumber(record.materialCostNet, 0),
    laborCostNet: asNumber(record.laborCostNet, 0),
    discountPercent: typeof record.discountPercent === 'number' ? record.discountPercent : undefined,
    optional: typeof record.optional === 'boolean' ? record.optional : undefined,
    templateKey: asString(record.templateKey) || undefined,
  };
}

function parseIncludedPositionIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((entry) => asString(entry)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapOption(value: unknown): QuoteOptionVariant | null {
  const record = asRecord(value);
  if (!record) return null;
  const tier = asString(record.tier);
  return {
    id: asString(record.id, crypto.randomUUID()),
    tier: tier === 'GOOD' || tier === 'BETTER' || tier === 'BEST' ? tier : 'GOOD',
    label: asString(record.label, 'Option'),
    description: asString(record.description, ''),
    includedPositionIds: parseIncludedPositionIds(
      record.includedPositionIds ?? record.includedPositionIdsJson,
    ),
    recommended: asBoolean(record.recommended, false) || undefined,
  };
}

function makeFallbackApprovalStep(record: QuoteRecord): QuoteApprovalStep[] {
  return [
    {
      id: `approval-${record.id}`,
      role: 'VERTRIEB',
      assignee: record.owner,
      approvedAt: record.status === 'DRAFT' ? undefined : record.updatedAt,
    },
  ];
}

function makeFallbackAudit(record: QuoteRecord): QuoteAuditEvent[] {
  return [
    {
      id: `audit-${record.id}`,
      actor: 'System',
      action: 'Datensatz geladen',
      detail: 'Angebotsdaten aus API-Zusammenfassung.',
      createdAt: record.createdAt,
    },
  ];
}

function mapSummary(value: unknown): QuoteRecord | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  if (!id) return null;
  const ownerUserId = asString(record.ownerUserId);
  const quote: QuoteRecord = {
    id,
    number: asString(record.number, `ANG-${id.slice(0, 8)}`),
    customerName: asString(record.customerName, 'Kunde'),
    projectName: asString(record.projectName, 'Projekt'),
    tradeLabel: asString(record.tradeLabel, 'Maler und Tapezierer'),
    priority: asPriority(record.priority),
    createdAt: asIso(record.createdAt),
    updatedAt: asIso(record.updatedAt),
    validUntil: asIso(record.validUntil),
    owner: ownerUserId || 'Unbekannt',
    status: asQuoteStatus(record.status),
    positions: [],
    options: [],
    selectedOptionId: asString(record.selectedOptionId) || undefined,
    approvalSteps: [],
    note: asString(record.note) || undefined,
    convertedOrderNumber: asString(record.convertedOrderNumber) || undefined,
    auditTrail: [],
  };
  quote.approvalSteps = makeFallbackApprovalStep(quote);
  quote.auditTrail = makeFallbackAudit(quote);
  return quote;
}

async function readItems(path: string): Promise<unknown[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path });
    return asArray(payload?.items);
  } catch {
    return [];
  }
}

async function enrichRecord(base: QuoteRecord): Promise<QuoteRecord> {
  const [positionsRaw, optionsRaw] = await Promise.all([
    readItems(`/v1/angebote/${base.id}/positionen`),
    readItems(`/v1/angebote/${base.id}/optionen`),
  ]);
  const positions = positionsRaw
    .map(mapPosition)
    .filter((entry): entry is QuotePosition => entry !== null);
  const options = optionsRaw.map(mapOption).filter((entry): entry is QuoteOptionVariant => entry !== null);
  return {
    ...base,
    positions,
    options,
    selectedOptionId:
      options.length > 0
        ? base.selectedOptionId && options.some((entry) => entry.id === base.selectedOptionId)
          ? base.selectedOptionId
          : options[0]?.id
        : base.selectedOptionId,
  };
}

export async function listQuoteRecords(): Promise<QuoteRecord[]> {
  try {
    const payload = await apiRequest<{ items?: unknown[] }>({ path: '/v1/angebote' });
    const base = asArray(payload?.items)
      .map(mapSummary)
      .filter((entry): entry is QuoteRecord => entry !== null);
    return Promise.all(base.map((entry) => enrichRecord(entry)));
  } catch {
    return [];
  }
}

export async function getQuoteRecord(id: string): Promise<QuoteRecord | null> {
  try {
    const payload = await apiRequest<unknown>({ path: `/v1/angebote/${id}` });
    const base = mapSummary(payload);
    if (!base) return null;
    return enrichRecord(base);
  } catch {
    return null;
  }
}
