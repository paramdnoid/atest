import type { DefectEntry } from '@/lib/abnahmen/types';

export type EvidenceIssue = {
  defectId: string;
  evidenceId?: string;
  level: 'blocking' | 'warning';
  message: string;
};

export function getEvidencePolicyIssues(defects: DefectEntry[]): EvidenceIssue[] {
  const issues: EvidenceIssue[] = [];

  for (const defect of defects) {
    for (const evidence of defect.evidence) {
      if ((evidence.hasPeople || evidence.hasLicensePlate) && !evidence.redacted) {
        issues.push({
          defectId: defect.id,
          evidenceId: evidence.id,
          level: 'blocking',
          message: `Evidenz "${evidence.label}" enthält personenbezogene Merkmale ohne Redaktion.`,
        });
      }
      if (evidence.hasPeople && !evidence.legalBasis) {
        issues.push({
          defectId: defect.id,
          evidenceId: evidence.id,
          level: 'blocking',
          message: `Für Evidenz "${evidence.label}" fehlt die Rechtsgrundlage.`,
        });
      }
    }

    if (defect.severity === 'critical' && defect.evidence.length === 0) {
      issues.push({
        defectId: defect.id,
        level: 'warning',
        message: `Kritischer Mangel ${defect.ref} sollte mit Fotoevidenz dokumentiert werden.`,
      });
    }
  }

  return issues;
}

export function getEvidenceBlockingMessages(defects: DefectEntry[]): string[] {
  return getEvidencePolicyIssues(defects)
    .filter((issue) => issue.level === 'blocking')
    .map((issue) => issue.message);
}
