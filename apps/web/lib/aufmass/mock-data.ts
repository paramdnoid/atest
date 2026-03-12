import type {
  AufmassAuditEvent,
  AufmassMeasurement,
  AufmassPosition,
  AufmassPositionMapping,
  AufmassRecord,
  AufmassReviewIssue,
  AufmassRoom,
} from '@/lib/aufmass/types';

const roomsBase: AufmassRoom[] = [
  { id: 'room-1', building: 'Objekt A', level: 'EG', name: 'Wohnzimmer', areaM2: 34.2 },
  { id: 'room-2', building: 'Objekt A', level: 'EG', name: 'Flur', areaM2: 11.7 },
  { id: 'room-3', building: 'Objekt A', level: '1.OG', name: 'Schlafzimmer', areaM2: 19.3 },
];

const positionsBase: AufmassPosition[] = [
  { id: 'pos-1', code: '01.01', title: 'Wandanstrich, Dispersionsfarbe', unit: 'm2' },
  { id: 'pos-2', code: '01.02', title: 'Deckenanstrich, Dispersionsfarbe', unit: 'm2' },
  { id: 'pos-3', code: '01.03', title: 'Tapezieren Glasvlies', unit: 'm2' },
  { id: 'pos-4', code: '01.04', title: 'Sockelleiste beschichten', unit: 'm' },
];

const measurementsDraft: AufmassMeasurement[] = [
  {
    id: 'm-1',
    roomId: 'room-1',
    positionId: 'pos-1',
    label: 'Wände Wohnzimmer',
    formula: '(6.20 + 5.50) * 2.70 - 4.10',
    quantity: 27.49,
    unit: 'm2',
    note: 'Fensterfläche abgezogen',
    photoCount: 2,
    actualEffortHours: 3.6,
    actualMaterialQuantity: 3.4,
    openingsOrNiches: [
      {
        id: 'op-1',
        kind: 'OPENING',
        roomId: 'room-1',
        positionId: 'pos-1',
        width: 1.2,
        height: 1.4,
        count: 2,
      },
      {
        id: 'op-2',
        kind: 'NICHE',
        roomId: 'room-1',
        positionId: 'pos-1',
        width: 0.8,
        height: 0.6,
        count: 1,
      },
    ],
    createdAt: '2026-03-10T08:10:00Z',
  },
  {
    id: 'm-2',
    roomId: 'room-1',
    positionId: 'pos-2',
    label: 'Decke Wohnzimmer',
    formula: '6.20 * 5.50',
    quantity: 34.1,
    unit: 'm2',
    actualEffortHours: 2.9,
    actualMaterialQuantity: 2.6,
    openingsOrNiches: [],
    createdAt: '2026-03-10T08:18:00Z',
  },
];

const mappingsDraft: AufmassPositionMapping[] = [
  {
    id: 'map-1',
    positionId: 'pos-1',
    roomId: 'room-1',
    mappedBy: 'Nina Weber',
    mappedAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'map-2',
    positionId: 'pos-2',
    roomId: 'room-1',
    mappedBy: 'Nina Weber',
    mappedAt: '2026-03-10T09:01:00Z',
  },
];

const reviewIssues: AufmassReviewIssue[] = [
  {
    id: 'issue-1',
    type: 'missing_mapping',
    title: 'Positionszuordnung fehlt',
    message: 'Für Raum Flur ist keine LV-Position zugeordnet.',
    severity: 'blocking',
    roomId: 'room-2',
    createdAt: '2026-03-11T12:12:00Z',
  },
  {
    id: 'issue-2',
    type: 'quantity_outlier',
    title: 'Plausibilitätswarnung',
    message: 'Menge für Tapezieren liegt 18% über Referenzwert.',
    severity: 'warning',
    positionId: 'pos-3',
    createdAt: '2026-03-11T12:15:00Z',
  },
];

const auditDraft: AufmassAuditEvent[] = [
  {
    id: 'audit-1',
    actor: 'Nina Weber',
    action: 'Aufmaß angelegt',
    detail: 'Datensatz 26-001 wurde erstellt.',
    createdAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'audit-2',
    actor: 'Tobias Maier',
    action: 'Messwerte erfasst',
    detail: 'Wohnzimmer-Wände und Decke ergänzt.',
    createdAt: '2026-03-10T08:20:00Z',
  },
];

function cloneRecord(record: AufmassRecord): AufmassRecord {
  return JSON.parse(JSON.stringify(record)) as AufmassRecord;
}

const records: AufmassRecord[] = [
  {
    id: 'am-26-001',
    number: 'AM-26-001',
    projectName: 'Sanierung Mehrfamilienhaus Isar',
    customerName: 'WBG Isar Süd',
    siteName: 'München, Rosenweg 12',
    createdBy: 'Nina Weber',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-11T12:16:00Z',
    dueDate: '2026-03-18',
    status: 'IN_REVIEW',
    version: 2,
    rooms: roomsBase,
    positions: positionsBase,
    measurements: measurementsDraft,
    mappings: mappingsDraft,
    reviewIssues,
    auditTrail: auditDraft,
  },
  {
    id: 'am-26-002',
    number: 'AM-26-002',
    projectName: 'Neubau Reihenhäuser Nord',
    customerName: 'Baugruppe Nord',
    siteName: 'Freising, Tulpenstraße 4',
    createdBy: 'Lukas Brandt',
    createdAt: '2026-03-08T10:30:00Z',
    updatedAt: '2026-03-10T15:11:00Z',
    dueDate: '2026-03-20',
    status: 'DRAFT',
    version: 1,
    rooms: roomsBase.slice(0, 2),
    positions: positionsBase,
    measurements: measurementsDraft.slice(0, 1),
    mappings: mappingsDraft.slice(0, 1),
    reviewIssues: [],
    auditTrail: auditDraft.slice(0, 1),
  },
  {
    id: 'am-26-003',
    number: 'AM-26-003',
    projectName: 'Bürokomplex Südflügel',
    customerName: 'Hansa Immobilien',
    siteName: 'Augsburg, Bahnhofstraße 21',
    createdBy: 'Nina Weber',
    createdAt: '2026-03-02T07:45:00Z',
    updatedAt: '2026-03-05T16:00:00Z',
    dueDate: '2026-03-09',
    status: 'APPROVED',
    version: 4,
    rooms: roomsBase,
    positions: positionsBase,
    measurements: measurementsDraft.map((entry) => ({
      ...entry,
      id: `${entry.id}-a`,
      actualEffortHours: entry.actualEffortHours ? Number((entry.actualEffortHours * 0.92).toFixed(2)) : undefined,
      actualMaterialQuantity: entry.actualMaterialQuantity
        ? Number((entry.actualMaterialQuantity * 0.95).toFixed(2))
        : undefined,
    })),
    mappings: mappingsDraft,
    reviewIssues: [],
    auditTrail: [
      ...auditDraft,
      {
        id: 'audit-3',
        actor: 'Laura König',
        action: 'Freigabe',
        detail: 'Aufmaß freigegeben.',
        createdAt: '2026-03-05T16:00:00Z',
      },
    ],
  },
  {
    id: 'am-26-004',
    number: 'AM-26-004',
    projectName: 'Fassadenanstrich Quartier West',
    customerName: 'Wohnbau West',
    siteName: 'Regensburg, Melissenweg 2',
    createdBy: 'Tobias Maier',
    createdAt: '2026-02-24T09:30:00Z',
    updatedAt: '2026-02-28T18:10:00Z',
    dueDate: '2026-03-01',
    status: 'BILLED',
    version: 3,
    rooms: roomsBase.slice(0, 1),
    positions: positionsBase,
    measurements: measurementsDraft.map((entry) => ({
      ...entry,
      id: `${entry.id}-b`,
      actualEffortHours: entry.actualEffortHours ? Number((entry.actualEffortHours * 1.08).toFixed(2)) : undefined,
      actualMaterialQuantity: entry.actualMaterialQuantity
        ? Number((entry.actualMaterialQuantity * 1.12).toFixed(2))
        : undefined,
    })),
    mappings: mappingsDraft,
    reviewIssues: [],
    auditTrail: [
      ...auditDraft,
      {
        id: 'audit-4',
        actor: 'Lukas Brandt',
        action: 'Abrechnung übergeben',
        detail: 'Positionssummen in Abrechnungsprozess übernommen.',
        createdAt: '2026-02-28T18:10:00Z',
      },
    ],
  },
];

export function getAufmassRecords(): AufmassRecord[] {
  return records.map(cloneRecord);
}

export function getAufmassRecordById(id: string): AufmassRecord | null {
  const record = records.find((entry) => entry.id === id);
  return record ? cloneRecord(record) : null;
}
