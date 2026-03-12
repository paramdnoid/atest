export type QuoteStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'IN_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'CONVERTED_TO_ORDER'
  | 'ARCHIVED';

export type QuotePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type QuoteOptionTier = 'GOOD' | 'BETTER' | 'BEST';

export type QuoteUnit = 'm2' | 'm' | 'stk' | 'h' | 'pauschal';

export type QuotePosition = {
  id: string;
  title: string;
  description?: string;
  unit: QuoteUnit;
  quantity: number;
  unitPriceNet: number;
  materialCostNet: number;
  laborCostNet: number;
  discountPercent?: number;
  optional?: boolean;
  templateKey?: string;
};

export type QuoteOptionVariant = {
  id: string;
  tier: QuoteOptionTier;
  label: string;
  description: string;
  includedPositionIds: string[];
  recommended?: boolean;
};

export type QuoteApprovalStep = {
  id: string;
  role: 'VERTRIEB' | 'PROJEKTLEITUNG' | 'GESCHAEFTSFUEHRUNG';
  assignee: string;
  approvedAt?: string;
  comment?: string;
};

export type QuoteAuditEvent = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type QuoteRecord = {
  id: string;
  number: string;
  customerName: string;
  projectName: string;
  tradeLabel: string;
  priority: QuotePriority;
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  owner: string;
  status: QuoteStatus;
  positions: QuotePosition[];
  options: QuoteOptionVariant[];
  selectedOptionId?: string;
  approvalSteps: QuoteApprovalStep[];
  note?: string;
  convertedOrderNumber?: string;
  auditTrail: QuoteAuditEvent[];
};

export type QuoteRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type QuoteSortKey = 'updatedAt' | 'validUntil' | 'marginPercent' | 'totalNet';

export type QuoteFilters = {
  query: string;
  status: 'ALL' | QuoteStatus;
  risk: 'ALL' | QuoteRiskLevel;
  owner: 'ALL' | string;
  onlyExpiringSoon: boolean;
  sortBy: QuoteSortKey;
  sortDirection: 'asc' | 'desc';
};

export type QuoteKpis = {
  pipelineNet: number;
  openApprovals: number;
  conversionRate: number;
  averageMarginPercent: number;
};

export type QuoteIntelligenceSignalType =
  | 'MARGIN_RISK'
  | 'MISSING_CORE_POSITION'
  | 'PRICE_OUTLIER'
  | 'UPSELL_TEMPLATE';

export type QuoteIntelligenceSignal = {
  id: string;
  type: QuoteIntelligenceSignalType;
  severity: 'info' | 'warning' | 'blocking';
  title: string;
  message: string;
};

export type QuoteSavedViewId = 'ALL_OPEN' | 'EXPIRING' | 'APPROVAL' | 'MARGIN_RISK';
