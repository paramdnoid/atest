import type { AbnahmeRecord } from '@/lib/abnahmen/types';

const records: AbnahmeRecord[] = [
  {
    id: 'abn-26-001',
    number: 'ABN-26-001',
    projectName: 'Mehrfamilienhaus Isarpark',
    customerName: 'WBG Isar Süd',
    siteName: 'München, Rosenweg 12',
    tradeLabel: 'Maler und Tapezierer',
    createdBy: 'Nina Weber',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-11T14:20:00Z',
    status: 'DEFECTS_OPEN',
    nextInspectionDate: '2026-03-16',
    isOverdue: true,
    protocol: {
      acceptanceType: 'formal',
      appointmentDate: '2026-03-05',
      inspectionDate: '2026-03-05',
      place: 'Bauteil B, 2. OG',
      participants: [
        { id: 'p-1', name: 'Nina Weber', role: 'Bauleitung', company: 'Zunftgewerk', present: true },
        { id: 'p-2', name: 'Markus Stein', role: 'Objektleiter', company: 'WBG Isar Süd', present: true },
      ],
      signoffStatus: 'prepared',
    },
    defects: [
      {
        id: 'def-1',
        ref: 'M-001',
        title: 'Deckschicht ungleichmäßig',
        description: 'Streifenbildung an Decke im Treppenhaus sichtbar.',
        category: 'surface',
        severity: 'major',
        status: 'OPEN',
        location: 'Treppenhaus Nord',
        room: '2. OG Flur',
        assignedTo: 'Kolonne 2',
        dueDate: '2026-03-12',
        createdAt: '2026-03-05T09:05:00Z',
        updatedAt: '2026-03-11T14:20:00Z',
        reopenCount: 1,
        evidence: [
          {
            id: 'e-1',
            label: 'Detailansicht Decke',
            url: '/evidence/decke-1.jpg',
            createdAt: '2026-03-05T09:05:00Z',
            createdBy: 'Nina Weber',
            hasPeople: false,
            hasLicensePlate: false,
            redacted: true,
            legalBasis: 'contract',
          },
        ],
      },
      {
        id: 'def-2',
        ref: 'M-002',
        title: 'Fehlende Schutzfolie',
        description: 'Türzarge nicht ausreichend abgeklebt.',
        category: 'protection',
        severity: 'critical',
        status: 'IN_PROGRESS',
        location: 'Wohnung 2.07',
        assignedTo: 'Kolonne 1',
        dueDate: '2026-03-13',
        createdAt: '2026-03-05T10:10:00Z',
        updatedAt: '2026-03-11T12:00:00Z',
        reopenCount: 0,
        evidence: [
          {
            id: 'e-2',
            label: 'Übersicht Türbereich',
            url: '/evidence/tuer-2.jpg',
            createdAt: '2026-03-05T10:10:00Z',
            createdBy: 'Nina Weber',
            hasPeople: true,
            hasLicensePlate: false,
            redacted: false,
            legalBasis: 'contract',
          },
        ],
      },
    ],
    rework: [
      {
        id: 'rw-1',
        defectId: 'def-2',
        status: 'IN_PROGRESS',
        owner: 'Kolonne 1',
        startedAt: '2026-03-06T06:30:00Z',
        notes: ['Nacharbeit gestartet', 'Material bestellt'],
      },
    ],
    auditTrail: [
      {
        id: 'a-1',
        actor: 'Nina Weber',
        action: 'Abnahme durchgeführt',
        detail: 'Förmliche Abnahme vor Ort protokolliert.',
        createdAt: '2026-03-05T11:00:00Z',
      },
      {
        id: 'a-2',
        actor: 'Nina Weber',
        action: 'Mangel erfasst',
        detail: 'Mangel M-002 mit Frist 13.03. dokumentiert.',
        createdAt: '2026-03-05T11:10:00Z',
      },
    ],
  },
  {
    id: 'abn-26-002',
    number: 'ABN-26-002',
    projectName: 'Büropark Südflügel',
    customerName: 'Hansa Immobilien',
    siteName: 'Augsburg, Bahnhofstraße 21',
    tradeLabel: 'Maler und Tapezierer',
    createdBy: 'Lukas Brandt',
    createdAt: '2026-03-02T09:15:00Z',
    updatedAt: '2026-03-10T15:45:00Z',
    status: 'REWORK_READY_FOR_REVIEW',
    nextInspectionDate: '2026-03-14',
    isOverdue: false,
    protocol: {
      acceptanceType: 'partial',
      appointmentDate: '2026-03-07',
      inspectionDate: '2026-03-07',
      place: 'Bürotrakt C',
      participants: [
        { id: 'p-3', name: 'Lukas Brandt', role: 'Projektleiter', company: 'Zunftgewerk', present: true },
        { id: 'p-4', name: 'Leonie Kern', role: 'FM-Vertreterin', company: 'Hansa Immobilien', present: true },
      ],
      signoffStatus: 'prepared',
    },
    defects: [
      {
        id: 'def-3',
        ref: 'M-101',
        title: 'Abplatzung an Wandkante',
        description: 'Kante in Besprechungsraum 3 beschädigt.',
        category: 'surface',
        severity: 'minor',
        status: 'READY_FOR_REVIEW',
        location: 'Besprechungsraum 3',
        assignedTo: 'Kolonne 4',
        dueDate: '2026-03-13',
        createdAt: '2026-03-07T13:00:00Z',
        updatedAt: '2026-03-10T15:45:00Z',
        reopenCount: 0,
        evidence: [
          {
            id: 'e-3',
            label: 'Nacharbeit Kante',
            url: '/evidence/kante-1.jpg',
            createdAt: '2026-03-10T15:30:00Z',
            createdBy: 'Lukas Brandt',
            hasPeople: false,
            hasLicensePlate: false,
            redacted: true,
            legalBasis: 'contract',
          },
        ],
      },
    ],
    rework: [
      {
        id: 'rw-2',
        defectId: 'def-3',
        status: 'DONE',
        owner: 'Kolonne 4',
        startedAt: '2026-03-09T07:00:00Z',
        finishedAt: '2026-03-10T15:20:00Z',
        notes: ['Schleifen und Nachspachteln erledigt'],
      },
    ],
    auditTrail: [
      {
        id: 'a-3',
        actor: 'Lukas Brandt',
        action: 'Nacharbeit dokumentiert',
        detail: 'Mangel M-101 auf bereit zur Prüfung gesetzt.',
        createdAt: '2026-03-10T15:45:00Z',
      },
    ],
  },
  {
    id: 'abn-26-003',
    number: 'ABN-26-003',
    projectName: 'Reihenhausanlage Nord',
    customerName: 'Baugruppe Nord',
    siteName: 'Freising, Tulpenstraße 4',
    tradeLabel: 'Maler und Tapezierer',
    createdBy: 'Nina Weber',
    createdAt: '2026-02-20T08:45:00Z',
    updatedAt: '2026-03-01T11:25:00Z',
    status: 'ACCEPTED_WITH_RESERVATION',
    isOverdue: false,
    protocol: {
      acceptanceType: 'formal',
      inspectionDate: '2026-02-28',
      appointmentDate: '2026-02-28',
      place: 'Haus 3',
      participants: [
        { id: 'p-5', name: 'Nina Weber', role: 'Bauleitung', company: 'Zunftgewerk', present: true },
        { id: 'p-6', name: 'Eva Lorenz', role: 'Bauherrin', company: 'Baugruppe Nord', present: true },
      ],
      reservationText: 'Restarbeiten Sockelbereich bis 05.03. vorbehalten.',
      signoffStatus: 'signed',
      signedAt: '2026-02-28T11:25:00Z',
    },
    defects: [],
    rework: [],
    auditTrail: [
      {
        id: 'a-4',
        actor: 'Eva Lorenz',
        action: 'Abnahme mit Vorbehalt',
        detail: 'Protokoll digital signiert, Restarbeiten vorbehalten.',
        createdAt: '2026-02-28T11:25:00Z',
      },
    ],
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getAbnahmenRecords(): AbnahmeRecord[] {
  return clone(records);
}

export function getAbnahmeRecordById(id: string): AbnahmeRecord | null {
  const record = records.find((entry) => entry.id === id);
  return record ? clone(record) : null;
}
