export type AbnahmeStatus =
  | 'PREPARATION'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_DONE'
  | 'DEFECTS_OPEN'
  | 'REWORK_IN_PROGRESS'
  | 'REWORK_READY_FOR_REVIEW'
  | 'ACCEPTED_WITH_RESERVATION'
  | 'ACCEPTED'
  | 'CLOSED';

export type DefectSeverity = 'minor' | 'major' | 'critical';
export type DefectCategory =
  | 'surface'
  | 'protection'
  | 'cleanliness'
  | 'dimension'
  | 'documentation'
  | 'safety';
export type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'RESOLVED' | 'REJECTED';
export type ReworkStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'APPROVED' | 'REOPENED';
export type SignoffStatus = 'unsigned' | 'prepared' | 'signed';
export type LegalBasis = 'contract' | 'legal_obligation' | 'legitimate_interest' | 'consent';

export type AbnahmeParticipant = {
  id: string;
  name: string;
  role: string;
  company?: string;
  present: boolean;
};

export type PhotoEvidence = {
  id: string;
  label: string;
  url: string;
  createdAt: string;
  createdBy: string;
  hasPeople: boolean;
  hasLicensePlate: boolean;
  redacted: boolean;
  legalBasis?: LegalBasis;
  geo?: { lat: number; lng: number };
};

export type DefectEntry = {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: DefectCategory;
  severity: DefectSeverity;
  status: DefectStatus;
  location: string;
  room?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  evidence: PhotoEvidence[];
  reopenCount: number;
  resolutionNote?: string;
};

export type ReworkEntry = {
  id: string;
  defectId: string;
  status: ReworkStatus;
  owner: string;
  startedAt?: string;
  finishedAt?: string;
  approvedAt?: string;
  notes: string[];
};

export type AbnahmeProtocol = {
  acceptanceType: 'formal' | 'partial' | 'functional';
  inspectionDate?: string;
  appointmentDate?: string;
  place?: string;
  participants: AbnahmeParticipant[];
  reservationText?: string;
  signoffStatus: SignoffStatus;
  signedAt?: string;
};

export type AbnahmeAuditEvent = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type AbnahmeRecord = {
  id: string;
  number: string;
  projectName: string;
  customerName: string;
  siteName: string;
  tradeLabel: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: AbnahmeStatus;
  protocol: AbnahmeProtocol;
  defects: DefectEntry[];
  rework: ReworkEntry[];
  nextInspectionDate?: string;
  isOverdue: boolean;
  auditTrail: AbnahmeAuditEvent[];
};

export type AbnahmenFilters = {
  query: string;
  status: 'ALL' | AbnahmeStatus;
  onlyCritical: boolean;
  onlyOverdue: boolean;
};
