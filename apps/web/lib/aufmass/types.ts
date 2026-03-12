export type AufmassStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'BILLED';

export type AufmassUnit = 'm2' | 'm' | 'stk';
export type FormulaVariableKey = 'length' | 'width' | 'height' | 'openings' | 'factor' | 'count';
export type FormulaBinaryOperator = 'add' | 'sub' | 'mul' | 'div';
export type FormulaSource = 'builder' | 'migrated' | 'legacy';
export type FormulaTemplateId = 'wall_area' | 'ceiling_area' | 'linear_length' | 'piece_count';
export type FormulaMigrationStatus = 'migrated_confident' | 'migrated_partial' | 'legacy_unparsed';

export type FormulaNode =
  | { kind: 'number'; value: number }
  | { kind: 'variable'; key: FormulaVariableKey }
  | { kind: 'binary'; op: FormulaBinaryOperator; left: FormulaNode; right: FormulaNode };

export type FormulaAst = {
  version: 1;
  templateId?: FormulaTemplateId;
  root: FormulaNode;
  variables: Partial<Record<FormulaVariableKey, number>>;
};

export type FormulaEvaluation = {
  ok: boolean;
  value?: number;
  error?: string;
};
export type OvermeasureDecisionType = 'OVERMEASURE' | 'DEDUCT' | 'SPLIT';
export type OvermeasureTargetKind = 'OPENING' | 'NICHE';

export type OpeningOrNiche = {
  id: string;
  kind: OvermeasureTargetKind;
  roomId: string;
  positionId: string;
  width: number;
  height: number;
  depth?: number;
  count: number;
  note?: string;
};

export type OvermeasureDecision = {
  itemId: string;
  appliedRuleId: string;
  decision: OvermeasureDecisionType;
  baseArea: number;
  deductedArea: number;
  overmeasuredArea: number;
  netArea: number;
  reason: string;
};

export type OvermeasureBreakdown = {
  gross: number;
  deducted: number;
  overmeasured: number;
  net: number;
  decisions: OvermeasureDecision[];
};

export type AufmassPosition = {
  id: string;
  code: string;
  title: string;
  unit: AufmassUnit;
};

export type AufmassMeasurement = {
  id: string;
  roomId: string;
  positionId: string;
  label: string;
  formula: string;
  formulaAst?: FormulaAst;
  formulaSource?: FormulaSource;
  formulaMigrationStatus?: FormulaMigrationStatus;
  quantity: number;
  unit: AufmassUnit;
  note?: string;
  photoCount?: number;
  actualEffortHours?: number;
  actualMaterialQuantity?: number;
  openingsOrNiches?: OpeningOrNiche[];
  createdAt: string;
};

export type AufmassPositionMapping = {
  id: string;
  positionId: string;
  roomId: string;
  mappedBy: string;
  mappedAt: string;
};

export type AufmassReviewIssueSeverity = 'info' | 'warning' | 'blocking';

export type AufmassReviewIssue = {
  id: string;
  type:
    | 'missing_measurement'
    | 'quantity_outlier'
    | 'missing_mapping'
    | 'missing_note'
    | 'overmeasure_missing_dimensions'
    | 'overmeasure_rule_conflict'
    | 'legacy_formula_partial'
    | 'legacy_formula_unparsed';
  title: string;
  message: string;
  severity: AufmassReviewIssueSeverity;
  positionId?: string;
  roomId?: string;
  createdAt: string;
};

export type AufmassAuditEvent = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type AufmassRoom = {
  id: string;
  building: string;
  level: string;
  name: string;
  areaM2?: number;
};

export type AufmassRecord = {
  id: string;
  number: string;
  projectName: string;
  customerName: string;
  siteName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  status: AufmassStatus;
  version: number;
  revisionOfId?: string;
  rooms: AufmassRoom[];
  positions: AufmassPosition[];
  measurements: AufmassMeasurement[];
  mappings: AufmassPositionMapping[];
  reviewIssues: AufmassReviewIssue[];
  auditTrail: AufmassAuditEvent[];
};

export type AufmassFilters = {
  query: string;
  status: 'ALL' | AufmassStatus;
};
