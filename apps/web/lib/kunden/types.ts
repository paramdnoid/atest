export type KundenStatus = 'LEAD' | 'AKTIV' | 'RUHEND' | 'ARCHIVIERT';

export type ObjektStatus = 'PLANBAR' | 'AKTIV' | 'GESPERRT' | 'STILLGELEGT';

export type AnsprechpartnerStatus = 'NEU' | 'VALIDIERT' | 'PRIMAER' | 'INAKTIV';

export type KundenRolle = 'owner' | 'admin' | 'dispo' | 'tech';

export type ConsentState = 'UNBEKANNT' | 'ERTEILT' | 'WIDERRUFEN';

export type RetentionClass = 'STANDARD' | 'FINANZ' | 'VERTRAG' | 'SENSITIV';

export type SlaPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SlaBreachState = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export type KundenActivityType =
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'FOLLOW_UP'
  | 'CONSENT_UPDATED'
  | 'SLA_UPDATED'
  | 'DUPLICATE_REVIEWED'
  | 'OFFLINE_SYNC';

export type KundenObjekt = {
  id: string;
  kundenId: string;
  name: string;
  objektTyp: 'Wohnanlage' | 'Buero' | 'Einzelhandel' | 'Industrie' | 'Oeffentlich';
  adresse: string;
  region: string;
  serviceIntervalDays: number;
  zugangshinweise?: string;
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  status: ObjektStatus;
};

export type Ansprechpartner = {
  id: string;
  kundenId: string;
  objektIds: string[];
  name: string;
  rolle: 'Einkauf' | 'Objektleitung' | 'Technik' | 'Buchhaltung' | 'Geschaeftsfuehrung';
  email: string;
  telefon: string;
  bevorzugterKanal: 'email' | 'phone' | 'sms';
  dsgvoConsent: ConsentState;
  status: AnsprechpartnerStatus;
  primary: boolean;
  lastContactAt?: string;
};

export type KundenActivity = {
  id: string;
  entityType: 'KUNDE' | 'OBJEKT' | 'ANSPRECHPARTNER' | 'SYSTEM';
  entityId: string;
  type: KundenActivityType;
  title: string;
  payload?: string;
  createdBy: string;
  createdAt: string;
  visibility: 'internal' | 'restricted';
};

export type KundenReminder = {
  id: string;
  scope: 'KUNDE' | 'OBJEKT' | 'ANSPRECHPARTNER';
  targetId: string;
  title: string;
  priority: SlaPriority;
  startAt: string;
  dueAt: string;
  pauseWindows: Array<{ startAt: string; endAt: string }>;
  breachState: SlaBreachState;
};

export type DuplicateCandidate = {
  id: string;
  leftEntityId: string;
  rightEntityId: string;
  score: number;
  reasons: string[];
  resolution: 'OPEN' | 'MERGED' | 'DISMISSED';
};

export type KundenRecord = {
  id: string;
  number: string;
  name: string;
  branche: 'Wohnungswirtschaft' | 'Industrie' | 'Gewerbe' | 'Kommunal';
  segment: 'A' | 'B' | 'C';
  status: KundenStatus;
  owner: string;
  score: number;
  consentState: ConsentState;
  retentionClass: RetentionClass;
  region: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
  objekte: KundenObjekt[];
  ansprechpartner: Ansprechpartner[];
  reminders: KundenReminder[];
  activities: KundenActivity[];
  duplicateCandidates: DuplicateCandidate[];
};

export type KundenSortKey = 'updatedAt' | 'name' | 'score' | 'nextFollowUpAt';

export type KundenFilters = {
  query: string;
  status: 'ALL' | KundenStatus;
  branche: 'ALL' | KundenRecord['branche'];
  region: 'ALL' | string;
  owner: 'ALL' | string;
  onlySlaRisk: boolean;
  onlyConsentMissing: boolean;
  sortBy: KundenSortKey;
  sortDirection: 'asc' | 'desc';
};

export type KundenSavedViewId =
  | 'ALLE_AKTIVEN'
  | 'SLA_RISIKO'
  | 'CONSENT_OFFEN'
  | 'FOLLOWUP_DIESE_WOCHE';

export type KundenKpis = {
  aktiveKunden: number;
  objekteMitSlaRisiko: number;
  offeneFollowUps: number;
  duplikatVerdacht: number;
};

export type KundenIntelligenceSignal = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
};

export type OfflineQueueItem = {
  id: string;
  operation: 'UPDATE_KUNDE' | 'UPDATE_OBJEKT' | 'UPDATE_ANSPRECHPARTNER' | 'MERGE_DUPLICATE';
  targetId: string;
  createdAt: string;
  payloadSummary: string;
  isCritical: boolean;
};
