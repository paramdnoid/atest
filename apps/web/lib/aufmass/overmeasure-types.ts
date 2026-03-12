import type {
  OvermeasureDecisionType,
  OvermeasureTargetKind,
  AufmassUnit,
} from '@/lib/aufmass/types';

export type OvermeasureRuleScope = 'global' | 'trade' | 'position';

export type OvermeasureRule = {
  id: string;
  scope: OvermeasureRuleScope;
  kind: OvermeasureTargetKind;
  unit: AufmassUnit;
  threshold: number;
  decision: OvermeasureDecisionType;
  priority: number;
  rounding: 2 | 3;
  positionCodes?: string[];
  requiresDepth?: boolean;
  splitThreshold?: number;
  reasonTemplate: string;
};

export type RuleProfile = {
  profileId: string;
  version: number;
  legalReference: string;
  fallbackPolicy: 'DEDUCT';
  rules: OvermeasureRule[];
};
