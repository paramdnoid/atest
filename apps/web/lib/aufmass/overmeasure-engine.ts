import type {
  AufmassMeasurement,
  AufmassReviewIssue,
  OvermeasureBreakdown,
  OvermeasureDecision,
  OpeningOrNiche,
} from '@/lib/aufmass/types';
import { MALER_VOB_RULE_PROFILE } from '@/lib/aufmass/overmeasure-rules';
import type { OvermeasureRule, RuleProfile } from '@/lib/aufmass/overmeasure-types';

function round(value: number, digits: 2 | 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toFinitePositive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getOpeningSurfaceArea(item: OpeningOrNiche): number {
  return toFinitePositive(item.width) * toFinitePositive(item.height) * Math.max(1, toFinitePositive(item.count));
}

function ruleApplies(rule: OvermeasureRule, item: OpeningOrNiche, positionCode?: string): boolean {
  if (rule.kind !== item.kind) return false;
  if (rule.positionCodes && positionCode && !rule.positionCodes.includes(positionCode)) return false;
  return true;
}

function findBestRule(
  item: OpeningOrNiche,
  surfaceArea: number,
  rules: OvermeasureRule[],
  positionCode?: string,
): OvermeasureRule | null {
  const candidates = rules
    .filter((rule) => ruleApplies(rule, item, positionCode))
    .filter((rule) => {
      if (!Number.isFinite(surfaceArea)) return false;
      if (rule.decision === 'OVERMEASURE') return surfaceArea <= rule.threshold;
      if (rule.decision === 'DEDUCT') return surfaceArea > rule.threshold;
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
  return candidates[0] ?? null;
}

function makeDecision(
  item: OpeningOrNiche,
  rule: OvermeasureRule,
  surfaceArea: number,
): OvermeasureDecision {
  const shouldOvermeasure = rule.decision === 'OVERMEASURE' && surfaceArea <= rule.threshold;
  const shouldDeduct = rule.decision === 'DEDUCT' && surfaceArea > rule.threshold;

  let deductedArea = 0;
  let overmeasuredArea = 0;

  if (rule.decision === 'SPLIT') {
    const splitThreshold = rule.splitThreshold ?? rule.threshold;
    overmeasuredArea = Math.min(surfaceArea, splitThreshold);
    deductedArea = Math.max(0, surfaceArea - splitThreshold);
  } else if (shouldOvermeasure) {
    overmeasuredArea = surfaceArea;
  } else if (shouldDeduct) {
    deductedArea = surfaceArea;
  }

  const netArea = Math.max(0, surfaceArea - deductedArea);

  return {
    itemId: item.id,
    appliedRuleId: rule.id,
    decision: rule.decision,
    baseArea: round(surfaceArea, rule.rounding),
    deductedArea: round(deductedArea, rule.rounding),
    overmeasuredArea: round(overmeasuredArea, rule.rounding),
    netArea: round(netArea, rule.rounding),
    reason: rule.reasonTemplate,
  };
}

export function getOvermeasureBreakdown(
  measurement: AufmassMeasurement,
  positionCode?: string,
  profile: RuleProfile = MALER_VOB_RULE_PROFILE,
): OvermeasureBreakdown {
  const openings = measurement.openingsOrNiches ?? [];
  const decisions: OvermeasureDecision[] = [];
  let deducted = 0;
  let overmeasured = 0;

  for (const item of openings) {
    const surfaceArea = getOpeningSurfaceArea(item);
    const rule = findBestRule(item, surfaceArea, profile.rules, positionCode);
    if (!rule) continue;

    const decision = makeDecision(item, rule, surfaceArea);
    decisions.push(decision);
    deducted += decision.deductedArea;
    overmeasured += decision.overmeasuredArea;
  }

  const gross = measurement.quantity;
  const net = Math.max(0, gross - deducted);
  return {
    gross: round(gross, 2),
    deducted: round(deducted, 2),
    overmeasured: round(overmeasured, 2),
    net: round(net, 2),
    decisions,
  };
}

export function getOvermeasureReviewIssues(
  measurement: AufmassMeasurement,
  positionCode?: string,
): AufmassReviewIssue[] {
  const issues: AufmassReviewIssue[] = [];
  const openings = measurement.openingsOrNiches ?? [];
  const issueCreatedAt = measurement.createdAt;

  for (const item of openings) {
    const surfaceArea = getOpeningSurfaceArea(item);
    if (item.width <= 0 || item.height <= 0 || item.count <= 0) {
      issues.push({
        id: `issue-overmeasure-missing-${measurement.id}-${item.id}`,
        type: 'overmeasure_missing_dimensions',
        title: 'Unvollständige Öffnungs-/Nischenmaße',
        message: 'Breite, Höhe und Anzahl müssen > 0 sein.',
        severity: 'blocking',
        positionId: measurement.positionId,
        roomId: measurement.roomId,
        createdAt: issueCreatedAt,
      });
      continue;
    }

    const rule = findBestRule(item, surfaceArea, MALER_VOB_RULE_PROFILE.rules, positionCode);
    if (!rule) {
      issues.push({
        id: `issue-overmeasure-conflict-${measurement.id}-${item.id}`,
        type: 'overmeasure_rule_conflict',
        title: 'Keine passende Overmeasure-Regel gefunden',
        message: `Für ${item.kind} konnte keine Regel zugeordnet werden.`,
        severity: 'blocking',
        positionId: measurement.positionId,
        roomId: measurement.roomId,
        createdAt: issueCreatedAt,
      });
    }
  }

  return issues;
}
